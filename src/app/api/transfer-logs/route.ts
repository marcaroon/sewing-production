// src/app/api/transfer-logs/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/transfer-logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const status = searchParams.get("status");
    const department = searchParams.get("department");

    const where: any = {};
    if (orderId) where.orderId = orderId;
    if (status && status !== "all") where.status = status;
    if (department) {
      where.OR = [{ fromDepartment: department }, { toDepartment: department }];
    }

    const transferLogs = await prisma.transferLog.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            buyer: { select: { name: true } },
            style: { select: { name: true } },
          },
        },
        processStep: {
          select: {
            processName: true,
            department: true,
          },
        },
      },
      orderBy: { transferDate: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: transferLogs,
    });
  } catch (error) {
    console.error("Error fetching transfer logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transfer logs" },
      { status: 500 }
    );
  }
}
