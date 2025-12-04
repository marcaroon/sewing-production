// app/api/orders/[id]/history/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/orders/[id]/history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise <{ id: string }> }
) {
  try {
    const history = await prisma.processHistory.findMany({
      where: {
        orderId: (await params).id,
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching process history:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch process history",
      },
      { status: 500 }
    );
  }
}
