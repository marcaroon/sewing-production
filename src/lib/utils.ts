// lib/utils.ts

import { Order } from "@/lib/types-new";
import { PRODUCTION_PROCESSES, DELIVERY_PROCESSES } from "@/lib/constants-new";

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

// Format Number
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) {
    return "0";
  }
  return num.toLocaleString("id-ID");
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

// Class Names Helper (for conditional classes)
export function cn(
  ...classes: (string | boolean | undefined | null)[]
): string {
  return classes.filter(Boolean).join(" ");
}

// Generate ID
export function generateId(prefix: string = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== NEW FLOW HELPERS ====================

/**
 * Check if order is delayed from production deadline
 */
export function isProductionDelayed(order: Order): boolean {
  if (order.currentProcess === "delivered") return false;
  const now = new Date();
  const deadline = new Date(order.productionDeadline);
  return now > deadline;
}

/**
 * Get delay days from production deadline
 */
export function getProductionDelayDays(order: Order): number {
  if (!isProductionDelayed(order)) return 0;
  return daysDifference(new Date(order.productionDeadline), new Date());
}

/**
 * Check if order is delayed from delivery deadline
 */
export function isDeliveryDelayed(order: Order): boolean {
  if (order.currentProcess === "delivered") return false;
  const now = new Date();
  const deadline = new Date(order.deliveryDeadline);
  return now > deadline;
}

/**
 * Calculate completion percentage
 */
export function calculateCompletionPercentage(order: Order): number {
  if (order.totalQuantity === 0) return 0;
  return Math.round((order.totalCompleted / order.totalQuantity) * 100);
}

/**
 * Calculate reject rate
 */
export function calculateRejectPercentage(order: Order): number {
  if (order.totalQuantity === 0) return 0;
  return Math.round((order.totalRejected / order.totalQuantity) * 100 * 10) / 10;
}

/**
 * Get process sequence number for sorting
 */
export function getProcessSequenceNumber(processName: string): number {
  const allProcesses = [...PRODUCTION_PROCESSES, ...DELIVERY_PROCESSES];
  return allProcesses.indexOf(processName as any) + 1;
}

/**
 * Format duration in minutes to human readable
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return "-";
  
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}m`;
}

/**
 * Calculate progress percentage based on process sequence
 */
export function calculateProcessProgress(order: Order): number {
  const allProcesses = [...PRODUCTION_PROCESSES, ...DELIVERY_PROCESSES];
  const currentIndex = allProcesses.indexOf(order.currentProcess as any);
  
  if (currentIndex === -1) return 0;
  if (order.currentProcess === "delivered") return 100;
  
  const totalSteps = allProcesses.length - 1; // excluding draft
  return Math.round((currentIndex / totalSteps) * 100);
}