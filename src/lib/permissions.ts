// src/lib/permissions.ts - FIXED VERSION with Department-Based Access
import { ProcessName } from "./types-new";

/**
 * CRITICAL CHANGES:
 * 1. Access is determined by DEPARTMENT, not role
 * 2. isAdmin=true gives FULL ACCESS to everything
 * 3. PPIC can assign, but cannot execute
 * 4. Each department can execute their own processes
 */

// Department names (must match database)
export type Department =
  | "PPIC"
  | "Warehouse"
  | "Cutting"
  | "Numbering"
  | "Shiwake"
  | "Sewing"
  | "QC Sewing"
  | "Ironing"
  | "Final QC"
  | "Packing"
  | "Shipping"
  | "Loading";

// Legacy role type for compatibility
export type UserRole = string;

/**
 * Map department to processes they can EXECUTE
 * PPIC is empty because they only assign, not execute
 */
export const DEPARTMENT_PROCESS_MAP: Record<Department, ProcessName[]> = {
  PPIC: [], 
  Warehouse: ["material_issued"],
  Cutting: ["cutting", "material_request"],
  Numbering: ["numbering"],
  Shiwake: ["shiwake"],
  Sewing: ["sewing"],
  "QC Sewing": ["qc_sewing"],
  Ironing: ["ironing"],
  "Final QC": ["final_qc", "final_inspection"],
  Packing: ["packing"],
  Shipping: ["shipping", "delivered"],
  Loading: ["loading"],
};

/**
 * ✅ FIXED: Check if user can EXECUTE process
 * - Admin (isAdmin=1): ✅ Bisa SEMUA
 * - PPIC: ❌ Tidak bisa execute
 * - Department lain: ✅ Hanya process mereka
 */
export function canExecuteProcess(
  userDepartment: string,
  processName: ProcessName,
  isAdmin: boolean = false
): boolean {
  if (isAdmin) {
    // console.log(`[PERMISSION] Admin access: GRANTED for ${processName}`);
    return true;
  }

  if (userDepartment === "PPIC") {
    // console.log(`[PERMISSION] PPIC cannot execute: DENIED for ${processName}`);
    return false;
  }

  const allowedProcesses = DEPARTMENT_PROCESS_MAP[userDepartment as Department] || [];
  const canExecute = allowedProcesses.includes(processName);
  
  // console.log(`[PERMISSION] ${userDepartment} execute ${processName}: ${canExecute ? 'GRANTED' : 'DENIED'}`);
  // console.log(`[PERMISSION] Allowed processes for ${userDepartment}:`, allowedProcesses);
  
  return canExecute;
}

/**
 * Semua user bisa VIEW process (read-only)
 */
export function canViewProcess(
  userDepartment: string,
  processName: ProcessName,
  isAdmin: boolean = false
): boolean {
  return true; // Semua bisa lihat
}

/**
 * Get departments yang bisa handle process tertentu
 */
export function getDepartmentForProcess(processName: ProcessName): Department[] {
  const departments: Department[] = [];

  for (const [dept, processes] of Object.entries(DEPARTMENT_PROCESS_MAP)) {
    if (processes.includes(processName)) {
      departments.push(dept as Department);
    }
  }

  return departments;
}

/**
 * ✅ FIXED: Check if user can RECEIVE transfer
 */
export function canReceiveTransfer(
  userDepartment: string,
  toProcessName: ProcessName,
  isAdmin: boolean = false
): boolean {
  if (isAdmin) return true;
  if (userDepartment === "PPIC") return false;

  const allowedProcesses = DEPARTMENT_PROCESS_MAP[userDepartment as Department] || [];
  return allowedProcesses.includes(toProcessName);
}

/**
 * ✅ FIXED: Main Permission Object
 */
export const Permissions = {
  // ==================== ORDER MANAGEMENT ====================
  canCreateOrder: (department: string, isAdmin: boolean = false) =>
    isAdmin || department === "PPIC",

  canEditOrder: (department: string, isAdmin: boolean = false) =>
    isAdmin || department === "PPIC",

  canDeleteOrder: (department: string, isAdmin: boolean = false) => isAdmin,

  canViewOrder: (department: string, isAdmin: boolean = false) => true,

  // ==================== PROCESS ASSIGNMENT (PPIC ONLY) ====================
  canAssignProcess: (department: string, isAdmin: boolean = false) =>
    isAdmin || department === "PPIC",

  // ==================== PROCESS EXECUTION (DEPARTMENT-BASED) ====================
  canTransitionProcess: (
    department: string,
    processName: ProcessName,
    isAdmin: boolean = false
  ) => canExecuteProcess(department, processName, isAdmin),

  canRecordReject: (
    department: string,
    processName: ProcessName,
    isAdmin: boolean = false
  ) => canExecuteProcess(department, processName, isAdmin),

  canViewProcess: (
    department: string,
    processName: ProcessName,
    isAdmin: boolean = false
  ) => canViewProcess(department, processName, isAdmin),

  // ==================== TRANSFER LOG ====================
  canCreateTransfer: (
    department: string,
    processName: ProcessName,
    isAdmin: boolean = false
  ) => canExecuteProcess(department, processName, isAdmin),

  canReceiveTransfer: (
    department: string,
    toProcessName: ProcessName,
    isAdmin: boolean = false
  ) => canReceiveTransfer(department, toProcessName, isAdmin),

  // ==================== INVENTORY ====================
  canManageInventory: (department: string, isAdmin: boolean = false) =>
    isAdmin || department === "Warehouse",

  // ==================== USERS ====================
  canManageUsers: (department: string, isAdmin: boolean = false) => isAdmin,
};

// ==================== LEGACY COMPATIBILITY ====================
// Keep old function for backward compatibility
export function canModifyProcess(
  role: UserRole,
  processName: ProcessName,
  isAdmin: boolean = false
): boolean {
  // Treat role as department for now
  return canExecuteProcess(role, processName, isAdmin);
}

// Export legacy ROLE_PROCESS_MAP for backward compatibility
export const ROLE_PROCESS_MAP = DEPARTMENT_PROCESS_MAP;

// Helper to get role for process (now returns departments)
export function getRoleForProcess(processName: ProcessName): string[] {
  return getDepartmentForProcess(processName);
}