// ========================================
// app/api/transfer-logs/[id]/receive/route.ts
// Receive/acknowledge transfer
// ========================================

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { receivedBy, issues, notes } = body;

    if (!receivedBy) {
      return NextResponse.json(
        { success: false, error: "receivedBy is required" },
        { status: 400 }
      );
    }

    const transferLog = await prisma.transferLog.update({
      where: { id: (await params).id },
      data: {
        receivedBy,
        receivedDate: new Date(),
        isReceived: true,
        status: issues ? "disputed" : "received",
        issues: issues || null,
        notes: notes || null,
      },
      include: {
        order: true,
        processStep: true,
      },
    });

    // If received successfully, update next process step to "waiting"
    if (!issues) {
      const nextProcessStep = await prisma.processStep.findFirst({
        where: {
          orderId: transferLog.orderId,
          processName: transferLog.toProcess,
          status: "pending",
        },
      });

      if (nextProcessStep) {
        await prisma.processStep.update({
          where: { id: nextProcessStep.id },
          data: {
            addedToWaitingTime: new Date(),
          },
        });

        // Create transition
        await prisma.processTransition.create({
          data: {
            orderId: transferLog.orderId,
            processStepId: nextProcessStep.id,
            fromState: "at_ppic",
            toState: "waiting",
            transitionTime: new Date(),
            performedBy: receivedBy,
            processName: nextProcessStep.processName,
            department: nextProcessStep.department,
            notes: `Received transfer ${transferLog.transferNumber}`,
          },
        });

        // Update order state
        await prisma.order.update({
          where: { id: transferLog.orderId },
          data: {
            currentState: "waiting",
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Transfer received successfully",
      data: transferLog,
    });
  } catch (error) {
    console.error("Error receiving transfer:", error);
    return NextResponse.json(
      { success: false, error: "Failed to receive transfer" },
      { status: 500 }
    );
  }
}
