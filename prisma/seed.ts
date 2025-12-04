// prisma/seed.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.transferItem.deleteMany();
  await prisma.transferLog.deleteMany();
  await prisma.processHistory.deleteMany();
  await prisma.rejectLog.deleteMany();
  await prisma.leftoverMaterial.deleteMany();
  await prisma.bundle.deleteMany();
  await prisma.sizeBreakdown.deleteMany();
  await prisma.order.deleteMany();
  await prisma.buyer.deleteMany();
  await prisma.style.deleteMany();
  await prisma.sewingLine.deleteMany();
  await prisma.user.deleteMany();

  // Create Buyers
  const buyers = await Promise.all([
    prisma.buyer.create({
      data: {
        name: "PT Maju Garment",
        type: "repeat",
        code: "MGT",
        contactPerson: "Budi Santoso",
        phone: "081234567890",
        canReuse: true,
        returRequired: false,
        storageLocation: "Warehouse A - Rack 1",
      },
    }),
    prisma.buyer.create({
      data: {
        name: "CV Fashion Indonesia",
        type: "repeat",
        code: "FID",
        contactPerson: "Siti Nurhaliza",
        phone: "081234567891",
        canReuse: true,
        returRequired: false,
        storageLocation: "Warehouse A - Rack 2",
      },
    }),
    prisma.buyer.create({
      data: {
        name: "ABC Trading Company",
        type: "one-time",
        code: "ABC",
        contactPerson: "John Smith",
        phone: "081234567892",
        canReuse: false,
        returRequired: true,
        storageLocation: "Warehouse B - Temporary",
      },
    }),
  ]);

  console.log(`✅ Created ${buyers.length} buyers`);

  // Create Styles
  const styles = await Promise.all([
    prisma.style.create({
      data: {
        styleCode: "SH-001",
        name: "Kemeja Formal Pria Hitam",
        category: "shirt",
        description:
          "Kemeja formal lengan panjang warna hitam dengan kerah italia",
        estimatedCuttingTime: 45,
        estimatedSewingTime: 25,
      },
    }),
    prisma.style.create({
      data: {
        styleCode: "SH-002",
        name: "Kemeja Casual Pria Putih",
        category: "shirt",
        description: "Kemeja casual lengan pendek warna putih",
        estimatedCuttingTime: 30,
        estimatedSewingTime: 20,
      },
    }),
    prisma.style.create({
      data: {
        styleCode: "PT-001",
        name: "Celana Chino Pria Navy",
        category: "pants",
        description: "Celana chino panjang warna navy",
        estimatedCuttingTime: 40,
        estimatedSewingTime: 30,
      },
    }),
  ]);

  console.log(`✅ Created ${styles.length} styles`);

  // Create Sewing Lines
  const sewingLines = await Promise.all([
    prisma.sewingLine.create({
      data: {
        lineName: "Sewing Line 1",
        lineCode: "SL-01",
        capacity: 500,
        currentLoad: 300,
        operators: 25,
        supervisor: "Ibu Sri",
        status: "active",
      },
    }),
    prisma.sewingLine.create({
      data: {
        lineName: "Sewing Line 2",
        lineCode: "SL-02",
        capacity: 450,
        currentLoad: 200,
        operators: 22,
        supervisor: "Pak Joko",
        status: "active",
      },
    }),
  ]);

  console.log(`✅ Created ${sewingLines.length} sewing lines`);

  // Create Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Admin System",
        department: "IT",
        role: "admin",
      },
    }),
    prisma.user.create({
      data: {
        name: "Budi PPIC",
        department: "PPIC",
        role: "ppic",
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create Orders with Size Breakdowns
  const now = new Date();

  // Order 1 - In Progress (Sewing)
  const order1 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${now.getFullYear()}-00001`,
      buyerId: buyers[0].id,
      styleId: styles[0].id,
      orderDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      targetDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      totalQuantity: 500,
      currentStatus: "sewing",
      assignedLine: "SL-01",
      materialsIssued: true,
      progressCutting: 100,
      progressNumbering: 100,
      progressShiwake: 100,
      progressSewing: 60,
      wipAtSewing: 300,
      leadTimeCutting: 8,
      leadTimeNumbering: 4,
      leadTimeShiwake: 6,
      leadTimeSewing: 48,
      totalRejected: 18,
      totalRework: 5,
      createdBy: "Budi PPIC",
      notes: "Order prioritas tinggi",
      sizeBreakdowns: {
        create: [
          {
            size: "S",
            quantity: 50,
            completed: 30,
            rejected: 2,
            bundleCount: 5,
          },
          {
            size: "M",
            quantity: 150,
            completed: 100,
            rejected: 5,
            bundleCount: 15,
          },
          {
            size: "L",
            quantity: 200,
            completed: 120,
            rejected: 8,
            bundleCount: 20,
          },
          {
            size: "XL",
            quantity: 100,
            completed: 50,
            rejected: 3,
            bundleCount: 10,
          },
        ],
      },
    },
  });

  // Order 2 - Completed
  const order2 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${now.getFullYear()}-00002`,
      buyerId: buyers[1].id,
      styleId: styles[2].id,
      orderDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      targetDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      totalQuantity: 300,
      currentStatus: "completed",
      assignedLine: "SL-02",
      materialsIssued: true,
      progressCutting: 100,
      progressNumbering: 100,
      progressShiwake: 100,
      progressSewing: 100,
      progressQc: 100,
      progressIroning: 100,
      progressFinalQc: 100,
      progressPacking: 100,
      leadTimeCutting: 6,
      leadTimeNumbering: 3,
      leadTimeShiwake: 4,
      leadTimeSewing: 36,
      leadTimeQc: 4,
      leadTimeIroning: 8,
      leadTimeFinalQc: 2,
      leadTimePacking: 4,
      totalRejected: 10,
      totalRework: 3,
      hasLeftover: true,
      createdBy: "Budi PPIC",
      sizeBreakdowns: {
        create: [
          {
            size: "S",
            quantity: 50,
            completed: 50,
            rejected: 2,
            bundleCount: 5,
          },
          {
            size: "M",
            quantity: 100,
            completed: 100,
            rejected: 3,
            bundleCount: 10,
          },
          {
            size: "L",
            quantity: 100,
            completed: 100,
            rejected: 4,
            bundleCount: 10,
          },
          {
            size: "XL",
            quantity: 50,
            completed: 50,
            rejected: 1,
            bundleCount: 5,
          },
        ],
      },
    },
  });

  // Order 3 - Just Started (Cutting)
  const order3 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${now.getFullYear()}-00003`,
      buyerId: buyers[2].id,
      styleId: styles[1].id,
      orderDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      targetDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      totalQuantity: 800,
      currentStatus: "cutting",
      materialsIssued: true,
      progressCutting: 30,
      wipAtCutting: 800,
      leadTimeCutting: 12,
      createdBy: "Budi PPIC",
      notes: "One-time buyer - perhatikan leftover untuk retur",
      sizeBreakdowns: {
        create: [
          {
            size: "S",
            quantity: 100,
            completed: 0,
            rejected: 0,
            bundleCount: 10,
          },
          {
            size: "M",
            quantity: 250,
            completed: 0,
            rejected: 0,
            bundleCount: 25,
          },
          {
            size: "L",
            quantity: 300,
            completed: 0,
            rejected: 0,
            bundleCount: 30,
          },
          {
            size: "XL",
            quantity: 150,
            completed: 0,
            rejected: 0,
            bundleCount: 15,
          },
        ],
      },
    },
  });

  console.log(`✅ Created 3 orders with size breakdowns`);

  // Create some transfer logs for order 1
  await prisma.transferLog.create({
    data: {
      transferNumber: "TRF-20241201-0001",
      orderId: order1.id,
      orderNumber: order1.orderNumber,
      fromDepartment: "Cutting",
      toDepartment: "Numbering",
      transferDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      handedOverBy: "Staff Cutting",
      receivedBy: "Staff Numbering",
      processStatus: "numbering",
      isReceived: true,
      receivedDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            description: "Kemeja Formal Pria Hitam - All Sizes",
            quantity: 500,
            unit: "pcs",
            condition: "good",
          },
        ],
      },
    },
  });

  console.log("✅ Created transfer logs");

  // Create process history
  await prisma.processHistory.create({
    data: {
      orderId: order1.id,
      timestamp: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      processStatus: "numbering",
      action: "Barang ditransfer dari Cutting ke Numbering",
      performedBy: "Staff Cutting",
      department: "Cutting",
    },
  });

  console.log("✅ Created process history");

  console.log("🎉 Seeding completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
