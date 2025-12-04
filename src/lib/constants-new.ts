// lib/constants-new.ts
// Constants for New Production Flow

import {
  ProcessState,
  ProcessName,
  ProductionPhase,
  RejectType,
  RejectCategory,
  RejectAction,
} from "./types-new";

// ==================== DEPARTMENTS ====================

export const DEPARTMENTS = {
  PPIC: "PPIC",
  WAREHOUSE: "Warehouse",
  CUTTING: "Cutting",
  NUMBERING: "Numbering",
  SHIWAKE: "Shiwake/Sorting",
  SEWING: "Sewing",
  QC_SEWING: "QC Sewing",
  IRONING: "Ironing",
  FINAL_QC: "Final QC",
  PACKING: "Packing",
  SHIPPING: "Shipping",
  LOADING: "Loading",
} as const;

// ==================== PROCESS STATE LABELS ====================

export const PROCESS_STATE_LABELS: Record<ProcessState, string> = {
  at_ppic: "Di PPIC",
  waiting: "Waiting List",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
};

export const PROCESS_STATE_COLORS: Record<ProcessState, string> = {
  at_ppic: "bg-blue-100 text-blue-800",
  waiting: "bg-yellow-100 text-yellow-800",
  assigned: "bg-purple-100 text-purple-800",
  in_progress: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
};

// ==================== PRODUCTION PROCESSES ====================

export const PRODUCTION_PROCESSES: ProcessName[] = [
  "draft",
  "material_request",
  "material_issued",
  "cutting",
  "numbering",
  "shiwake",
  "sewing",
  "qc_sewing",
  "ironing",
  "final_qc",
];

export const DELIVERY_PROCESSES: ProcessName[] = [
  "packing",
  "final_inspection",
  "loading",
  "shipping",
  "delivered",
];

export const ALL_PROCESSES = [...PRODUCTION_PROCESSES, ...DELIVERY_PROCESSES];

// ==================== PROCESS LABELS ====================

export const PROCESS_LABELS: Record<ProcessName, string> = {
  // Production
  draft: "Draft",
  material_request: "Request Material",
  material_issued: "Material Issued",
  cutting: "Cutting",
  numbering: "Numbering",
  shiwake: "Shiwake/Sorting",
  sewing: "Sewing",
  qc_sewing: "QC Sewing",
  ironing: "Ironing",
  final_qc: "Final QC",

  // Delivery
  packing: "Packing",
  final_inspection: "Final Inspection",
  loading: "Loading",
  shipping: "Shipping",
  delivered: "Delivered",
};

// ==================== PROCESS DEPARTMENT MAPPING ====================

export const PROCESS_DEPARTMENT_MAP: Record<ProcessName, string> = {
  draft: DEPARTMENTS.PPIC,
  material_request: DEPARTMENTS.CUTTING,
  material_issued: DEPARTMENTS.WAREHOUSE,
  cutting: DEPARTMENTS.CUTTING,
  numbering: DEPARTMENTS.NUMBERING,
  shiwake: DEPARTMENTS.SHIWAKE,
  sewing: DEPARTMENTS.SEWING,
  qc_sewing: DEPARTMENTS.QC_SEWING,
  ironing: DEPARTMENTS.IRONING,
  final_qc: DEPARTMENTS.FINAL_QC,
  packing: DEPARTMENTS.PACKING,
  final_inspection: DEPARTMENTS.FINAL_QC,
  loading: DEPARTMENTS.LOADING,
  shipping: DEPARTMENTS.SHIPPING,
  delivered: DEPARTMENTS.SHIPPING,
};

// ==================== PHASE LABELS ====================

export const PHASE_LABELS: Record<ProductionPhase, string> = {
  production: "Production",
  delivery: "Delivery",
};

export const PHASE_COLORS: Record<ProductionPhase, string> = {
  production: "bg-blue-100 text-blue-800",
  delivery: "bg-green-100 text-green-800",
};

// ==================== REJECT TYPE LABELS ====================

export const REJECT_TYPE_LABELS: Record<RejectType, string> = {
  material_defect: "Cacat Material",
  cutting_error: "Kesalahan Cutting",
  sewing_defect: "Cacat Jahitan",
  measurement_error: "Kesalahan Ukuran",
  color_mismatch: "Warna Tidak Sesuai",
  stain_damage: "Noda/Kotor",
  other: "Lainnya",
};

export const REJECT_CATEGORY_LABELS: Record<RejectCategory, string> = {
  reject: "Reject",
  rework: "Rework",
};

export const REJECT_ACTION_LABELS: Record<RejectAction, string> = {
  rework: "Rework",
  scrap: "Scrap/Buang",
  pending: "Pending",
};

export const REJECT_TYPE_COLORS: Record<RejectCategory, string> = {
  reject: "bg-red-100 text-red-800",
  rework: "bg-yellow-100 text-yellow-800",
};

// ==================== STATE TRANSITION FLOW ====================

// Valid transitions from each state
export const VALID_STATE_TRANSITIONS: Record<ProcessState, ProcessState[]> = {
  at_ppic: ["waiting"],
  waiting: ["assigned"],
  assigned: ["in_progress", "waiting"], 
  in_progress: ["completed", "at_ppic"], 
  completed: ["at_ppic"],
};

// ==================== SIZE & CATEGORY ====================

export const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

export const GARMENT_CATEGORIES = {
  shirt: "Kemeja",
  pants: "Celana",
  jacket: "Jaket",
  dress: "Dress",
  other: "Lainnya",
} as const;

export const BUYER_TYPE_LABELS = {
  repeat: "Repeat Buyer",
  "one-time": "One-Time Buyer",
} as const;

// ==================== STORAGE KEYS ====================

export const STORAGE_KEYS = {
  ORDERS: "garment_orders_v2",
  BUYERS: "garment_buyers",
  STYLES: "garment_styles",
  PROCESS_STEPS: "garment_process_steps",
  PROCESS_TRANSITIONS: "garment_transitions",
  REJECT_LOGS: "garment_rejects",
  SEWING_LINES: "garment_sewing_lines",
  USERS: "garment_users",
  BUNDLES: "garment_bundles",
} as const;

// ==================== PREFIXES ====================

export const ORDER_PREFIX = "ORD";
export const BUNDLE_PREFIX = "BDL";

// ==================== DEFAULTS ====================

export const DEFAULTS = {
  BUNDLE_SIZE: 10,
  WORKING_HOURS_PER_DAY: 8,
  WORKING_DAYS_PER_WEEK: 6,
  PRODUCTION_BUFFER_DAYS: 2, // buffer antara production dan delivery deadline
} as const;

// ==================== PROCESS FLOW HELPERS ====================

/**
 * Get next process after current one
 */
export function getNextProcess(
  currentProcess: ProcessName,
  currentPhase: ProductionPhase
): ProcessName | null {
  if (currentPhase === "production") {
    const index = PRODUCTION_PROCESSES.indexOf(currentProcess);
    if (index >= 0 && index < PRODUCTION_PROCESSES.length - 1) {
      return PRODUCTION_PROCESSES[index + 1];
    }
    // Last production process -> move to delivery
    return DELIVERY_PROCESSES[0];
  } else {
    const index = DELIVERY_PROCESSES.indexOf(currentProcess);
    if (index >= 0 && index < DELIVERY_PROCESSES.length - 1) {
      return DELIVERY_PROCESSES[index + 1];
    }
    return null; // completed
  }
}

/**
 * Get next phase after current process
 */
export function getNextPhase(
  currentProcess: ProcessName,
  currentPhase: ProductionPhase
): ProductionPhase | null {
  if (currentPhase === "production") {
    const index = PRODUCTION_PROCESSES.indexOf(currentProcess);
    // If last production process, next phase is delivery
    if (index === PRODUCTION_PROCESSES.length - 1) {
      return "delivery";
    }
    return "production";
  } else {
    const index = DELIVERY_PROCESSES.indexOf(currentProcess);
    // If last delivery process, completed (no next phase)
    if (index === DELIVERY_PROCESSES.length - 1) {
      return null;
    }
    return "delivery";
  }
}

/**
 * Check if state transition is valid
 */
export function isValidStateTransition(
  fromState: ProcessState,
  toState: ProcessState
): boolean {
  const validTransitions = VALID_STATE_TRANSITIONS[fromState];
  return validTransitions ? validTransitions.includes(toState) : false;
}

/**
 * Get process sequence order
 */
export function getProcessSequenceOrder(processName: ProcessName): number {
  const prodIndex = PRODUCTION_PROCESSES.indexOf(processName);
  if (prodIndex >= 0) return prodIndex + 1;

  const delIndex = DELIVERY_PROCESSES.indexOf(processName);
  if (delIndex >= 0) return PRODUCTION_PROCESSES.length + delIndex + 1;

  return 0;
}
