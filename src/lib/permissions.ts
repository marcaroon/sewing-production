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
  admin: [], // Admin bisa semua
  ppic: ["draft", "material_request"], // PPIC handle assignment
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

// Check if user can modify a specific process
export function canModifyProcess(
  userRole: UserRole,
  processName: ProcessName
): boolean {
  // Admin dapat modify semua
  if (userRole === "admin") return true;

  // PPIC dapat assign process
  if (userRole === "ppic") return true;

  // Check if process is in user's role mapping
  return ROLE_PROCESS_MAP[userRole]?.includes(processName) || false;
}

// Check if user can view process (semua bisa view)
export function canViewProcess(
  userRole: UserRole,
  processName: ProcessName
): boolean {
  return true; // Semua role bisa view
}

// Get users by process (untuk dropdown assign)
export function getRoleForProcess(processName: ProcessName): UserRole[] {
  const roles: UserRole[] = ["admin", "ppic"]; // Admin dan PPIC selalu included

  for (const [role, processes] of Object.entries(ROLE_PROCESS_MAP)) {
    if (processes.includes(processName)) {
      roles.push(role as UserRole);
    }
  }

  return roles;
}

// Permission helpers
export const Permissions = {
  // Order permissions
  canCreateOrder: (role: UserRole) => ["admin", "ppic"].includes(role),
  canEditOrder: (role: UserRole) => ["admin", "ppic"].includes(role),
  canDeleteOrder: (role: UserRole) => ["admin"].includes(role),
  canViewOrder: (role: UserRole) => true,

  // Process permissions
  canAssignProcess: (role: UserRole) => ["admin", "ppic"].includes(role),
  canTransitionProcess: (role: UserRole, processName: ProcessName) =>
    canModifyProcess(role, processName),
  canRecordReject: (role: UserRole, processName: ProcessName) =>
    canModifyProcess(role, processName),

  // Transfer permissions
  canCreateTransfer: (role: UserRole, processName: ProcessName) =>
    canModifyProcess(role, processName),
  canReceiveTransfer: (role: UserRole, processName: ProcessName) =>
    canModifyProcess(role, processName),

  // Inventory permissions
  canManageInventory: (role: UserRole) => ["admin", "warehouse"].includes(role),

  // User management
  canManageUsers: (role: UserRole) => ["admin"].includes(role),
};
