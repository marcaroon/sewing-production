// app/api/process-steps/[id]/reject/route.ts
// Record reject/rework for a process step

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const processStepId = (await params).id;
    const body = await request.json();

    const {
      rejectType,
      rejectCategory,
      quantity,
      size,
      bundleNumber,
      description,
      rootCause,
      action,
      reportedBy,
      images,
    } = body;

    // Validate required fields
    if (
      !rejectType ||
      !rejectCategory ||
      !quantity ||
      !description ||
      !action ||
      !reportedBy
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Get process step
    const processStep = await prisma.processStep.findUnique({
      where: { id: processStepId },
      include: {
        order: true,
      },
    });

    if (!processStep) {
      return NextResponse.json(
        {
          success: false,
          error: "Process step not found",
        },
        { status: 404 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create reject log
      const rejectLog = await tx.rejectLog.create({
        data: {
          orderId: processStep.orderId,
          processStepId: processStepId,
          processName: processStep.processName,
          processPhase: processStep.processPhase,
          detectedTime: new Date(),
          reportedBy,
          rejectType,
          rejectCategory,
          quantity,
          size,
          bundleNumber,
          description,
          rootCause,
          action,
          images: images ? JSON.stringify(images) : null,
          reworkCompleted: false,
        },
      });

      // 2. Update process step quantities
      const updateData: any = {
        quantityRejected: processStep.quantityRejected + quantity,
      };

      if (rejectCategory === "rework") {
        updateData.quantityRework = processStep.quantityRework + quantity;
      }

      const updatedProcessStep = await tx.processStep.update({
        where: { id: processStepId },
        data: updateData,
      });

      // 3. Update order totals
      const orderUpdateData: any = {
        totalRejected: processStep.order.totalRejected + quantity,
        updatedAt: new Date(),
      };

      if (rejectCategory === "rework") {
        orderUpdateData.totalRework = processStep.order.totalRework + quantity;
      }

      await tx.order.update({
        where: { id: processStep.orderId },
        data: orderUpdateData,
      });

      // 4. Create transition log for documentation
      await tx.processTransition.create({
        data: {
          orderId: processStep.orderId,
          processStepId: processStepId,
          fromState: "in_progress",
          toState: "in_progress", // stays in progress
          transitionTime: new Date(),
          performedBy: reportedBy,
          processName: processStep.processName,
          department: processStep.department,
          quantity,
          notes: `${rejectCategory.toUpperCase()}: ${description}`,
        },
      });

      return {
        rejectLog,
        processStep: updatedProcessStep,
      };
    });

    return NextResponse.json({
      success: true,
      message: `${
        rejectCategory === "reject" ? "Reject" : "Rework"
      } recorded successfully`,
      data: result.rejectLog,
    });
  } catch (error) {
    console.error("Error recording reject:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to record reject",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET - Get all rejects for a process step
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const processStepId = (await params).id;

    const rejects = await prisma.rejectLog.findMany({
      where: { processStepId },
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

// ================================================================
// app/api/reject-logs/[id]/complete-rework/route.ts
// Complete rework for a reject log
// ================================================================

export async function PUT_CompleteRework(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rejectLogId = (await params).id;
    const body = await request.json();

    const { completedBy, finalDisposition, notes } = body;

    // Validate
    if (!completedBy || !finalDisposition) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: completedBy and finalDisposition",
        },
        { status: 400 }
      );
    }

    if (!["passed", "scrapped"].includes(finalDisposition)) {
      return NextResponse.json(
        {
          success: false,
          error: "finalDisposition must be 'passed' or 'scrapped'",
        },
        { status: 400 }
      );
    }

    // Get reject log
    const rejectLog = await prisma.rejectLog.findUnique({
      where: { id: rejectLogId },
      include: {
        processStep: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!rejectLog) {
      return NextResponse.json(
        {
          success: false,
          error: "Reject log not found",
        },
        { status: 404 }
      );
    }

    if (rejectLog.rejectCategory !== "rework") {
      return NextResponse.json(
        {
          success: false,
          error: "This is not a rework item",
        },
        { status: 400 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update reject log
      const now = new Date();
      const updatedRejectLog = await tx.rejectLog.update({
        where: { id: rejectLogId },
        data: {
          reworkCompleted: true,
          reworkCompletedTime: now,
          finalDisposition,
          actionTakenBy: completedBy,
          actionTakenTime: now,
          notes: notes || rejectLog.notes,
        },
      });

      // 2. Update process step
      if (finalDisposition === "passed") {
        // Add back to completed quantity
        await tx.processStep.update({
          where: { id: rejectLog.processStepId },
          data: {
            quantityCompleted: {
              increment: rejectLog.quantity,
            },
            quantityRework: {
              decrement: rejectLog.quantity,
            },
          },
        });
      } else if (finalDisposition === "scrapped") {
        // Remove from rework, don't add to completed
        await tx.processStep.update({
          where: { id: rejectLog.processStepId },
          data: {
            quantityRework: {
              decrement: rejectLog.quantity,
            },
          },
        });
      }

      // 3. Log transition
      await tx.processTransition.create({
        data: {
          orderId: rejectLog.orderId,
          processStepId: rejectLog.processStepId,
          fromState: "in_progress",
          toState: "in_progress",
          transitionTime: now,
          performedBy: completedBy,
          processName: rejectLog.processName,
          department: rejectLog.processStep.department,
          quantity: rejectLog.quantity,
          notes: `Rework ${finalDisposition}: ${notes || ""}`,
        },
      });

      return updatedRejectLog;
    });

    return NextResponse.json({
      success: true,
      message: `Rework marked as ${finalDisposition}`,
      data: result,
    });
  } catch (error) {
    console.error("Error completing rework:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to complete rework",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
