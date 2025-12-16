// // prisma/seed.ts

// import { PrismaClient } from "@prisma/client";
// import {
//   PRODUCTION_PROCESSES,
//   PROCESS_DEPARTMENT_MAP,
//   DELIVERY_PROCESSES,
// } from "../src/lib/constants-new";
// import { ProcessName } from "../src/lib/types-new";

// const prisma = new PrismaClient();

// async function main() {
//   console.log("🌱 Seeding database for NEW FLOW...");

//   // Clear existing data in correct order (respecting foreign keys)
//   console.log("🗑️  Clearing existing data...");

//   await prisma.qRScan.deleteMany();
//   await prisma.bundleQRCode.deleteMany();
//   await prisma.orderQRCode.deleteMany();
//   await prisma.processTransition.deleteMany();
//   await prisma.rejectLog.deleteMany();
//   await prisma.processStep.deleteMany();
//   await prisma.leftoverMaterial.deleteMany();
//   await prisma.bundle.deleteMany();
//   await prisma.sizeBreakdown.deleteMany();
//   await prisma.order.deleteMany();
//   await prisma.buyer.deleteMany();
//   await prisma.style.deleteMany();
//   await prisma.sewingLine.deleteMany();
//   await prisma.user.deleteMany();

//   console.log("✅ Cleared existing data");

//   // Create Buyers
//   const buyers = await Promise.all([
//     prisma.buyer.create({
//       data: {
//         name: "PT Maju Garment",
//         type: "repeat",
//         code: "MGT",
//         contactPerson: "Budi Santoso",
//         phone: "081234567890",
//         canReuse: true,
//         returRequired: false,
//         storageLocation: "Warehouse A - Rack 1",
//       },
//     }),
//     prisma.buyer.create({
//       data: {
//         name: "CV Fashion Indonesia",
//         type: "repeat",
//         code: "FID",
//         contactPerson: "Siti Nurhaliza",
//         phone: "081234567891",
//         canReuse: true,
//         returRequired: false,
//         storageLocation: "Warehouse A - Rack 2",
//       },
//     }),
//     prisma.buyer.create({
//       data: {
//         name: "ABC Trading Company",
//         type: "one-time",
//         code: "ABC",
//         contactPerson: "John Smith",
//         phone: "081234567892",
//         canReuse: false,
//         returRequired: true,
//         storageLocation: "Warehouse B - Temporary",
//       },
//     }),
//   ]);

//   console.log(`✅ Created ${buyers.length} buyers`);

//   // Create Styles
//   const styles = await Promise.all([
//     prisma.style.create({
//       data: {
//         styleCode: "SH-001",
//         name: "Kemeja Formal Pria Hitam",
//         category: "shirt",
//         description:
//           "Kemeja formal lengan panjang warna hitam dengan kerah italia",
//         estimatedCuttingTime: 45,
//         estimatedSewingTime: 25,
//       },
//     }),
//     prisma.style.create({
//       data: {
//         styleCode: "SH-002",
//         name: "Kemeja Casual Pria Putih",
//         category: "shirt",
//         description: "Kemeja casual lengan pendek warna putih",
//         estimatedCuttingTime: 30,
//         estimatedSewingTime: 20,
//       },
//     }),
//     prisma.style.create({
//       data: {
//         styleCode: "PT-001",
//         name: "Celana Chino Pria Navy",
//         category: "pants",
//         description: "Celana chino panjang warna navy",
//         estimatedCuttingTime: 40,
//         estimatedSewingTime: 30,
//       },
//     }),
//   ]);

//   console.log(`✅ Created ${styles.length} styles`);

//   // Create Sewing Lines
//   const sewingLines = await Promise.all([
//     prisma.sewingLine.create({
//       data: {
//         lineName: "Sewing Line 1",
//         lineCode: "SL-01",
//         capacity: 500,
//         currentLoad: 300,
//         operators: 25,
//         supervisor: "Ibu Sri",
//         status: "active",
//       },
//     }),
//     prisma.sewingLine.create({
//       data: {
//         lineName: "Sewing Line 2",
//         lineCode: "SL-02",
//         capacity: 450,
//         currentLoad: 200,
//         operators: 22,
//         supervisor: "Pak Joko",
//         status: "active",
//       },
//     }),
//   ]);

//   console.log(`✅ Created ${sewingLines.length} sewing lines`);

//   // Create Users
//   const users = await Promise.all([
//     prisma.user.create({
//       data: {
//         name: "Admin System",
//         department: "IT",
//         role: "admin",
//       },
//     }),
//     prisma.user.create({
//       data: {
//         name: "Budi PPIC",
//         department: "PPIC",
//         role: "ppic",
//       },
//     }),
//   ]);

//   console.log(`✅ Created ${users.length} users`);

//   const now = new Date();

//   // ====================================================================
//   // ORDER 1 - In Progress at Sewing (New Flow)
//   // ====================================================================
//   console.log("\n📦 Creating Order 1 (In Progress - Sewing)...");

//   const order1 = await prisma.order.create({
//     data: {
//       orderNumber: `ORD-${now.getFullYear()}-00001`,
//       buyerId: buyers[0].id,
//       styleId: styles[0].id,
//       orderDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
//       productionDeadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
//       deliveryDeadline: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
//       totalQuantity: 500,

//       // NEW FLOW FIELDS
//       currentPhase: "production",
//       currentProcess: "sewing",
//       currentState: "in_progress",

//       assignedLine: "SL-01",
//       assignedTo: "Operator Sewing A",
//       materialsIssued: true,
//       totalCompleted: 300,
//       totalRejected: 18,
//       totalRework: 5,
//       createdBy: "Budi PPIC",
//       notes: "Order prioritas tinggi",

//       sizeBreakdowns: {
//         create: [
//           {
//             size: "S",
//             quantity: 50,
//             completed: 30,
//             rejected: 2,
//             bundleCount: 5,
//           },
//           {
//             size: "M",
//             quantity: 150,
//             completed: 100,
//             rejected: 5,
//             bundleCount: 15,
//           },
//           {
//             size: "L",
//             quantity: 200,
//             completed: 120,
//             rejected: 8,
//             bundleCount: 20,
//           },
//           {
//             size: "XL",
//             quantity: 100,
//             completed: 50,
//             rejected: 3,
//             bundleCount: 10,
//           },
//         ],
//       },
//     },
//   });

//   // Create Process Steps for Order 1 (up to sewing)
//   const order1Steps = await createProcessStepsForOrder(
//     order1.id,
//     order1.totalQuantity,
//     "sewing",
//     now
//   );

//   console.log(`✅ Created ${order1Steps.length} process steps for Order 1`);

//   // ====================================================================
//   // ORDER 2 - Completed (New Flow)
//   // ====================================================================
//   console.log("\n📦 Creating Order 2 (Completed)...");

//   const order2 = await prisma.order.create({
//     data: {
//       orderNumber: `ORD-${now.getFullYear()}-00002`,
//       buyerId: buyers[1].id,
//       styleId: styles[2].id,
//       orderDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
//       productionDeadline: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
//       deliveryDeadline: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
//       totalQuantity: 300,

//       // NEW FLOW FIELDS
//       currentPhase: "delivery",
//       currentProcess: "delivered",
//       currentState: "completed",

//       assignedLine: "SL-02",
//       materialsIssued: true,
//       totalCompleted: 300,
//       totalRejected: 10,
//       totalRework: 3,
//       hasLeftover: true,
//       createdBy: "Budi PPIC",

//       sizeBreakdowns: {
//         create: [
//           {
//             size: "S",
//             quantity: 50,
//             completed: 50,
//             rejected: 2,
//             bundleCount: 5,
//           },
//           {
//             size: "M",
//             quantity: 100,
//             completed: 100,
//             rejected: 3,
//             bundleCount: 10,
//           },
//           {
//             size: "L",
//             quantity: 100,
//             completed: 100,
//             rejected: 4,
//             bundleCount: 10,
//           },
//           {
//             size: "XL",
//             quantity: 50,
//             completed: 50,
//             rejected: 1,
//             bundleCount: 5,
//           },
//         ],
//       },
//     },
//   });

//   // Create all process steps (completed)
//   const order2Steps = await createProcessStepsForOrder(
//     order2.id,
//     order2.totalQuantity,
//     "delivered",
//     new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
//   );

//   console.log(`✅ Created ${order2Steps.length} process steps for Order 2`);

//   // ====================================================================
//   // ORDER 3 - Just Started at Cutting (New Flow)
//   // ====================================================================
//   console.log("\n📦 Creating Order 3 (Just Started - Cutting)...");

//   const order3 = await prisma.order.create({
//     data: {
//       orderNumber: `ORD-${now.getFullYear()}-00003`,
//       buyerId: buyers[2].id,
//       styleId: styles[1].id,
//       orderDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
//       productionDeadline: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
//       deliveryDeadline: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000),
//       totalQuantity: 800,

//       // NEW FLOW FIELDS
//       currentPhase: "production",
//       currentProcess: "cutting",
//       currentState: "in_progress",

//       assignedTo: "Operator Cutting B",
//       materialsIssued: true,
//       totalCompleted: 0,
//       totalRejected: 0,
//       totalRework: 0,
//       createdBy: "Budi PPIC",
//       notes: "One-time buyer - perhatikan leftover untuk retur",

//       sizeBreakdowns: {
//         create: [
//           {
//             size: "S",
//             quantity: 100,
//             completed: 0,
//             rejected: 0,
//             bundleCount: 10,
//           },
//           {
//             size: "M",
//             quantity: 250,
//             completed: 0,
//             rejected: 0,
//             bundleCount: 25,
//           },
//           {
//             size: "L",
//             quantity: 300,
//             completed: 0,
//             rejected: 0,
//             bundleCount: 30,
//           },
//           {
//             size: "XL",
//             quantity: 150,
//             completed: 0,
//             rejected: 0,
//             bundleCount: 15,
//           },
//         ],
//       },
//     },
//   });

//   // Create Process Steps for Order 3 (draft + cutting in progress)
//   const order3Steps = await createProcessStepsForOrder(
//     order3.id,
//     order3.totalQuantity,
//     "cutting",
//     now
//   );

//   console.log(`✅ Created ${order3Steps.length} process steps for Order 3`);

//   // ====================================================================
//   // ORDER 4 - Waiting at QC Sewing (New Flow)
//   // ====================================================================
//   console.log("\n📦 Creating Order 4 (Waiting at QC Sewing)...");

//   const order4 = await prisma.order.create({
//     data: {
//       orderNumber: `ORD-${now.getFullYear()}-00004`,
//       buyerId: buyers[0].id,
//       styleId: styles[1].id,
//       orderDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
//       productionDeadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
//       deliveryDeadline: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
//       totalQuantity: 400,

//       // NEW FLOW FIELDS
//       currentPhase: "production",
//       currentProcess: "qc_sewing",
//       currentState: "waiting",

//       assignedLine: "SL-01",
//       materialsIssued: true,
//       totalCompleted: 380,
//       totalRejected: 5,
//       totalRework: 2,
//       createdBy: "Budi PPIC",

//       sizeBreakdowns: {
//         create: [
//           {
//             size: "M",
//             quantity: 150,
//             completed: 145,
//             rejected: 2,
//             bundleCount: 15,
//           },
//           {
//             size: "L",
//             quantity: 150,
//             completed: 145,
//             rejected: 2,
//             bundleCount: 15,
//           },
//           {
//             size: "XL",
//             quantity: 100,
//             completed: 90,
//             rejected: 1,
//             bundleCount: 10,
//           },
//         ],
//       },
//     },
//   });

//   const order4Steps = await createProcessStepsForOrder(
//     order4.id,
//     order4.totalQuantity,
//     "qc_sewing",
//     now
//   );

//   console.log(`✅ Created ${order4Steps.length} process steps for Order 4`);

//   console.log("\n🎉 Seeding completed successfully!");
//   console.log("\n📊 Summary:");
//   console.log(`   - Buyers: ${buyers.length}`);
//   console.log(`   - Styles: ${styles.length}`);
//   console.log(`   - Sewing Lines: ${sewingLines.length}`);
//   console.log(`   - Users: ${users.length}`);
//   console.log(`   - Orders: 4`);
//   console.log(
//     `   - Process Steps: ${
//       order1Steps.length +
//       order2Steps.length +
//       order3Steps.length +
//       order4Steps.length
//     }`
//   );
// }

// // ====================================================================
// // Helper Function: Create Process Steps for an Order
// // ====================================================================
// async function createProcessStepsForOrder(
//   orderId: string,
//   totalQuantity: number,
//   currentProcessName: string,
//   baseTime: Date
// ): Promise<any[]> {
//   const allProcesses: ProcessName[] = [...PRODUCTION_PROCESSES, ...DELIVERY_PROCESSES];
//   const currentIndex = allProcesses.indexOf(currentProcessName as ProcessName);

//   if (currentIndex < 0) {
//     throw new Error(`Unknown process: ${currentProcessName}`);
//   }

//   const steps: any[] = [];

//   // Create steps up to and including current process
//   for (let i = 0; i <= currentIndex; i++) {
//     const processName: ProcessName = allProcesses[i];
//     const department = PROCESS_DEPARTMENT_MAP[processName] || "PPIC";
//     const sequenceOrder = i + 1;
//     const isCurrentProcess = i === currentIndex;

//     // Calculate timestamps
//     const dayOffset = i * 2; // 2 days per process
//     const arrivedTime = new Date(
//       baseTime.getTime() - (currentIndex - i) * 2 * 24 * 60 * 60 * 1000
//     );
//     const waitingTime = new Date(arrivedTime.getTime() + 2 * 60 * 60 * 1000); // +2 hours
//     const assignedTime = new Date(waitingTime.getTime() + 1 * 60 * 60 * 1000); // +1 hour
//     const startedTime = new Date(assignedTime.getTime() + 30 * 60 * 1000); // +30 min
//     const completedTime = isCurrentProcess
//       ? null
//       : new Date(startedTime.getTime() + 8 * 60 * 60 * 1000); // +8 hours

//     const processStep = await prisma.processStep.create({
//       data: {
//         orderId,
//         processName,
//         processPhase: processName === "delivered" ? "delivery" : "production",
//         sequenceOrder,
//         department,
//         status: isCurrentProcess ? "in_progress" : "completed",

//         quantityReceived: totalQuantity,
//         quantityCompleted: isCurrentProcess
//           ? Math.floor(totalQuantity * 0.6)
//           : totalQuantity,
//         quantityRejected: 0,
//         quantityRework: 0,

//         arrivedAtPpicTime: arrivedTime,
//         addedToWaitingTime: isCurrentProcess ? waitingTime : waitingTime,
//         assignedTime: isCurrentProcess ? assignedTime : assignedTime,
//         startedTime: isCurrentProcess ? startedTime : startedTime,
//         completedTime: completedTime,

//         waitingDuration: isCurrentProcess ? null : 60,
//         processingDuration: isCurrentProcess ? null : 480,
//         totalDuration: isCurrentProcess ? null : 600,

//         notes: isCurrentProcess
//           ? "Currently in progress"
//           : "Completed successfully",
//       },
//     });

//     steps.push(processStep);

//     // Create transitions for this step
//     await createTransitionsForStep(
//       processStep,
//       orderId,
//       isCurrentProcess,
//       arrivedTime,
//       waitingTime,
//       assignedTime,
//       startedTime,
//       completedTime
//     );
//   }

//   return steps;
// }

// // ====================================================================
// // Helper Function: Create Transitions for a Process Step
// // ====================================================================
// async function createTransitionsForStep(
//   processStep: any,
//   orderId: string,
//   isCurrentProcess: boolean,
//   arrivedTime: Date,
//   waitingTime: Date,
//   assignedTime: Date,
//   startedTime: Date,
//   completedTime: Date | null
// ) {
//   const transitions = [
//     {
//       fromState: "at_ppic",
//       toState: "waiting",
//       time: waitingTime,
//       notes: "Moved to waiting list",
//     },
//     {
//       fromState: "waiting",
//       toState: "assigned",
//       time: assignedTime,
//       notes: "Assigned to operator",
//     },
//     {
//       fromState: "assigned",
//       toState: "in_progress",
//       time: startedTime,
//       notes: "Work started",
//     },
//   ];

//   if (!isCurrentProcess && completedTime) {
//     transitions.push({
//       fromState: "in_progress",
//       toState: "completed",
//       time: completedTime,
//       notes: "Process completed",
//     });
//   }

//   for (const transition of transitions) {
//     await prisma.processTransition.create({
//       data: {
//         orderId,
//         processStepId: processStep.id,
//         fromState: transition.fromState,
//         toState: transition.toState,
//         transitionTime: transition.time,
//         performedBy: "SEED_DATA",
//         processName: processStep.processName,
//         department: processStep.department,
//         quantity: processStep.quantityReceived,
//         notes: transition.notes,
//       },
//     });
//   }
// }

// main()
//   .then(async () => {
//     await prisma.$disconnect();
//   })
//   .catch(async (e) => {
//     console.error("❌ Seeding failed:", e);
//     await prisma.$disconnect();
//     process.exit(1);
//   });
