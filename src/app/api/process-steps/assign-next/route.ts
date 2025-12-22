// app/api/process-steps/assign-next/route.ts - VERSION FINAL (handle draft placeholder & first assign with full transfer log)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  DELIVERY_PROCESSES,
  PROCESS_DEPARTMENT_MAP,
  PRODUCTION_PROCESSES,
} from "@/lib/constants-new";
import { ProcessName } from "@/lib/types-new";

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

    const validProcesses = [...PRODUCTION_PROCESSES, ...DELIVERY_PROCESSES];
    if (!validProcesses.includes(nextProcessName as any)) {
      return NextResponse.json(
        { success: false, error: "Invalid process name" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          processSteps: {
            orderBy: { sequenceOrder: "asc" }, // asc untuk mudah cari first
          },
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // Cek jika nextProcess sudah active (pending/in_progress)
      const existingActive = order.processSteps.find(
        (s) =>
          s.processName === nextProcessName &&
          (s.status === "pending" || s.status === "in_progress")
      );
      if (existingActive) {
        throw new Error(`Process ${nextProcessName} sudah active (${existingActive.status})`);
      }

      const now = new Date();
      const nextDepartment = PROCESS_DEPARTMENT_MAP[nextProcessName as ProcessName] || "Unknown";
      const isDelivery = DELIVERY_PROCESSES.includes(nextProcessName as any);
      const nextPhase = isDelivery ? "delivery" : "production";

      // Cari step terakhir (completed atau pending pertama)
      const completedSteps = order.processSteps.filter(s => s.status === "completed");
      let baseQuantity: number;
      let sequenceOrder: number;
      let fromProcess: string = "initial";
      let fromDepartment: string = "PPIC";
      let baseStepId: string | null = null;

      if (completedSteps.length > 0) {
        // Normal: ada yang sudah completed
        const lastCompleted = completedSteps[completedSteps.length - 1];
        baseQuantity = lastCompleted.quantityCompleted;
        sequenceOrder = lastCompleted.sequenceOrder + 1;
        fromProcess = lastCompleted.processName;
        fromDepartment = lastCompleted.department;
      } else {
        // First real assign (mungkin ada 'draft' placeholder pending)
        baseQuantity = order.totalQuantity;
        sequenceOrder = 1;

        const firstStep = order.processSteps[0]; // Asumsi hanya 1 step saat baru
        if (firstStep && firstStep.status === "pending" && firstStep.processName === "draft") {
          // UPDATE placeholder 'draft' menjadi process real pertama
          await tx.processStep.update({
            where: { id: firstStep.id },
            data: {
              processName: nextProcessName as ProcessName,
              processPhase: nextPhase,
              department: nextDepartment,
              sequenceOrder: 1,
              arrivedAtPpicTime: now,
              notes: notes ? `${firstStep.notes || ""}\n${notes}` : `Assigned first process by ${assignedBy}`,
            },
          });

          baseStepId = firstStep.id;
        } else {
          // Jika tidak ada 'draft', create new (safety)
          const newStep = await tx.processStep.create({
            data: {
              orderId,
              processName: nextProcessName as ProcessName,
              processPhase: nextPhase,
              sequenceOrder: 1,
              department: nextDepartment,
              status: "pending",
              quantityReceived: baseQuantity,
              quantityCompleted: 0,
              quantityRejected: 0,
              quantityRework: 0,
              arrivedAtPpicTime: now,
              notes: notes || `First process assigned by PPIC: ${assignedBy}`,
            },
          });
          baseStepId = newStep.id;
        }
      }

      // Jika normal case (ada completed), create next step
      if (completedSteps.length > 0 && !baseStepId) {
        const newStep = await tx.processStep.create({
          data: {
            orderId,
            processName: nextProcessName as ProcessName,
            processPhase: nextPhase,
            sequenceOrder,
            department: nextDepartment,
            status: "pending",
            quantityReceived: baseQuantity,
            quantityCompleted: 0,
            quantityRejected: 0,
            quantityRework: 0,
            arrivedAtPpicTime: now,
            notes: notes || `Assigned by PPIC: ${assignedBy}`,
          },
        });
        baseStepId = newStep.id;
      }

      // Handle transfer log
      const pendingTransfer = await tx.transferLog.findFirst({
        where: {
          orderId,
          status: "pending",
          toProcess: {
            in: ["to_be_assigned", (completedSteps.length > 0 ? completedSteps[completedSteps.length - 1]?.processName : "initial")],
          },
        },
        orderBy: { transferDate: "desc" },
      });

      if (pendingTransfer) {
        // Update existing transfer log
        await tx.transferLog.update({
          where: { id: pendingTransfer.id },
          data: {
            toProcess: nextProcessName as ProcessName,
            toDepartment: nextDepartment,
            notes: `${pendingTransfer.notes || ""}\nPPIC assigned to: ${nextProcessName} (${nextDepartment}) by ${assignedBy}`,
            updatedAt: now,
          },
        });
      } else {
        // Create new transfer log
        const year = now.getFullYear();
        const count = await tx.transferLog.count({
          where: { transferNumber: { startsWith: `TRF-${year}` } },
        });
        const transferNumber = `TRF-${year}-${String(count + 1).padStart(
          5,
          "0"
        )}`;

        await tx.transferLog.create({
          data: {
            transferNumber,
            orderId,
            processStepId: baseStepId!,
            fromProcess: fromProcess as ProcessName,
            fromDepartment,
            toProcess: nextProcessName as ProcessName,
            toDepartment: nextDepartment,
            transferDate: now,
            handedOverBy: assignedBy,
            quantityTransferred: baseQuantity,
            quantityCompleted: baseQuantity, // For first, assume all completed from initial
            quantityRejected: 0,
            quantityRework: 0,
            status: "pending",
            isReceived: false,
            notes: `PPIC assigned order from ${fromProcess} to ${nextProcessName}`,
          },
        });
      }

      // Update order current state
      await tx.order.update({
        where: { id: orderId },
        data: {
          currentProcess: nextProcessName as ProcessName,
          currentPhase: nextPhase,
          currentState: "at_ppic",
          updatedAt: now,
        },
      });

      // Create transition log (pasti ada)
      await tx.processTransition.create({
        data: {
          orderId,
          processStepId: baseStepId!,
          fromState: "at_ppic",
          toState: "at_ppic",
          transitionTime: now,
          performedBy: assignedBy,
          processName: nextProcessName as ProcessName,
          department: "PPIC",
          notes: notes || `PPIC assigned to ${nextProcessName}`,
        },
      });

      return {
        message: `Successfully assigned ${nextProcessName}. Process step updated/created.`,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Assign next process error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to assign",
      },
      { status: 500 }
    );
  }
}