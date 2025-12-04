// prisma/migrate-to-new-flow.ts
// Data migration script to convert old data to new flow

import { PrismaClient } from "@prisma/client";
import {
  PRODUCTION_PROCESSES,
  DELIVERY_PROCESSES,
  PROCESS_DEPARTMENT_MAP,
  getProcessSequenceOrder,
} from "../src/lib/constants-new";

const prisma = new PrismaClient();

// Map old status to new process names
const OLD_STATUS_TO_PROCESS_MAP: Record<string, string> = {
  draft: "draft",
  cutting_plan: "draft",
  material_request: "material_request",
  material_issued: "material_issued",
  cutting: "cutting",
  numbering: "numbering",
  shiwake: "shiwake",
  transfer_to_sewing: "sewing",
  sewing: "sewing",
  qc_sewing: "qc_sewing",
  ironing: "ironing",
  final_qc: "final_qc",
  packing: "packing",
  completed: "delivered",
  on_hold: "draft",
  rejected: "draft",
};

async function migrateOrders() {
  console.log("🔄 Starting data migration...\n");

  const orders = await prisma.order.findMany({
    include: {
      sizeBreakdowns: true,
    },
  });

  console.log(`📦 Found ${orders.length} orders to migrate\n`);

  for (const order of orders) {
    console.log(`Processing order: ${order.orderNumber}`);

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Update order with new fields
        const currentProcess =
          OLD_STATUS_TO_PROCESS_MAP[order.currentStatus] || "draft";
        const currentPhase = DELIVERY_PROCESSES.includes(currentProcess as any)
          ? "delivery"
          : "production";

        // Set deadlines if not set
        const productionDeadline = order.targetDate;
        const deliveryDeadline = new Date(order.targetDate);
        deliveryDeadline.setDate(deliveryDeadline.getDate() + 3); // +3 days buffer

        await tx.order.update({
          where: { id: order.id },
          data: {
            currentPhase,
            currentProcess,
            currentState: "at_ppic",
            productionDeadline,
            deliveryDeadline,
            totalCompleted: order.sizeBreakdowns.reduce(
              (sum, sb) => sum + sb.completed,
              0
            ),
          },
        });

        // 2. Create process steps based on current status
        await createProcessStepsForOrder(tx, order, currentProcess);

        console.log(`  ✅ Migrated: ${order.orderNumber}`);
      });
    } catch (error) {
      console.error(`  ❌ Error migrating ${order.orderNumber}:`, error);
    }
  }

  console.log("\n✅ Migration completed!");
}

async function createProcessStepsForOrder(
  tx: any,
  order: any,
  currentProcess: string
) {
  const allProcesses = [...PRODUCTION_PROCESSES, ...DELIVERY_PROCESSES];
  const currentIndex = allProcesses.indexOf(currentProcess as any);

  if (currentIndex < 0) {
    console.log(`  ⚠️  Unknown process: ${currentProcess}, skipping steps`);
    return;
  }

  // Create process steps for completed processes
  for (let i = 0; i <= currentIndex; i++) {
    const processName = allProcesses[i];
    const processPhase = PRODUCTION_PROCESSES.includes(processName as any)
      ? "production"
      : "delivery";
    const department = PROCESS_DEPARTMENT_MAP[processName];
    const sequenceOrder = i + 1;
    const isCurrentProcess = i === currentIndex;

    const now = new Date();
    const estimatedStartTime = new Date(order.orderDate);
    estimatedStartTime.setDate(estimatedStartTime.getDate() + i * 2); // rough estimate

    const processStep = await tx.processStep.create({
      data: {
        orderId: order.id,
        processName,
        processPhase,
        sequenceOrder,
        department,
        status: isCurrentProcess ? "in_progress" : "completed",
        quantityReceived: order.totalQuantity,
        quantityCompleted: isCurrentProcess ? 0 : order.totalQuantity,
        quantityRejected: 0,
        quantityRework: 0,

        // Set estimated timestamps for completed processes
        arrivedAtPpicTime: isCurrentProcess
          ? now
          : estimatedStartTime,
        addedToWaitingTime: isCurrentProcess
          ? null
          : new Date(estimatedStartTime.getTime() + 1 * 60 * 60 * 1000), // +1 hour
        assignedTime: isCurrentProcess
          ? null
          : new Date(estimatedStartTime.getTime() + 2 * 60 * 60 * 1000), // +2 hours
        startedTime: isCurrentProcess
          ? null
          : new Date(estimatedStartTime.getTime() + 3 * 60 * 60 * 1000), // +3 hours
        completedTime: isCurrentProcess
          ? null
          : new Date(estimatedStartTime.getTime() + 24 * 60 * 60 * 1000), // +24 hours

        // Estimated durations for completed processes
        waitingDuration: isCurrentProcess ? null : 60, // 1 hour
        processingDuration: isCurrentProcess ? null : 480, // 8 hours
        totalDuration: isCurrentProcess ? null : 1440, // 24 hours

        notes: isCurrentProcess
          ? "Migrated from old system - currently in progress"
          : "Migrated from old system - estimated timestamps",
      },
    });

    // Create initial transition for each step
    await tx.processTransition.create({
      data: {
        orderId: order.id,
        processStepId: processStep.id,
        fromState: "at_ppic",
        toState: isCurrentProcess ? "at_ppic" : "completed",
        transitionTime: isCurrentProcess ? now : estimatedStartTime,
        performedBy: "MIGRATION_SCRIPT",
        processName,
        department,
        quantity: order.totalQuantity,
        notes: "Migrated from old system",
      },
    });
  }
}

async function migrateRejectLogs() {
  console.log("\n🔄 Migrating reject logs...\n");

  // Get all old reject logs
  const oldRejects = await prisma.rejectLog.findMany({
    include: {
      order: true,
    },
  });

  console.log(`📋 Found ${oldRejects.length} reject logs to migrate\n`);

  for (const reject of oldRejects) {
    try {
      // Find the corresponding process step
      const processName =
        OLD_STATUS_TO_PROCESS_MAP[reject.processStatus] || "cutting";
      const processStep = await prisma.processStep.findFirst({
        where: {
          orderId: reject.orderId,
          processName,
        },
      });

      if (!processStep) {
        console.log(
          `  ⚠️  No process step found for reject ${reject.id}, skipping`
        );
        continue;
      }

      // Update reject log with new fields
      await prisma.rejectLog.update({
        where: { id: reject.id },
        data: {
          processStepId: processStep.id,
          processName: processStep.processName,
          processPhase: processStep.processPhase,
          rejectCategory: reject.action === "rework" ? "rework" : "reject",
        },
      });

      console.log(`  ✅ Migrated reject log: ${reject.id}`);
    } catch (error) {
      console.error(`  ❌ Error migrating reject ${reject.id}:`, error);
    }
  }

  console.log("\n✅ Reject logs migration completed!");
}

async function cleanupOldData() {
  console.log("\n🧹 Cleaning up old data...\n");

  // Delete old tables data if they exist
  try {
    await prisma.$executeRaw`DROP TABLE IF EXISTS transfer_items;`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS transfer_logs;`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS process_histories;`;
    console.log("✅ Old tables dropped");
  } catch (error) {
    console.log("⚠️  Old tables already dropped or don't exist");
  }

  // Remove old columns from orders (optional - can be done later)
  console.log("⚠️  Note: Old progress/wip/leadTime columns still exist");
  console.log("   You can remove them manually later if needed\n");
}

async function verifyMigration() {
  console.log("\n🔍 Verifying migration...\n");

  const orders = await prisma.order.findMany({
    include: {
      processSteps: true,
      processTransitions: true,
    },
  });

  let allGood = true;

  for (const order of orders) {
    const hasSteps = order.processSteps && order.processSteps.length > 0;
    const hasTransitions =
      order.processTransitions && order.processTransitions.length > 0;

    if (!hasSteps || !hasTransitions) {
      console.log(`❌ Order ${order.orderNumber} missing data`);
      allGood = false;
    }
  }

  if (allGood) {
    console.log("✅ All orders have process steps and transitions!");
  } else {
    console.log("⚠️  Some orders have missing data, please review");
  }

  // Stats
  const totalSteps = await prisma.processStep.count();
  const totalTransitions = await prisma.processTransition.count();
  const totalRejects = await prisma.rejectLog.count();

  console.log("\n📊 Migration Statistics:");
  console.log(`   Orders: ${orders.length}`);
  console.log(`   Process Steps: ${totalSteps}`);
  console.log(`   Transitions: ${totalTransitions}`);
  console.log(`   Reject Logs: ${totalRejects}`);
}

async function main() {
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║   Data Migration: Old Flow → New Flow          ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  try {
    // Step 1: Migrate orders and create process steps
    await migrateOrders();

    // Step 2: Migrate reject logs
    await migrateRejectLogs();

    // Step 3: Cleanup old data
    await cleanupOldData();

    // Step 4: Verify migration
    await verifyMigration();

    console.log("\n✅ All migration steps completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Review the migrated data in database");
    console.log("   2. Test the new flow with a test order");
    console.log("   3. Update frontend components");
    console.log("   4. Train users on new system\n");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();