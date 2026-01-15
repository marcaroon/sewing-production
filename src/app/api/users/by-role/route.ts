// src/app/api/users/by-role/route.ts - FIXED: Use Department
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDepartmentForProcess } from "@/lib/permissions";

/**
 * ✅ FIXED: Get users by DEPARTMENT (not role)
 * GET /api/users/by-role?processName=sewing
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const processName = searchParams.get("processName");

    if (!processName) {
      return NextResponse.json(
        { success: false, error: "processName is required" },
        { status: 400 }
      );
    }

    console.log(`[API] Finding users for process: ${processName}`);

    const validDepartments = getDepartmentForProcess(processName as any);

    console.log(
      `[API] Valid departments for ${processName}:`,
      validDepartments
    );

    const users = await prisma.user.findMany({
      where: {
        department: { in: validDepartments },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        department: true, 
        isAdmin: true,
      },
      orderBy: { name: "asc" },
    });

    console.log(`[API] Found ${users.length} users`);

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
