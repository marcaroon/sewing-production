// src/lib/permissions.ts - FIXED VERSION sesuai requirements
import { ProcessName } from "./types-new";

export type UserRole =
  | "admin" // Admin dengan isAdmin=1, full access
  | "ppic" // Hanya assign & create order
  | "cutting"
  | "sewing"
  | "qc"
  | "warehouse"
  | "packing"
  | "shipping"
  | "numbering"
  | "shiwake"
  | "ironing";

/**
 * CRITICAL NOTE:
 * - Admin (isAdmin=1): Full access ke semua fitur
 * - PPIC: Hanya create order & assign process ke waiting list
 * - Role lain: Hanya eksekusi process mereka (terima, reject, complete)
 */

// Map role ke process yang bisa DIEKSEKUSI (bukan hanya dilihat)
export const ROLE_PROCESS_MAP: Record<UserRole, ProcessName[]> = {
  admin: [], // Admin lewat isAdmin flag, tidak butuh mapping
  ppic: [], // PPIC TIDAK eksekusi process, hanya assign
  warehouse: ["material_issued"],
  cutting: ["cutting", "material_request"],
  numbering: ["numbering"],
  shiwake: ["shiwake"],
  sewing: ["sewing"],
  qc: ["qc_sewing", "final_qc", "final_inspection"],
  ironing: ["ironing"],
  packing: ["packing"],
  shipping: ["loading", "shipping", "delivered"],
};

/**
 * CRITICAL: Cek apakah user bisa EKSEKUSI process (terima dari waiting list, input reject, complete)
 * - Admin (isAdmin=1): ✅ Bisa semua
 * - PPIC: ❌ TIDAK bisa eksekusi process apapun
 * - Role lain: ✅ Hanya process di ROLE_PROCESS_MAP mereka
 */
export function canExecuteProcess(
  userRole: UserRole,
  processName: ProcessName,
  isAdmin: boolean = false
): boolean {
  // Admin bisa semua
  if (isAdmin) return true;

  // PPIC TIDAK BISA eksekusi process
  if (userRole === "ppic") return false;

  // Role lain cek mapping
  const allowedProcesses = ROLE_PROCESS_MAP[userRole] || [];
  return allowedProcesses.includes(processName);
}

/**
 * Semua user bisa VIEW process (read-only)
 */
export function canViewProcess(
  userRole: UserRole,
  processName: ProcessName,
  isAdmin: boolean = false
): boolean {
  return true; // Semua bisa lihat
}

/**
 * Dapat role-role yang bisa handle process tertentu
 */
export function getRoleForProcess(processName: ProcessName): UserRole[] {
  const roles: UserRole[] = ["admin"]; // Admin selalu bisa

  for (const [role, processes] of Object.entries(ROLE_PROCESS_MAP)) {
    if (processes.includes(processName)) {
      roles.push(role as UserRole);
    }
  }

  return roles;
}

/**
 * Cek apakah user bisa RECEIVE transfer (terima surat jalan)
 * - Admin: ✅
 * - PPIC: ❌ (tidak handle process)
 * - Role lain: ✅ Hanya untuk process mereka
 */
export function canReceiveTransfer(
  userRole: UserRole,
  toProcessName: ProcessName,
  isAdmin: boolean = false
): boolean {
  if (isAdmin) return true;
  if (userRole === "ppic") return false;

  const allowedProcesses = ROLE_PROCESS_MAP[userRole] || [];
  return allowedProcesses.includes(toProcessName);
}

/**
 * Main Permission Object
 */
export const Permissions = {
  // ==================== ORDER MANAGEMENT ====================
  canCreateOrder: (role: UserRole, isAdmin: boolean = false) =>
    isAdmin || role === "ppic",

  canEditOrder: (role: UserRole, isAdmin: boolean = false) =>
    isAdmin || role === "ppic",

  canDeleteOrder: (role: UserRole, isAdmin: boolean = false) => isAdmin,

  canViewOrder: (role: UserRole, isAdmin: boolean = false) => true,

  // ==================== PROCESS ASSIGNMENT (PPIC ONLY) ====================
  /**
   * Assign process ke waiting list - HANYA PPIC & Admin
   */
  canAssignProcess: (role: UserRole, isAdmin: boolean = false) =>
    isAdmin || role === "ppic",

  // ==================== PROCESS EXECUTION (ROLE-BASED) ====================
  /**
   * Terima dari waiting list & eksekusi process (start, reject, complete)
   * - Admin: ✅ Semua
   * - PPIC: ❌ TIDAK BISA
   * - Role lain: ✅ Hanya process mereka
   */
  canTransitionProcess: (
    role: UserRole,
    processName: ProcessName,
    isAdmin: boolean = false
  ) => canExecuteProcess(role, processName, isAdmin),

  /**
   * Input Reject/Rework
   * - Admin: ✅ Semua
   * - PPIC: ❌ TIDAK BISA
   * - Role lain: ✅ Hanya process mereka
   */
  canRecordReject: (
    role: UserRole,
    processName: ProcessName,
    isAdmin: boolean = false
  ) => canExecuteProcess(role, processName, isAdmin),

  /**
   * View process details (read-only)
   */
  canViewProcess: (
    role: UserRole,
    processName: ProcessName,
    isAdmin: boolean = false
  ) => canViewProcess(role, processName, isAdmin),

  // ==================== TRANSFER LOG (SURAT JALAN) ====================
  /**
   * Create transfer - Otomatis saat complete process
   */
  canCreateTransfer: (
    role: UserRole,
    processName: ProcessName,
    isAdmin: boolean = false
  ) => canExecuteProcess(role, processName, isAdmin),

  /**
   * Receive transfer - Hanya role yang handle toProcess
   */
  canReceiveTransfer: (
    role: UserRole,
    toProcessName: ProcessName,
    isAdmin: boolean = false
  ) => canReceiveTransfer(role, toProcessName, isAdmin),

  // ==================== INVENTORY ====================
  canManageInventory: (role: UserRole, isAdmin: boolean = false) =>
    isAdmin || ["warehouse"].includes(role),

  // ==================== USERS ====================
  canManageUsers: (role: UserRole, isAdmin: boolean = false) => isAdmin,
};
