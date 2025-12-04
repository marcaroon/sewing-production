// app/api/orders/[id]/update-status/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/orders/[id]/update-status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;
    const { processStepId, newState, performedBy, notes, ...transitionData } =
      body;

    // Redirect to process step transition endpoint
    const response = await fetch(
      `/api/process-steps/${processStepId}/transition`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newState,
          performedBy,
          notes,
          ...transitionData,
        }),
      }
    );

    return response;
  } catch (error) {
    console.error("Error updating status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update status" },
      { status: 500 }
    );
  }
}
