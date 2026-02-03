// src/lib/permissions.ts
import { ProcessName } from "./types-new";

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

export type UserRole = string;

/**
 * Map department to processes they can EXECUTE
 */
export const DEPARTMENT_PROCESS_MAP: Record<Department, ProcessName[]> = {
  PPIC: [],
  Warehouse: ["material_issued"],
  Cutting: ["cutting"],
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
 * Normalize department name to match DEPARTMENT_PROCESS_MAP keys
 */
function normalizeDepartment(dept: string | undefined): Department {
  if (!dept) {
    console.warn("[PERMISSION] Empty department, defaulting to PPIC");
    return "PPIC";
  }

  const deptLower = dept.toLowerCase().trim();

  const mapping: Record<string, Department> = {
    ppic: "PPIC",
    warehouse: "Warehouse",
    cutting: "Cutting",
    numbering: "Numbering",
    shiwake: "Shiwake",
    "shiwake/sorting": "Shiwake",
    sorting: "Shiwake",
    sewing: "Sewing",
    "qc sewing": "QC Sewing",
    qcsewing: "QC Sewing",
    qc: "QC Sewing",
    ironing: "Ironing",
    "final qc": "Final QC",
    finalqc: "Final QC",
    packing: "Packing",
    shipping: "Shipping",
    loading: "Loading",
  };

  const normalized = mapping[deptLower];

  if (!normalized) {
    console.warn(
      `[PERMISSION] Unknown department "${dept}", defaulting to PPIC`
    );
    return "PPIC";
  }

  return normalized;
}

/**
 * Can execute process with detailed logging
 */
export function canExecuteProcess(
  userDepartment: string | undefined,
  processName: ProcessName,
  isAdmin: boolean = false
): boolean {
  if (isAdmin) {
    return true;
  }

  const normalizedDept = normalizeDepartment(userDepartment);

  if (normalizedDept === "PPIC") {
    return false;
  }

  const allowedProcesses = DEPARTMENT_PROCESS_MAP[normalizedDept] || [];

  const canExecute = allowedProcesses.includes(processName);

  return canExecute;
}

/**
 * Semua user bisa VIEW process
 */
export function canViewProcess(
  userDepartment: string,
  processName: ProcessName,
  isAdmin: boolean = false
): boolean {
  return true;
}

/**
 * Get departments yang bisa handle process tertentu
 */
export function getDepartmentForProcess(
  processName: ProcessName
): Department[] {
  const departments: Department[] = [];

  for (const [dept, processes] of Object.entries(DEPARTMENT_PROCESS_MAP)) {
    if (processes.includes(processName)) {
      departments.push(dept as Department);
    }
  }

  return departments;
}

/**
 * Can receive transfer
 */
export function canReceiveTransfer(
  userDepartment: string,
  toProcessName: ProcessName,
  isAdmin: boolean = false
): boolean {
  if (isAdmin) return true;

  const normalizedDept = normalizeDepartment(userDepartment);
  if (normalizedDept === "PPIC") return false;

  const allowedProcesses = DEPARTMENT_PROCESS_MAP[normalizedDept] || [];
  return allowedProcesses.includes(toProcessName);
}

/**
 * Main Permission Object
 */
export const Permissions = {
  canCreateOrder: (department: string, isAdmin: boolean = false) =>
    isAdmin || normalizeDepartment(department) === "PPIC",

  canEditOrder: (department: string, isAdmin: boolean = false) =>
    isAdmin || normalizeDepartment(department) === "PPIC",

  canDeleteOrder: (department: string, isAdmin: boolean = false) => isAdmin,

  canViewOrder: (department: string, isAdmin: boolean = false) => true,

  canAssignProcess: (department: string, isAdmin: boolean = false) =>
    isAdmin || normalizeDepartment(department) === "PPIC",

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

  canManageInventory: (department: string, isAdmin: boolean = false) =>
    isAdmin || normalizeDepartment(department) === "Warehouse",

  canManageUsers: (department: string, isAdmin: boolean = false) => isAdmin,
};

export function canModifyProcess(
  role: UserRole,
  processName: ProcessName,
  isAdmin: boolean = false
): boolean {
  return canExecuteProcess(role, processName, isAdmin);
}

export const ROLE_PROCESS_MAP = DEPARTMENT_PROCESS_MAP;

export function getRoleForProcess(processName: ProcessName): string[] {
  return getDepartmentForProcess(processName);
}
