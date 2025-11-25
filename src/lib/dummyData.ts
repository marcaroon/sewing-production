// lib/dummyData.ts

import {
  Buyer,
  Style,
  Order,
  SewingLine,
  User,
  ProcessStatus,
  TransferLog,
  ProcessHistoryLog,
} from "./types";
import {
  buyerStorage,
  styleStorage,
  orderStorage,
  sewingLineStorage,
  userStorage,
  transferLogStorage,
  processHistoryStorage,
} from "./storage";
import {
  generateOrderNumber,
  generateTransferNumber,
  generateId,
} from "./utils";
import { DEPARTMENTS } from "./constants";

// Generate Dummy Buyers
export function generateDummyBuyers(): Buyer[] {
  const buyers: Buyer[] = [
    {
      id: "buyer-1",
      name: "PT Maju Garment",
      type: "repeat",
      code: "MGT",
      contactPerson: "Budi Santoso",
      phone: "081234567890",
      leftoverPolicy: {
        canReuse: true,
        returRequired: false,
        storageLocation: "Warehouse A - Rack 1",
      },
    },
    {
      id: "buyer-2",
      name: "CV Fashion Indonesia",
      type: "repeat",
      code: "FID",
      contactPerson: "Siti Nurhaliza",
      phone: "081234567891",
      leftoverPolicy: {
        canReuse: true,
        returRequired: false,
        storageLocation: "Warehouse A - Rack 2",
      },
    },
    {
      id: "buyer-3",
      name: "ABC Trading Company",
      type: "one-time",
      code: "ABC",
      contactPerson: "John Smith",
      phone: "081234567892",
      leftoverPolicy: {
        canReuse: false,
        returRequired: true,
        storageLocation: "Warehouse B - Temporary",
      },
    },
    {
      id: "buyer-4",
      name: "Global Apparel Co",
      type: "one-time",
      code: "GAC",
      contactPerson: "Maria Garcia",
      phone: "081234567893",
      leftoverPolicy: {
        canReuse: false,
        returRequired: true,
        storageLocation: "Warehouse B - Temporary",
      },
    },
    {
      id: "buyer-5",
      name: "Sentosa Fashion Group",
      type: "repeat",
      code: "SFG",
      contactPerson: "Ahmad Yani",
      phone: "081234567894",
      leftoverPolicy: {
        canReuse: true,
        returRequired: false,
        storageLocation: "Warehouse A - Rack 3",
      },
    },
  ];

  buyers.forEach((buyer) => buyerStorage.save(buyer));
  return buyers;
}

// Generate Dummy Styles
export function generateDummyStyles(): Style[] {
  const styles: Style[] = [
    {
      id: "style-1",
      styleCode: "SH-001",
      name: "Kemeja Formal Pria Hitam",
      category: "shirt",
      description:
        "Kemeja formal lengan panjang warna hitam dengan kerah italia",
      estimatedCuttingTime: 45,
      estimatedSewingTime: 25,
    },
    {
      id: "style-2",
      styleCode: "SH-002",
      name: "Kemeja Casual Pria Putih",
      category: "shirt",
      description: "Kemeja casual lengan pendek warna putih",
      estimatedCuttingTime: 30,
      estimatedSewingTime: 20,
    },
    {
      id: "style-3",
      styleCode: "PT-001",
      name: "Celana Chino Pria Navy",
      category: "pants",
      description: "Celana chino panjang warna navy",
      estimatedCuttingTime: 40,
      estimatedSewingTime: 30,
    },
    {
      id: "style-4",
      styleCode: "PT-002",
      name: "Celana Pendek Pria Khaki",
      category: "pants",
      description: "Celana pendek casual warna khaki",
      estimatedCuttingTime: 35,
      estimatedSewingTime: 22,
    },
    {
      id: "style-5",
      styleCode: "JK-001",
      name: "Jaket Bomber Pria Hitam",
      category: "jacket",
      description: "Jaket bomber dengan zipper depan warna hitam",
      estimatedCuttingTime: 60,
      estimatedSewingTime: 45,
    },
  ];

  styles.forEach((style) => styleStorage.save(style));
  return styles;
}

// Generate Dummy Sewing Lines
export function generateDummySewingLines(): SewingLine[] {
  const lines: SewingLine[] = [
    {
      id: "line-1",
      lineName: "Sewing Line 1",
      lineCode: "SL-01",
      capacity: 500,
      currentLoad: 300,
      operators: 25,
      supervisor: "Ibu Sri",
      status: "active",
    },
    {
      id: "line-2",
      lineName: "Sewing Line 2",
      lineCode: "SL-02",
      capacity: 450,
      currentLoad: 200,
      operators: 22,
      supervisor: "Pak Joko",
      status: "active",
    },
    {
      id: "line-3",
      lineName: "Sewing Line 3",
      lineCode: "SL-03",
      capacity: 400,
      currentLoad: 150,
      operators: 20,
      supervisor: "Ibu Ani",
      status: "active",
    },
  ];

  lines.forEach((line) => sewingLineStorage.save(line));
  return lines;
}

// Generate Dummy Users
export function generateDummyUsers(): User[] {
  const users: User[] = [
    {
      id: "user-1",
      name: "Admin System",
      department: "IT",
      role: "admin",
    },
    {
      id: "user-2",
      name: "Budi PPIC",
      department: DEPARTMENTS.PPIC,
      role: "ppic",
    },
    {
      id: "user-3",
      name: "Andi Cutting",
      department: DEPARTMENTS.CUTTING,
      role: "cutting",
    },
    {
      id: "user-4",
      name: "Siti Sewing",
      department: DEPARTMENTS.SEWING,
      role: "sewing",
    },
    {
      id: "user-5",
      name: "Dewi QC",
      department: DEPARTMENTS.QC_SEWING,
      role: "qc",
    },
  ];

  users.forEach((user) => userStorage.save(user));
  return users;
}

// Generate Dummy Orders with Complete History
export function generateDummyOrders(buyers: Buyer[], styles: Style[]): Order[] {
  const now = new Date();
  const orders: Order[] = [];

  // Order 1 - In Progress (Sewing)
  const order1: Order = {
    id: "order-1",
    orderNumber: generateOrderNumber(),
    buyer: buyers[0],
    style: styles[0],
    orderDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 hari lalu
    targetDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 hari lagi
    totalQuantity: 500,
    sizeBreakdown: [
      { size: "S", quantity: 50, completed: 30, rejected: 2, bundleCount: 5 },
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
    currentStatus: "sewing",
    assignedLine: "SL-01",
    progress: {
      cutting: 100,
      numbering: 100,
      shiwake: 100,
      sewing: 60,
      qc: 0,
      ironing: 0,
      finalQc: 0,
      packing: 0,
    },
    materialsIssued: true,
    wip: {
      atCutting: 0,
      atNumbering: 0,
      atShiwake: 0,
      atSewing: 300,
      atQC: 0,
      atIroning: 0,
      atPacking: 0,
    },
    leadTime: {
      cutting: 8,
      numbering: 4,
      shiwake: 6,
      sewing: 48,
    },
    totalRejected: 18,
    totalRework: 5,
    hasLeftover: false,
    createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: now,
    createdBy: "Budi PPIC",
    notes: "Order prioritas tinggi",
  };

  // Order 2 - Completed
  const order2: Order = {
    id: "order-2",
    orderNumber: generateOrderNumber(),
    buyer: buyers[1],
    style: styles[2],
    orderDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    targetDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    totalQuantity: 300,
    sizeBreakdown: [
      { size: "S", quantity: 50, completed: 50, rejected: 2, bundleCount: 5 },
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
      { size: "XL", quantity: 50, completed: 50, rejected: 1, bundleCount: 5 },
    ],
    currentStatus: "completed",
    assignedLine: "SL-02",
    progress: {
      cutting: 100,
      numbering: 100,
      shiwake: 100,
      sewing: 100,
      qc: 100,
      ironing: 100,
      finalQc: 100,
      packing: 100,
    },
    materialsIssued: true,
    wip: {
      atCutting: 0,
      atNumbering: 0,
      atShiwake: 0,
      atSewing: 0,
      atQC: 0,
      atIroning: 0,
      atPacking: 0,
    },
    leadTime: {
      cutting: 6,
      numbering: 3,
      shiwake: 4,
      sewing: 36,
      qc: 4,
      ironing: 8,
      finalQc: 2,
      packing: 4,
    },
    totalRejected: 10,
    totalRework: 3,
    hasLeftover: true,
    createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    createdBy: "Budi PPIC",
  };

  // Order 3 - Just Started (Cutting)
  const order3: Order = {
    id: "order-3",
    orderNumber: generateOrderNumber(),
    buyer: buyers[2], // One-time buyer
    style: styles[1],
    orderDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    targetDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
    totalQuantity: 800,
    sizeBreakdown: [
      { size: "S", quantity: 100, completed: 0, rejected: 0, bundleCount: 10 },
      { size: "M", quantity: 250, completed: 0, rejected: 0, bundleCount: 25 },
      { size: "L", quantity: 300, completed: 0, rejected: 0, bundleCount: 30 },
      { size: "XL", quantity: 150, completed: 0, rejected: 0, bundleCount: 15 },
    ],
    currentStatus: "cutting",
    progress: {
      cutting: 30,
      numbering: 0,
      shiwake: 0,
      sewing: 0,
      qc: 0,
      ironing: 0,
      finalQc: 0,
      packing: 0,
    },
    materialsIssued: true,
    wip: {
      atCutting: 800,
      atNumbering: 0,
      atShiwake: 0,
      atSewing: 0,
      atQC: 0,
      atIroning: 0,
      atPacking: 0,
    },
    leadTime: {
      cutting: 12,
    },
    totalRejected: 0,
    totalRework: 0,
    hasLeftover: false,
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: now,
    createdBy: "Budi PPIC",
    notes: "One-time buyer - perhatikan leftover untuk retur",
  };

  // Order 4 - QC Stage
  const order4: Order = {
    id: "order-4",
    orderNumber: generateOrderNumber(),
    buyer: buyers[4],
    style: styles[3],
    orderDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
    targetDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    totalQuantity: 400,
    sizeBreakdown: [
      {
        size: "M",
        quantity: 150,
        completed: 140,
        rejected: 5,
        bundleCount: 15,
      },
      {
        size: "L",
        quantity: 150,
        completed: 145,
        rejected: 3,
        bundleCount: 15,
      },
      {
        size: "XL",
        quantity: 100,
        completed: 95,
        rejected: 2,
        bundleCount: 10,
      },
    ],
    currentStatus: "ironing",
    assignedLine: "SL-03",
    progress: {
      cutting: 100,
      numbering: 100,
      shiwake: 100,
      sewing: 100,
      qc: 100,
      ironing: 80,
      finalQc: 0,
      packing: 0,
    },
    materialsIssued: true,
    wip: {
      atCutting: 0,
      atNumbering: 0,
      atShiwake: 0,
      atSewing: 0,
      atQC: 0,
      atIroning: 320,
      atPacking: 0,
    },
    leadTime: {
      cutting: 5,
      numbering: 2,
      shiwake: 3,
      sewing: 28,
      qc: 3,
      ironing: 6,
    },
    totalRejected: 10,
    totalRework: 4,
    hasLeftover: false,
    createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
    updatedAt: now,
    createdBy: "Budi PPIC",
  };

  orders.push(order1, order2, order3, order4);
  orders.forEach((order) => orderStorage.save(order));

  // Generate Transfer Logs for each order
  generateTransferLogsForOrder(order1);
  generateTransferLogsForOrder(order2);
  generateTransferLogsForOrder(order3);
  generateTransferLogsForOrder(order4);

  return orders;
}

// Generate Transfer Logs for an Order
function generateTransferLogsForOrder(order: Order): void {
  const transfers: TransferLog[] = [];
  const histories: ProcessHistoryLog[] = [];

  const statusesToGenerate: ProcessStatus[] = [];

  // Determine which statuses to generate based on current status
  const currentIndex = [
    "cutting",
    "numbering",
    "shiwake",
    "sewing",
    "qc_sewing",
    "ironing",
    "final_qc",
    "packing",
    "completed",
  ].indexOf(order.currentStatus);

  if (currentIndex >= 0) {
    statusesToGenerate.push("material_issued");
  }
  if (currentIndex >= 0) {
    statusesToGenerate.push("cutting");
  }
  if (currentIndex >= 1) {
    statusesToGenerate.push("numbering");
  }
  if (currentIndex >= 2) {
    statusesToGenerate.push("shiwake");
  }
  if (currentIndex >= 3) {
    statusesToGenerate.push("transfer_to_sewing");
  }
  if (currentIndex >= 4) {
    statusesToGenerate.push("qc_sewing");
  }
  if (currentIndex >= 5) {
    statusesToGenerate.push("ironing");
  }
  if (currentIndex >= 6) {
    statusesToGenerate.push("final_qc");
  }
  if (currentIndex >= 7) {
    statusesToGenerate.push("packing");
  }

  let dayOffset = 0;
  statusesToGenerate.forEach((status, index) => {
    dayOffset += index * 0.5;
    const transferDate = new Date(
      order.createdAt.getTime() + dayOffset * 24 * 60 * 60 * 1000
    );

    const transferLog: TransferLog = {
      id: generateId("trf"),
      transferNumber: generateTransferNumber(),
      orderId: order.id,
      orderNumber: order.orderNumber,
      fromDepartment:
        index === 0
          ? DEPARTMENTS.WAREHOUSE
          : getDepartmentForStatus(statusesToGenerate[index - 1]),
      toDepartment: getDepartmentForStatus(status),
      transferDate,
      handedOverBy:
        "Staff " +
        getDepartmentForStatus(
          statusesToGenerate[index - 1] || "material_issued"
        ),
      receivedBy: "Staff " + getDepartmentForStatus(status),
      processStatus: status,
      items: [
        {
          description: `${order.style.name} - All Sizes`,
          quantity: order.totalQuantity,
          unit: "pcs",
          condition: "good",
        },
      ],
      notes: `Transfer untuk proses ${status}`,
      isReceived: true,
      receivedDate: transferDate,
    };

    transfers.push(transferLog);

    const historyLog: ProcessHistoryLog = {
      id: generateId("hist"),
      orderId: order.id,
      timestamp: transferDate,
      processStatus: status,
      action: `Barang ditransfer dari ${transferLog.fromDepartment} ke ${transferLog.toDepartment}`,
      performedBy: transferLog.handedOverBy,
      department: transferLog.fromDepartment,
      transferLogId: transferLog.id,
    };

    histories.push(historyLog);
  });

  transfers.forEach((t) => transferLogStorage.save(t));
  histories.forEach((h) => processHistoryStorage.save(h));
}

function getDepartmentForStatus(status: ProcessStatus): string {
  const map: Record<string, string> = {
    material_issued: DEPARTMENTS.WAREHOUSE,
    cutting: DEPARTMENTS.CUTTING,
    numbering: DEPARTMENTS.NUMBERING,
    shiwake: DEPARTMENTS.SHIWAKE,
    transfer_to_sewing: DEPARTMENTS.SEWING,
    sewing: DEPARTMENTS.SEWING,
    qc_sewing: DEPARTMENTS.QC_SEWING,
    ironing: DEPARTMENTS.IRONING,
    final_qc: DEPARTMENTS.FINAL_QC,
    packing: DEPARTMENTS.PACKING,
  };
  return map[status] || DEPARTMENTS.PPIC;
}

// Initialize All Dummy Data
export function initializeDummyData(): void {
  const buyers = generateDummyBuyers();
  const styles = generateDummyStyles();
  generateDummySewingLines();
  generateDummyUsers();
  generateDummyOrders(buyers, styles);

  console.log("✅ Dummy data initialized successfully");
}
