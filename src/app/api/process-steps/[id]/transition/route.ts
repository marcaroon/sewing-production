// app/api/process-steps/[id]/transition/route.ts - SIMPLIFIED FLOW
// Waiting → Received → In Progress → Completed → Back to Waiting (next process)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  PROCESS_DEPARTMENT_MAP,
  getNextProcess,
  getNextPhase,
  PRODUCTION_PROCESSES,
  DELIVERY_PROCESSES,
} from "@/lib/constants-new";
import { canExecuteProcess } from "@/lib/permissions";
import { ProcessName } from "@/lib/types-new";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const processStepId = (await params).id;

    const transitions = await prisma.processTransition.findMany({
      where: {
        processStepId: processStepId,
      },
      orderBy: {
        transitionTime: "desc", // Urutkan dari yang terbaru
      },
    });

    return NextResponse.json({
      success: true,
      data: transitions,
    });
  } catch (error) {
    console.error("Error fetching transition history:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch transition history",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const processStepId = (await params).id;
    const body = await request.json();
    const { action, performedBy, quantity, notes } = body;

    // Simplified actions: 'receive', 'start', 'complete'
    if (!action || !performedBy) {
      return NextResponse.json(
        { success: false, error: "Missing action or performedBy" },
        { status: 400 }
      );
    }

    const processStep = await prisma.processStep.findUnique({
      where: { id: processStepId },
      include: {
        order: { include: { buyer: true, style: true } },
        rejects: true,
      },
    });

    if (!processStep) {
      return NextResponse.json(
        { success: false, error: "Process step not found" },
        { status: 404 }
      );
    }

    // ✅ FIX: Check permission with isAdmin flag
    const hasPermission = canExecuteProcess(
      currentUser.department,
      processStep.processName as ProcessName,
      currentUser.isAdmin || false
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: `Permission denied. Only ${processStep.department} can execute ${processStep.processName}`,
        },
        { status: 403 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      let updateData: any = { updatedAt: now };
      let transitionFrom = "";
      let transitionTo = "";

      // ========== ACTION: RECEIVE (from waiting list) ==========
      if (action === "receive") {
        if (processStep.status !== "pending") {
          throw new Error("Can only receive process in pending status");
        }

        updateData.status = "in_progress";
        updateData.addedToWaitingTime = processStep.addedToWaitingTime || now;
        updateData.startedTime = now;

        // Calculate waiting duration
        if (processStep.addedToWaitingTime) {
          const waitStart = new Date(processStep.addedToWaitingTime);
          updateData.waitingDuration = Math.round(
            (now.getTime() - waitStart.getTime()) / (1000 * 60)
          );
        }

        transitionFrom = "waiting";
        transitionTo = "in_progress";

        // Update transfer log status if exists
        const pendingTransfer = await tx.transferLog.findFirst({
          where: {
            orderId: processStep.orderId,
            toProcess: processStep.processName,
            status: "pending",
          },
          orderBy: { transferDate: "desc" },
        });

        if (pendingTransfer) {
          await tx.transferLog.update({
            where: { id: pendingTransfer.id },
            data: {
              receivedBy: performedBy,
              receivedDate: now,
              isReceived: true,
              status: "received",
            },
          });
        }
      }
      // ========== ACTION: START (old flow, kept for compatibility) ==========
      else if (action === "start") {
        if (processStep.status === "completed") {
          throw new Error("Cannot start completed process");
        }

        updateData.status = "in_progress";
        updateData.startedTime = now;
        transitionFrom = processStep.status;
        transitionTo = "in_progress";
      }
      // ========== ACTION: COMPLETE ==========
      else if (action === "complete") {
        if (processStep.status !== "in_progress") {
          throw new Error("Can only complete process that is in progress");
        }

        const completedQty = quantity || processStep.quantityReceived;
        updateData.status = "completed";
        updateData.completedTime = now;
        updateData.quantityCompleted = completedQty;

        // Calculate processing duration
        if (processStep.startedTime) {
          const procStart = new Date(processStep.startedTime);
          updateData.processingDuration = Math.round(
            (now.getTime() - procStart.getTime()) / (1000 * 60)
          );
        }

        // Calculate total duration
        if (processStep.addedToWaitingTime) {
          const totalStart = new Date(processStep.addedToWaitingTime);
          updateData.totalDuration = Math.round(
            (now.getTime() - totalStart.getTime()) / (1000 * 60)
          );
        }

        transitionFrom = "in_progress";
        transitionTo = "completed";
      } else {
        throw new Error(`Unknown action: ${action}`);
      }

      if (notes) updateData.notes = notes;

      // Update process step
      const updatedProcessStep = await tx.processStep.update({
        where: { id: processStepId },
        data: updateData,
      });

      // Log transition
      const transition = await tx.processTransition.create({
        data: {
          orderId: processStep.orderId,
          processStepId: processStepId,
          fromState: transitionFrom,
          toState: transitionTo,
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

      // ========== WHEN COMPLETED: Create Transfer & Next Process ==========
      // ========== WHEN COMPLETED: Create Transfer & Next Process ==========
      if (action === "complete") {
        const completedQty = quantity || processStep.quantityReceived;

        // Update Order totalCompleted
        await tx.order.update({
          where: { id: processStep.orderId },
          data: {
            totalCompleted: completedQty,
            currentState: "at_ppic",
            updatedAt: now,
          },
        });

        // ✅ FIX: Get NEXT process from order's processFlow
        const order = await tx.order.findUnique({
          where: { id: processStep.orderId },
        });

        if (!order) throw new Error("Order not found");

        let processFlow: ProcessName[];
        if (order.processFlow) {
          try {
            processFlow = JSON.parse(order.processFlow);
          } catch (e) {
            processFlow = [...PRODUCTION_PROCESSES, ...DELIVERY_PROCESSES];
          }
        } else {
          processFlow = [...PRODUCTION_PROCESSES, ...DELIVERY_PROCESSES];
        }

        // Find current process index in flow
        const currentIndex = processFlow.findIndex(
          (p) => p === processStep.processName
        );

        let nextProcess: ProcessName | null = null;
        if (currentIndex >= 0 && currentIndex < processFlow.length - 1) {
          nextProcess = processFlow[currentIndex + 1];
        }

        console.log(
          `[TRANSITION] Current: ${processStep.processName} (index ${currentIndex})`
        );
        console.log(`[TRANSITION] Next: ${nextProcess}`);
        console.log(`[TRANSITION] Flow:`, processFlow);

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

          // Create Transfer Log
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
              quantityTransferred: completedQty,
              quantityCompleted: completedQty,
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
              quantityReceived: completedQty,
              addedToWaitingTime: now, // ✅ Langsung masuk waiting list
            },
          });

          // Update order current process
          await tx.order.update({
            where: { id: processStep.orderId },
            data: {
              currentProcess: nextProcess,
              currentPhase: nextPhase || processStep.processPhase,
              currentState: "waiting", // ✅ Status waiting
            },
          });

          // Log transition untuk next process
          await tx.processTransition.create({
            data: {
              orderId: processStep.orderId,
              processStepId: nextProcessStep.id,
              fromState: "at_ppic",
              toState: "waiting",
              transitionTime: now,
              performedBy: "SYSTEM",
              processName: nextProcess,
              department: PROCESS_DEPARTMENT_MAP[nextProcess],
              notes: `Auto-added to waiting list from ${processStep.processName}`,
            },
          });
        } else {
          // Last process - mark order as delivered
          await tx.order.update({
            where: { id: processStep.orderId },
            data: {
              currentProcess: "delivered",
              currentState: "completed",
              totalCompleted: completedQty,
            },
          });
        }
      } else {
        // Update order state for non-complete actions
        await tx.order.update({
          where: { id: processStep.orderId },
          data: {
            currentState: transitionTo,
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
      message: `Action ${action} completed successfully`,
      data: result,
    });
  } catch (error) {
    console.error("Error in process transition:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process action",
      },
      { status: 500 }
    );
  }
}
