// src/app/api/users/by-role/route.ts - FILE BARU
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getRoleForProcess } from "@/lib/permissions";

// GET /api/users/by-role?processName=sewing
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

    // Get roles yang bisa handle process ini
    const validRoles = getRoleForProcess(processName as any);

    // Get users dengan role tersebut
    const users = await prisma.user.findMany({
      where: {
        role: { in: validRoles },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
        department: true,
      },
      orderBy: { name: "asc" },
    });

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
