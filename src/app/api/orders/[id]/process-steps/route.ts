// app/api/orders/[id]/process-steps/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/orders/[id]/process-steps
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orderId = (await params).id;

    const processSteps = await prisma.processStep.findMany({
      where: { orderId },
      include: {
        transitions: {
          orderBy: { transitionTime: "desc" },
        },
        rejects: {
          orderBy: { detectedTime: "desc" },
        },
      },
      orderBy: { sequenceOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: processSteps,
    });
  } catch (error) {
    console.error("Error fetching process steps:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch process steps" },
      { status: 500 }
    );
  }
}
