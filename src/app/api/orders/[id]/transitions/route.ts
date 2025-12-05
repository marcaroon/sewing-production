// app/api/orders/[id]/transitions/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/orders/[id]/transitions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const transitions = await prisma.processTransition.findMany({
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
        transitionTime: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: transitions,
    });
  } catch (error) {
    console.error("Error fetching transitions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch transitions",
      },
      { status: 500 }
    );
  }
}
