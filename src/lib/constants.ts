// lib/constants.ts

import { ProcessStatus } from "./types";

// Department Names
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
} as const;

// Process Status Labels (Bahasa Indonesia untuk UI)
export const PROCESS_STATUS_LABELS: Record<ProcessStatus, string> = {
  draft: "Draft",
  cutting_plan: "Cutting Plan",
  material_request: "Request Material",
  material_issued: "Material Dikeluarkan",
  cutting: "Cutting Process",
  numbering: "Numbering",
  shiwake: "Shiwake/Sorting",
  transfer_to_sewing: "Transfer ke Sewing",
  sewing: "Sewing Process",
  qc_sewing: "QC Sewing",
  ironing: "Ironing",
  final_qc: "Final QC",
  packing: "Packing",
  completed: "Completed",
  on_hold: "On Hold",
  rejected: "Rejected",
};

// Status Color Coding
export const STATUS_COLORS: Record<ProcessStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  cutting_plan: "bg-blue-100 text-blue-800",
  material_request: "bg-yellow-100 text-yellow-800",
  material_issued: "bg-lime-100 text-lime-800",
  cutting: "bg-orange-100 text-orange-800",
  numbering: "bg-purple-100 text-purple-800",
  shiwake: "bg-pink-100 text-pink-800",
  transfer_to_sewing: "bg-indigo-100 text-indigo-800",
  sewing: "bg-cyan-100 text-cyan-800",
  qc_sewing: "bg-teal-100 text-teal-800",
  ironing: "bg-amber-100 text-amber-800",
  final_qc: "bg-emerald-100 text-emerald-800",
  packing: "bg-violet-100 text-violet-800",
  completed: "bg-green-100 text-green-800",
  on_hold: "bg-red-100 text-red-800",
  rejected: "bg-red-200 text-red-900",
};

// Process Flow (urutan proses)
export const PROCESS_FLOW: ProcessStatus[] = [
  "draft",
  "cutting_plan",
  "material_request",
  "material_issued",
  "cutting",
  "numbering",
  "shiwake",
  "transfer_to_sewing",
  "sewing",
  "qc_sewing",
  "ironing",
  "final_qc",
  "packing",
  "completed",
];

// Mapping department per status
export const STATUS_DEPARTMENT_MAP: Record<ProcessStatus, string> = {
  draft: DEPARTMENTS.PPIC,
  cutting_plan: DEPARTMENTS.PPIC,
  material_request: DEPARTMENTS.CUTTING,
  material_issued: DEPARTMENTS.WAREHOUSE,
  cutting: DEPARTMENTS.CUTTING,
  numbering: DEPARTMENTS.NUMBERING,
  shiwake: DEPARTMENTS.SHIWAKE,
  transfer_to_sewing: DEPARTMENTS.CUTTING,
  sewing: DEPARTMENTS.SEWING,
  qc_sewing: DEPARTMENTS.QC_SEWING,
  ironing: DEPARTMENTS.IRONING,
  final_qc: DEPARTMENTS.FINAL_QC,
  packing: DEPARTMENTS.PACKING,
  completed: DEPARTMENTS.SHIPPING,
  on_hold: "-",
  rejected: "-",
};

// Size Options
export const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

// Garment Categories
export const GARMENT_CATEGORIES = {
  shirt: "Kemeja",
  pants: "Celana",
  jacket: "Jaket",
  dress: "Dress",
  other: "Lainnya",
} as const;

// Buyer Type Labels
export const BUYER_TYPE_LABELS = {
  repeat: "Repeat Buyer",
  "one-time": "One-Time Buyer",
} as const;

// Reject Types
export const REJECT_TYPES = {
  material_defect: "Cacat Material",
  cutting_error: "Kesalahan Cutting",
  sewing_defect: "Cacat Jahitan",
  other: "Lainnya",
} as const;

// Transfer Item Conditions
export const ITEM_CONDITIONS = {
  good: "Baik",
  defect: "Cacat",
  rework: "Perlu Rework",
} as const;

// Leftover Status
export const LEFTOVER_STATUS = {
  stored: "Disimpan",
  reused: "Digunakan Kembali",
  returned: "Dikembalikan",
  disposed: "Dibuang",
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  ORDERS: "garment_orders",
  BUYERS: "garment_buyers",
  STYLES: "garment_styles",
  TRANSFER_LOGS: "garment_transfer_logs",
  PROCESS_HISTORY: "garment_process_history",
  REJECT_LOGS: "garment_reject_logs",
  LEFTOVER_MATERIALS: "garment_leftover_materials",
  SEWING_LINES: "garment_sewing_lines",
  USERS: "garment_users",
  BUNDLES: "garment_bundles",
} as const;

// Order Number Prefix
export const ORDER_PREFIX = "ORD";

// Transfer Number Prefix
export const TRANSFER_PREFIX = "TRF";

// Default Values
export const DEFAULTS = {
  BUNDLE_SIZE: 10, // default pieces per bundle
  WORKING_HOURS_PER_DAY: 8,
  WORKING_DAYS_PER_WEEK: 6,
} as const;
