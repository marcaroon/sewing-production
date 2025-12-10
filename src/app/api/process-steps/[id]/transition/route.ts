// app/api/process-steps/[id]/transition/route.ts
// Updated to auto-generate transfer logs

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  isValidStateTransition,
  getNextProcess,
  getNextPhase,
  PROCESS_DEPARTMENT_MAP,
} from "@/lib/constants-new";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const processStepId = (await params).id;
    const body = await request.json();

    const { newState, performedBy, assignedTo, assignedLine, quantity, notes } =
      body;

    if (!newState || !performedBy) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const processStep = await prisma.processStep.findUnique({
      where: { id: processStepId },
      include: {
        order: {
          include: {
            buyer: true,
            style: true,
          },
        },
        rejects: true, // Include rejects for transfer log
      },
    });

    if (!processStep) {
      return NextResponse.json(
        { success: false, error: "Process step not found" },
        { status: 404 }
      );
    }

    // Determine current state
    let currentState = "at_ppic";
    if (processStep.completedTime) currentState = "completed";
    else if (processStep.startedTime) currentState = "in_progress";
    else if (processStep.assignedTime) currentState = "assigned";
    else if (processStep.addedToWaitingTime) currentState = "waiting";

    if (!isValidStateTransition(currentState as any, newState)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid transition from ${currentState} to ${newState}`,
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const updateData: any = { updatedAt: now };

      // Set appropriate timestamp
      switch (newState) {
        case "at_ppic":
          updateData.arrivedAtPpicTime = now;
          break;
        case "waiting":
          updateData.addedToWaitingTime = now;
          if (processStep.addedToWaitingTime && newState !== "waiting") {
            const waitStart = new Date(processStep.addedToWaitingTime);
            updateData.waitingDuration = Math.round(
              (now.getTime() - waitStart.getTime()) / (1000 * 60)
            );
          }
          break;
        case "assigned":
          updateData.assignedTime = now;
          if (assignedTo) updateData.assignedTo = assignedTo;
          if (assignedLine) updateData.assignedLine = assignedLine;
          break;
        case "in_progress":
          updateData.startedTime = now;
          updateData.status = "in_progress";
          break;
        case "completed":
          updateData.completedTime = now;
          updateData.status = "completed";
          if (quantity) updateData.quantityCompleted = quantity;

          // Calculate durations
          if (processStep.startedTime) {
            const procStart = new Date(processStep.startedTime);
            updateData.processingDuration = Math.round(
              (now.getTime() - procStart.getTime()) / (1000 * 60)
            );
          }
          if (processStep.arrivedAtPpicTime) {
            const totalStart = new Date(processStep.arrivedAtPpicTime);
            updateData.totalDuration = Math.round(
              (now.getTime() - totalStart.getTime()) / (1000 * 60)
            );
          }
          break;
      }

      if (notes) updateData.notes = notes;

      const updatedProcessStep = await tx.processStep.update({
        where: { id: processStepId },
        data: updateData,
      });

      // Log transition
      const transition = await tx.processTransition.create({
        data: {
          orderId: processStep.orderId,
          processStepId: processStepId,
          fromState: currentState,
          toState: newState,
          transitionTime: now,
          performedBy,
          processName: processStep.processName,
          department: processStep.department,
          quantity,
          notes,
        },
      });

      let nextProcessStep = null;
      let transferLog = null;

      // ====== GENERATE TRANSFER LOG WHEN COMPLETED ======
      // ====== GENERATE TRANSFER LOG WHEN COMPLETED ======
      if (newState === "completed") {
        // Update order to at_ppic (PPIC will assign next process)
        await tx.order.update({
          where: { id: processStep.orderId },
          data: {
            currentState: "at_ppic",
            currentProcess: processStep.processName, // Keep current until PPIC assigns next
            updatedAt: now,
          },
        });

        // Get all completed process steps to know history
        const completedSteps = await tx.processStep.findMany({
          where: {
            orderId: processStep.orderId,
            status: "completed",
          },
          select: { processName: true },
        });

        const completedProcessNames = completedSteps.map((s) => s.processName);

        // Generate Transfer Log (without creating next step yet)
        const year = now.getFullYear();
        const count = await tx.transferLog.count({
          where: { transferNumber: { startsWith: `TRF-${year}` } },
        });
        const transferNumber = `TRF-${year}-${String(count + 1).padStart(
          5,
          "0"
        )}`;

        const rejectSummary =
          processStep.rejects.length > 0
            ? JSON.stringify(
                processStep.rejects.map((r) => ({
                  type: r.rejectType,
                  category: r.rejectCategory,
                  quantity: r.quantity,
                  description: r.description,
                  action: r.action,
                }))
              )
            : null;

        transferLog = await tx.transferLog.create({
          data: {
            transferNumber,
            orderId: processStep.orderId,
            processStepId: processStep.id,
            fromProcess: processStep.processName,
            fromDepartment: processStep.department,
            toProcess: "to_be_assigned", // PPIC will assign
            toDepartment: "PPIC",
            transferDate: now,
            handedOverBy: performedBy,
            quantityTransferred: updatedProcessStep.quantityCompleted,
            quantityCompleted: updatedProcessStep.quantityCompleted,
            quantityRejected: updatedProcessStep.quantityRejected,
            quantityRework: updatedProcessStep.quantityRework,
            rejectSummary,
            processingDuration: updatedProcessStep.processingDuration,
            waitingDuration: updatedProcessStep.waitingDuration,
            status: "pending",
            notes:
              notes ||
              `Completed ${processStep.processName}, awaiting PPIC assignment`,
          },
        });
      } else {
        // Update order's current state (not completed)
        await tx.order.update({
          where: { id: processStep.orderId },
          data: {
            currentState: newState,
            ...(assignedTo && { assignedTo }),
            ...(assignedLine && { assignedLine }),
            updatedAt: now,
          },
        });
      }

      return {
        processStep: updatedProcessStep,
        transition,
        nextProcessStep,
        transferLog, // Include transfer log in response
      };
    });

    return NextResponse.json({
      success: true,
      message: `Transitioned from ${currentState} to ${newState}`,
      data: result,
    });
  } catch (error) {
    console.error("Error transitioning process step:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to transition process step",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
