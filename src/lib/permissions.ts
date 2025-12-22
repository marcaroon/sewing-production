// src/lib/permissions.ts - FILE BARU
import { ProcessName } from "./types-new";

export type UserRole =
  | "admin"
  | "ppic"
  | "cutting"
  | "sewing"
  | "qc"
  | "warehouse"
  | "packing"
  | "shipping"
  | "numbering"
  | "shiwake"
  | "ironing";

// Mapping Role ke Process yang mereka handle
export const ROLE_PROCESS_MAP: Record<UserRole, ProcessName[]> = {
  admin: [], // Admin bisa semua - akan di-handle khusus
  ppic: ["draft", "material_request"],
  warehouse: ["material_issued"],
  cutting: ["cutting"],
  numbering: ["numbering"],
  shiwake: ["shiwake"],
  sewing: ["sewing"],
  qc: ["qc_sewing", "final_qc", "final_inspection"],
  ironing: ["ironing"],
  packing: ["packing"],
  shipping: ["loading", "shipping", "delivered"],
};

export function canModifyProcess(
  userRole: UserRole,
  processName: ProcessName
): boolean {
  if (userRole === "admin") return true;

  if (userRole === "ppic") {
    // PPIC hanya bisa modify draft dan material_request
    return ["draft", "material_request"].includes(processName);
  }

  const allowedProcesses = ROLE_PROCESS_MAP[userRole] || [];
  return allowedProcesses.includes(processName);
}

export function canViewProcess(
  userRole: UserRole,
  processName: ProcessName
): boolean {
  if (userRole === "admin" || userRole === "ppic") return true;

  const allowedProcesses = ROLE_PROCESS_MAP[userRole] || [];
  return allowedProcesses.includes(processName);
}

export function getRoleForProcess(processName: ProcessName): UserRole[] {
  const roles: UserRole[] = ["admin", "ppic"]; // Admin dan PPIC selalu included

  for (const [role, processes] of Object.entries(ROLE_PROCESS_MAP)) {
    if (processes.includes(processName)) {
      roles.push(role as UserRole);
    }
  }

  return roles;
}

export function canExecuteProcess(
  userRole: UserRole,
  processName: ProcessName
): boolean {
  if (userRole === "admin") return true;

  if (userRole === "ppic") return false;

  const allowedProcesses = ROLE_PROCESS_MAP[userRole] || [];
  return allowedProcesses.includes(processName);
}

// Permission helpers
export const Permissions = {
  canCreateOrder: (role: UserRole) => ["admin", "ppic"].includes(role),
  canEditOrder: (role: UserRole) => ["admin", "ppic"].includes(role),
  canDeleteOrder: (role: UserRole) => ["admin"].includes(role),
  canViewOrder: (role: UserRole) => true, // Semua bisa view

  canAssignProcess: (role: UserRole) => ["admin", "ppic"].includes(role),

  canTransitionProcess: (role: UserRole, processName: ProcessName) => {
    // Admin bisa transition semua
    if (role === "admin") return true;
    // PPIC tidak bisa transition (hanya assign)
    if (role === "ppic") return false;
    // User lain check mapping
    return canExecuteProcess(role, processName);
  },

  canRecordReject: (role: UserRole, processName: ProcessName) => {
    // Admin bisa record reject semua
    if (role === "admin") return true;
    // PPIC tidak bisa record reject
    if (role === "ppic") return false;
    // User lain check mapping
    return canExecuteProcess(role, processName);
  },

  canViewProcess: (role: UserRole, processName: ProcessName) =>
    canViewProcess(role, processName),

  // Transfer permissions
  canCreateTransfer: (role: UserRole, processName: ProcessName) =>
    canExecuteProcess(role, processName),
  canReceiveTransfer: (role: UserRole, processName: ProcessName) =>
    canExecuteProcess(role, processName),

  // Inventory permissions
  canManageInventory: (role: UserRole) => ["admin", "warehouse"].includes(role),

  // User management
  canManageUsers: (role: UserRole) => ["admin"].includes(role),
};
