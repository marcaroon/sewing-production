// app/api/orders/[id]/rejects/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/orders/[id]/rejects
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rejects = await prisma.rejectLog.findMany({
      where: {
        orderId: (await params).id,
      },
      include: {
        processStep: {
          select: {
            processName: true,
            department: true,
          },
        },
      },
      orderBy: {
        detectedTime: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: rejects,
    });
  } catch (error) {
    console.error("Error fetching rejects:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch rejects",
      },
      { status: 500 }
    );
  }
}
