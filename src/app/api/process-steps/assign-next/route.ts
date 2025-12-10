// app/api/process-steps/assign-next/route.ts
// PPIC assigns next process after completion

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PROCESS_DEPARTMENT_MAP } from "@/lib/constants-new";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, nextProcessName, assignedBy, notes } = body;

    if (!orderId || !nextProcessName || !assignedBy) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          processSteps: {
            where: { status: "completed" },
            orderBy: { sequenceOrder: "desc" },
          },
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // Verify next process hasn't been done
      const alreadyDone = order.processSteps.some(
        (s) => s.processName === nextProcessName
      );

      if (alreadyDone) {
        throw new Error(
          "Cannot assign to a process that has already been completed"
        );
      }

      const lastCompletedStep = order.processSteps[0];
      if (!lastCompletedStep) {
        throw new Error("No completed process step found");
      }

      const now = new Date();
      const nextDepartment = PROCESS_DEPARTMENT_MAP[nextProcessName];

      // Determine phase
      const isDeliveryProcess = [
        "packing",
        "final_inspection",
        "loading",
        "shipping",
        "delivered",
      ].includes(nextProcessName);
      const nextPhase = isDeliveryProcess ? "delivery" : "production";

      // Create next process step
      const sequenceOrder = lastCompletedStep.sequenceOrder + 1;
      const nextProcessStep = await tx.processStep.create({
        data: {
          orderId,
          processName: nextProcessName,
          processPhase: nextPhase,
          sequenceOrder,
          department: nextDepartment,
          status: "pending",
          quantityReceived: lastCompletedStep.quantityCompleted,
          arrivedAtPpicTime: now,
          notes: notes || `Assigned by PPIC: ${assignedBy}`,
        },
      });

      // Update transfer log to reflect assignment
      const pendingTransfer = await tx.transferLog.findFirst({
        where: {
          orderId,
          toProcess: "to_be_assigned",
          status: "pending",
        },
        orderBy: { transferDate: "desc" },
      });

      if (pendingTransfer) {
        await tx.transferLog.update({
          where: { id: pendingTransfer.id },
          data: {
            toProcess: nextProcessName,
            toDepartment: nextDepartment,
            notes: `${
              pendingTransfer.notes || ""
            }\nPPIC assigned to: ${nextProcessName} by ${assignedBy}`,
          },
        });
      }

      // Update order
      await tx.order.update({
        where: { id: orderId },
        data: {
          currentProcess: nextProcessName,
          currentPhase: nextPhase,
          currentState: "at_ppic",
          updatedAt: now,
        },
      });

      // Log the assignment as transition
      await tx.processTransition.create({
        data: {
          orderId,
          processStepId: nextProcessStep.id,
          fromState: "at_ppic",
          toState: "at_ppic",
          transitionTime: now,
          performedBy: assignedBy,
          processName: nextProcessName,
          department: "PPIC",
          notes: `PPIC assigned order to ${nextProcessName}`,
        },
      });

      return {
        nextProcessStep,
        message: `Successfully assigned to ${nextProcessName}`,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error assigning next process:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to assign next process",
      },
      { status: 500 }
    );
  }
}
