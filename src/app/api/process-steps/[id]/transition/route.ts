// app/api/process-steps/[id]/transition/route.ts - FIXED VERSION
// Progress bar akan update ketika process completed

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  isValidStateTransition,
  getNextProcess,
  getNextPhase,
  PROCESS_DEPARTMENT_MAP,
} from "@/lib/constants-new";
import { canExecuteProcess, UserRole } from "@/lib/permissions";
import { ProcessName } from "@/lib/types-new";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required. Please log in.",
        },
        { status: 401 }
      );
    }

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
            sizeBreakdowns: true,
          },
        },
        rejects: true,
      },
    });

    if (!processStep) {
      return NextResponse.json(
        { success: false, error: "Process step not found" },
        { status: 404 }
      );
    }

    if (
      !canExecuteProcess(
        currentUser.role as UserRole,
        processStep.processName as ProcessName
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `You don't have permission to execute ${processStep.processName}...`,
        },
        { status: 403 }
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

          // IMPORTANT: Set quantityCompleted from quantity parameter
          const completedQty = quantity || processStep.quantityReceived;
          updateData.quantityCompleted = completedQty;

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
          quantity: quantity || processStep.quantityReceived,
          notes,
        },
      });

      let nextProcessStep = null;
      let transferLog = null;

      // ====== WHEN COMPLETED: Update Order totalCompleted & Create Transfer Log ======
      if (newState === "completed") {
        const completedQty = quantity || processStep.quantityReceived;

        // CRITICAL FIX: Update Order's totalCompleted
        // This is what makes the progress bar work!
        await tx.order.update({
          where: { id: processStep.orderId },
          data: {
            currentState: "at_ppic",
            totalCompleted: completedQty, // Update total completed for progress bar
            updatedAt: now,
          },
        });

        const nextProcess = getNextProcess(
          processStep.processName as any,
          processStep.processPhase as any
        );

        if (nextProcess) {
          const nextPhase = getNextPhase(
            processStep.processName as any,
            processStep.processPhase as any
          );

          // Generate Transfer Number
          const year = now.getFullYear();
          const count = await tx.transferLog.count({
            where: { transferNumber: { startsWith: `TRF-${year}` } },
          });
          const transferNumber = `TRF-${year}-${String(count + 1).padStart(
            5,
            "0"
          )}`;

          // Prepare reject summary
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

          // Create Transfer Log (Surat Jalan)
          transferLog = await tx.transferLog.create({
            data: {
              transferNumber,
              orderId: processStep.orderId,
              processStepId: processStep.id,
              fromProcess: processStep.processName,
              fromDepartment: processStep.department,
              toProcess: nextProcess,
              toDepartment: PROCESS_DEPARTMENT_MAP[nextProcess],
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
                `Transfer from ${processStep.processName} to ${nextProcess}`,
            },
          });

          // Create next process step
          const sequenceOrder = updatedProcessStep.sequenceOrder + 1;
          nextProcessStep = await tx.processStep.create({
            data: {
              orderId: processStep.orderId,
              processName: nextProcess,
              processPhase: nextPhase || processStep.processPhase,
              sequenceOrder,
              department: PROCESS_DEPARTMENT_MAP[nextProcess],
              status: "pending",
              quantityReceived: updatedProcessStep.quantityCompleted,
              arrivedAtPpicTime: now,
            },
          });

          await tx.order.update({
            where: { id: processStep.orderId },
            data: {
              currentProcess: nextProcess,
              currentPhase: nextPhase || processStep.processPhase,
              currentState: "at_ppic",
            },
          });

          await tx.processTransition.create({
            data: {
              orderId: processStep.orderId,
              processStepId: nextProcessStep.id,
              fromState: "at_ppic",
              toState: "at_ppic",
              transitionTime: now,
              performedBy: "SYSTEM",
              processName: nextProcess,
              department: PROCESS_DEPARTMENT_MAP[nextProcess],
              notes: `Auto-created from completion of ${processStep.processName}`,
            },
          });
        } else {
          // Last process - mark as completed
          await tx.order.update({
            where: { id: processStep.orderId },
            data: {
              currentProcess: "delivered",
              currentState: "completed",
              totalCompleted: completedQty, // Ensure totalCompleted is set
            },
          });
        }
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
        transferLog,
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
