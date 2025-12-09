// ========================================
// app/api/transfer-logs/[id]/route.ts
// Get, update, delete specific transfer log
// ========================================

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const transferLog = await prisma.transferLog.findUnique({
      where: { id: (await params).id },
      include: {
        order: {
          include: {
            buyer: true,
            style: true,
          },
        },
        processStep: {
          include: {
            rejects: true,
          },
        },
      },
    });

    if (!transferLog) {
      return NextResponse.json(
        { success: false, error: "Transfer log not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transferLog,
    });
  } catch (error) {
    console.error("Error fetching transfer log:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transfer log" },
      { status: 500 }
    );
  }
}
