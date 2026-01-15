// src/lib/permissions.ts - COMPLETELY FIXED VERSION
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
  PPIC: [], // PPIC hanya assign, tidak execute
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
 * ✅ FIXED: Admin bypass semua permission checks
 * ✅ FIXED: Case-insensitive department matching
 */
export function canExecuteProcess(
  userDepartment: string,
  processName: ProcessName,
  isAdmin: boolean = false
): boolean {
  // ✅ CRITICAL FIX: Admin ALWAYS can execute
  if (isAdmin) {
    console.log("[PERMISSION] Admin bypass - GRANTED");
    return true;
  }

  // Normalize department name (handle case sensitivity)
  const normalizedDept = normalizeDepartment(userDepartment);

  console.log("[PERMISSION CHECK]");
  console.log("- User Department (raw):", userDepartment);
  console.log("- User Department (normalized):", normalizedDept);
  console.log("- Process Name:", processName);
  console.log("- isAdmin:", isAdmin);

  // PPIC tidak bisa execute (hanya assign)
  if (normalizedDept === "PPIC") {
    console.log("[PERMISSION] PPIC cannot execute - DENIED");
    return false;
  }

  // Check department permission
  const allowedProcesses =
    DEPARTMENT_PROCESS_MAP[normalizedDept as Department] || [];
  const canExecute = allowedProcesses.includes(processName);

  console.log("- Allowed processes for", normalizedDept, ":", allowedProcesses);
  console.log("- Decision:", canExecute ? "GRANTED" : "DENIED");

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
 * Normalize department name to match DEPARTMENT_PROCESS_MAP keys
 */
function normalizeDepartment(dept: string): Department {
  if (!dept) return "PPIC";

  const deptLower = dept.toLowerCase().trim();

  // Map common variations to correct keys
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
    ironing: "Ironing",
    "final qc": "Final QC",
    finalqc: "Final QC",
    packing: "Packing",
    shipping: "Shipping",
    loading: "Loading",
  };

  return mapping[deptLower] || (dept as Department);
}

/**
 * ✅ FIXED: Can receive transfer
 */
export function canReceiveTransfer(
  userDepartment: string,
  toProcessName: ProcessName,
  isAdmin: boolean = false
): boolean {
  if (isAdmin) return true;

  const normalizedDept = normalizeDepartment(userDepartment);
  if (normalizedDept === "PPIC") return false;

  const allowedProcesses =
    DEPARTMENT_PROCESS_MAP[normalizedDept as Department] || [];
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

  // ==================== PROCESS ASSIGNMENT (PPIC + ADMIN) ====================
  canAssignProcess: (department: string, isAdmin: boolean = false) =>
    isAdmin || department === "PPIC",

  // ==================== PROCESS EXECUTION (DEPARTMENT-BASED + ADMIN) ====================
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

// Legacy compatibility
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
