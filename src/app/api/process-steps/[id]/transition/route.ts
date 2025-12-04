// app/api/process-steps/[id]/transition/route.ts
// Handle state transitions for process steps

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { 
  isValidStateTransition,
  getNextProcess,
  getNextPhase,
  PROCESS_DEPARTMENT_MAP 
} from "@/lib/constants-new";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const processStepId = (await params).id;
    const body = await request.json();
    
    const { 
      newState, 
      performedBy, 
      assignedTo, 
      assignedLine,
      quantity,
      notes 
    } = body;

    // Validate required fields
    if (!newState || !performedBy) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: newState and performedBy",
        },
        { status: 400 }
      );
    }

    // Get current process step
    const processStep = await prisma.processStep.findUnique({
      where: { id: processStepId },
      include: {
        order: {
          include: {
            buyer: true,
            style: true,
          },
        },
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

    // Determine current state from process step status and timestamps
    let currentState = "at_ppic";
    if (processStep.completedTime) {
      currentState = "completed";
    } else if (processStep.startedTime) {
      currentState = "in_progress";
    } else if (processStep.assignedTime) {
      currentState = "assigned";
    } else if (processStep.addedToWaitingTime) {
      currentState = "waiting";
    }

    // Validate transition
    if (!isValidStateTransition(currentState as any, newState)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid transition from ${currentState} to ${newState}`,
        },
        { status: 400 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update process step with new state timestamp
      const now = new Date();
      const updateData: any = {
        updatedAt: now,
      };

      // Set appropriate timestamp based on new state
      switch (newState) {
        case "at_ppic":
          updateData.arrivedAtPpicTime = now;
          break;
        case "waiting":
          updateData.addedToWaitingTime = now;
          // Calculate waiting duration when moving from waiting
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
          if (quantity) {
            updateData.quantityCompleted = quantity;
          }
          
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

      if (notes) {
        updateData.notes = notes;
      }

      const updatedProcessStep = await tx.processStep.update({
        where: { id: processStepId },
        data: updateData,
      });

      // 2. Log the transition
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

      // 3. Update order if completed
      let nextProcessStep = null;
      if (newState === "completed") {
        // Update order's current state back to at_ppic
        await tx.order.update({
          where: { id: processStep.orderId },
          data: {
            currentState: "at_ppic",
            updatedAt: now,
          },
        });

        // Check if this is the last process in current phase
        const nextProcess = getNextProcess(
          processStep.processName as any,
          processStep.processPhase as any
        );

        if (nextProcess) {
          const nextPhase = getNextPhase(
            processStep.processName as any,
            processStep.processPhase as any
          );

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

          // Update order to reflect next process
          await tx.order.update({
            where: { id: processStep.orderId },
            data: {
              currentProcess: nextProcess,
              currentPhase: nextPhase || processStep.processPhase,
              currentState: "at_ppic",
            },
          });

          // Log transition for new process step
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
          // This was the last process - mark order as completed
          await tx.order.update({
            where: { id: processStep.orderId },
            data: {
              currentProcess: "delivered",
              currentState: "completed",
              totalCompleted: updatedProcessStep.quantityCompleted,
            },
          });
        }
      } else {
        // Update order's current state
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
      };
    });

    return NextResponse.json({
      success: true,
      message: `Transitioned from ${currentState} to ${newState}`,
      data: {
        processStep: result.processStep,
        transition: result.transition,
        nextProcessStep: result.nextProcessStep,
      },
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