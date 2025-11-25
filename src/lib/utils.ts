// lib/utils.ts

import { Order, ProcessStatus, TransferLog, ProcessHistoryLog } from "./types";
import { ORDER_PREFIX, TRANSFER_PREFIX, PROCESS_FLOW } from "./constants";
import {
  orderStorage,
  transferLogStorage,
  processHistoryStorage,
} from "./storage";

// Generate Order Number
export function generateOrderNumber(): string {
  const orders = orderStorage.getAll();
  const year = new Date().getFullYear();
  const count =
    orders.filter((o) => o.orderNumber.startsWith(`${ORDER_PREFIX}-${year}`))
      .length + 1;

  return `${ORDER_PREFIX}-${year}-${count.toString().padStart(5, "0")}`;
}

// Generate Transfer Number
export function generateTransferNumber(): string {
  const transfers = transferLogStorage.getAll();
  const today = new Date();
  const dateStr = `${today.getFullYear()}${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${today.getDate().toString().padStart(2, "0")}`;

  const count =
    transfers.filter((t) => t.transferNumber.includes(dateStr)).length + 1;

  return `${TRANSFER_PREFIX}-${dateStr}-${count.toString().padStart(4, "0")}`;
}

// Generate Bundle Number
export function generateBundleNumber(
  orderId: string,
  sizeIndex: number,
  bundleIndex: number
): string {
  const order = orderStorage.getById(orderId);
  if (!order) return "";

  const orderCode = order.orderNumber.split("-").pop() || "00000";
  return `${orderCode}-${sizeIndex + 1}-${bundleIndex + 1}`;
}

// Calculate Progress Percentage
export function calculateProgress(order: Order): number {
  const statusIndex = PROCESS_FLOW.indexOf(order.currentStatus);
  if (statusIndex < 0) return 0;

  const totalSteps = PROCESS_FLOW.length - 1; // exclude draft
  return Math.round((statusIndex / totalSteps) * 100);
}

// Get Next Process Status
export function getNextProcessStatus(
  currentStatus: ProcessStatus
): ProcessStatus | null {
  const currentIndex = PROCESS_FLOW.indexOf(currentStatus);
  if (currentIndex < 0 || currentIndex >= PROCESS_FLOW.length - 1) {
    return null;
  }
  return PROCESS_FLOW[currentIndex + 1];
}

// Get Previous Process Status
export function getPreviousProcessStatus(
  currentStatus: ProcessStatus
): ProcessStatus | null {
  const currentIndex = PROCESS_FLOW.indexOf(currentStatus);
  if (currentIndex <= 0) {
    return null;
  }
  return PROCESS_FLOW[currentIndex - 1];
}

// Format Date
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Format DateTime
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Calculate Days Difference
export function daysDifference(
  date1: Date | string,
  date2: Date | string
): number {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Calculate Lead Time in Hours
export function calculateLeadTimeHours(
  startDate: Date | string,
  endDate: Date | string
): number {
  const d1 = typeof startDate === "string" ? new Date(startDate) : startDate;
  const d2 = typeof endDate === "string" ? new Date(endDate) : endDate;
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round((diffTime / (1000 * 60 * 60)) * 10) / 10; // 1 decimal place
}

// Update Order Status dengan auto-create Transfer Log
export function updateOrderStatus(
  orderId: string,
  newStatus: ProcessStatus,
  performedBy: string,
  notes?: string,
  transferData?: {
    fromDepartment: string;
    toDepartment: string;
    receivedBy: string;
    items: TransferLog["items"];
  }
): void {
  const order = orderStorage.getById(orderId);
  if (!order) return;

  const previousStatus = order.currentStatus;

  // Update order status
  order.currentStatus = newStatus;
  order.updatedAt = new Date();
  orderStorage.save(order);

  // Create process history log
  const historyLog: ProcessHistoryLog = {
    id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    orderId,
    timestamp: new Date(),
    processStatus: newStatus,
    action: `Status diubah dari ${previousStatus} ke ${newStatus}`,
    performedBy,
    department: transferData?.fromDepartment || "",
    notes,
  };
  processHistoryStorage.save(historyLog);

  // Create transfer log if transfer data provided
  if (transferData) {
    const transferLog: TransferLog = {
      id: `trf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      transferNumber: generateTransferNumber(),
      orderId,
      orderNumber: order.orderNumber,
      fromDepartment: transferData.fromDepartment,
      toDepartment: transferData.toDepartment,
      transferDate: new Date(),
      handedOverBy: performedBy,
      receivedBy: transferData.receivedBy,
      processStatus: newStatus,
      items: transferData.items,
      notes,
      isReceived: true,
      receivedDate: new Date(),
    };
    transferLogStorage.save(transferLog);

    // Update history log with transfer reference
    historyLog.transferLogId = transferLog.id;
    processHistoryStorage.save(historyLog);
  }
}

// Calculate Total WIP
export function calculateTotalWIP(order: Order): number {
  return Object.values(order.wip).reduce((sum, val) => sum + val, 0);
}

// Calculate Completion Rate
export function calculateCompletionRate(order: Order): number {
  const completed = order.sizeBreakdown.reduce(
    (sum, size) => sum + size.completed,
    0
  );
  return order.totalQuantity > 0
    ? Math.round((completed / order.totalQuantity) * 100)
    : 0;
}

// Calculate Reject Rate
export function calculateRejectRate(order: Order): number {
  const rejected = order.sizeBreakdown.reduce(
    (sum, size) => sum + size.rejected,
    0
  );
  return order.totalQuantity > 0
    ? Math.round((rejected / order.totalQuantity) * 100 * 10) / 10
    : 0;
}

// Check if Order is Delayed
export function isOrderDelayed(order: Order): boolean {
  if (order.currentStatus === "completed") return false;
  const today = new Date();
  const target =
    typeof order.targetDate === "string"
      ? new Date(order.targetDate)
      : order.targetDate;
  return today > target;
}

// Get Delay Days
export function getDelayDays(order: Order): number {
  if (!isOrderDelayed(order)) return 0;
  const today = new Date();
  const target =
    typeof order.targetDate === "string"
      ? new Date(order.targetDate)
      : order.targetDate;
  return daysDifference(target, today);
}

// Format Number with Thousands Separator
export function formatNumber(num: number): string {
  return num.toLocaleString("id-ID");
}

// Calculate Average Lead Time
export function calculateAverageLeadTime(orders: Order[]): number {
  const completedOrders = orders.filter((o) => o.currentStatus === "completed");
  if (completedOrders.length === 0) return 0;

  const totalLeadTime = completedOrders.reduce((sum, order) => {
    const created =
      typeof order.createdAt === "string"
        ? new Date(order.createdAt)
        : order.createdAt;
    const updated =
      typeof order.updatedAt === "string"
        ? new Date(order.updatedAt)
        : order.updatedAt;
    return sum + daysDifference(created, updated);
  }, 0);

  return Math.round(totalLeadTime / completedOrders.length);
}

// Generate ID
export function generateId(prefix: string = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Class Names Helper (for conditional classes)
export function cn(
  ...classes: (string | boolean | undefined | null)[]
): string {
  return classes.filter(Boolean).join(" ");
}
