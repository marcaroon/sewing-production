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

export const ROLE_PROCESS_MAP: Record<UserRole, ProcessName[]> = {
  admin: [], // Admin lewat isAdmin flag
  ppic: [], // PPIC tidak execute process, hanya assign
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

export function canModifyProcess(
  userRole: UserRole,
  processName: ProcessName,
  isAdmin: boolean = false
): boolean {
  if (isAdmin) return true;

  if (userRole === "ppic") return false;

  const allowedProcesses = ROLE_PROCESS_MAP[userRole] || [];
  return allowedProcesses.includes(processName);
}

export function canViewProcess(
  userRole: UserRole,
  processName: ProcessName,
  isAdmin: boolean = false
): boolean {
  return true;
}

export function getRoleForProcess(processName: ProcessName): UserRole[] {
  const roles: UserRole[] = ["admin", "ppic"];

  for (const [role, processes] of Object.entries(ROLE_PROCESS_MAP)) {
    if (processes.includes(processName)) {
      roles.push(role as UserRole);
    }
  }

  return roles;
}

export function canExecuteProcess(
  userRole: UserRole,
  processName: ProcessName,
  isAdmin: boolean = false
): boolean {
  if (isAdmin) return true;

  if (userRole === "ppic") return false;

  const allowedProcesses = ROLE_PROCESS_MAP[userRole] || [];
  return allowedProcesses.includes(processName);
}

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

export const Permissions = {
  canCreateOrder: (role: UserRole, isAdmin: boolean = false) =>
    isAdmin || ["ppic"].includes(role),

  canEditOrder: (role: UserRole, isAdmin: boolean = false) =>
    isAdmin || ["ppic"].includes(role),

  canDeleteOrder: (role: UserRole, isAdmin: boolean = false) => isAdmin,

  canViewOrder: (role: UserRole, isAdmin: boolean = false) => true,

  canAssignProcess: (role: UserRole, isAdmin: boolean = false) =>
    isAdmin || ["ppic"].includes(role),

  canTransitionProcess: (
    role: UserRole,
    processName: ProcessName,
    isAdmin: boolean = false
  ) => {
    if (isAdmin) return true;
    if (role === "ppic") return false;
    return canExecuteProcess(role, processName, isAdmin);
  },

  canRecordReject: (
    role: UserRole,
    processName: ProcessName,
    isAdmin: boolean = false
  ) => {
    if (isAdmin) return true;
    if (role === "ppic") return false;
    return canExecuteProcess(role, processName, isAdmin);
  },

  canViewProcess: (
    role: UserRole,
    processName: ProcessName,
    isAdmin: boolean = false
  ) => canViewProcess(role, processName, isAdmin),

  canCreateTransfer: (
    role: UserRole,
    processName: ProcessName,
    isAdmin: boolean = false
  ) => canExecuteProcess(role, processName, isAdmin),

  canReceiveTransfer: (
    role: UserRole,
    toProcessName: ProcessName,
    isAdmin: boolean = false
  ) => canReceiveTransfer(role, toProcessName, isAdmin),

  canManageInventory: (role: UserRole, isAdmin: boolean = false) =>
    isAdmin || ["warehouse"].includes(role),

  canManageUsers: (role: UserRole, isAdmin: boolean = false) => isAdmin,
};
