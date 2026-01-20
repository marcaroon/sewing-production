// src/lib/permissions.ts - COMPLETELY FIXED VERSION with Better Logging
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
 * ✅ FIXED: Normalize department name to match DEPARTMENT_PROCESS_MAP keys
 * Handle all common variations and case sensitivity
 */
function normalizeDepartment(dept: string | undefined): Department {
  if (!dept) {
    console.warn("[PERMISSION] Empty department, defaulting to PPIC");
    return "PPIC";
  }

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
 * ✅ FIXED: Can execute process with detailed logging
 */
export function canExecuteProcess(
  userDepartment: string | undefined,
  processName: ProcessName,
  isAdmin: boolean = false
): boolean {
  console.group(`[PERMISSION CHECK] canExecuteProcess`);
  console.log("Raw User Department:", userDepartment);
  console.log("Process Name:", processName);
  console.log("Is Admin:", isAdmin);

  // ✅ CRITICAL FIX: Admin ALWAYS can execute
  if (isAdmin) {
    console.log("✅ Decision: GRANTED (Admin bypass)");
    console.groupEnd();
    return true;
  }

  // Normalize department name
  const normalizedDept = normalizeDepartment(userDepartment);
  console.log("Normalized Department:", normalizedDept);

  // PPIC tidak bisa execute (hanya assign)
  if (normalizedDept === "PPIC") {
    console.log("❌ Decision: DENIED (PPIC cannot execute)");
    console.groupEnd();
    return false;
  }

  // Check department permission
  const allowedProcesses = DEPARTMENT_PROCESS_MAP[normalizedDept] || [];
  console.log("Allowed processes for", normalizedDept, ":", allowedProcesses);

  const canExecute = allowedProcesses.includes(processName);
  console.log(canExecute ? "✅ Decision: GRANTED" : "❌ Decision: DENIED");
  console.groupEnd();

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

  console.log(`[PERMISSION] Departments for ${processName}:`, departments);
  return departments;
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

  const allowedProcesses = DEPARTMENT_PROCESS_MAP[normalizedDept] || [];
  return allowedProcesses.includes(toProcessName);
}

/**
 * ✅ FIXED: Main Permission Object
 */
export const Permissions = {
  // ==================== ORDER MANAGEMENT ====================
  canCreateOrder: (department: string, isAdmin: boolean = false) =>
    isAdmin || normalizeDepartment(department) === "PPIC",

  canEditOrder: (department: string, isAdmin: boolean = false) =>
    isAdmin || normalizeDepartment(department) === "PPIC",

  canDeleteOrder: (department: string, isAdmin: boolean = false) => isAdmin,

  canViewOrder: (department: string, isAdmin: boolean = false) => true,

  // ==================== PROCESS ASSIGNMENT (PPIC + ADMIN) ====================
  canAssignProcess: (department: string, isAdmin: boolean = false) =>
    isAdmin || normalizeDepartment(department) === "PPIC",

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
    isAdmin || normalizeDepartment(department) === "Warehouse",

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
