// lib/types-new.ts
// Updated Types for New Production Flow

import { DELIVERY_PROCESSES, PRODUCTION_PROCESSES } from "./constants-new";

// ==================== PHASE & STATE ====================

export type ProductionPhase = "production" | "delivery";

export type ProcessState =
  | "at_ppic" // Di PPIC untuk review/assign
  | "waiting" // Di waiting list department
  | "assigned" // Sudah di-assign ke operator
  | "in_progress" // Sedang dikerjakan
  | "completed"; // Selesai

export type ProcessStatus =
  | "pending" // Belum mulai
  | "in_progress" // Sedang berjalan
  | "completed" // Selesai
  | "on_hold"; // Ditunda

// ==================== PROCESSES ====================

// Production Phase Processes
export type ProductionProcess =
  | "draft"
  | "material_request"
  | "material_issued"
  | "cutting"
  | "numbering"
  | "shiwake"
  | "sewing"
  | "qc_sewing"
  | "ironing"
  | "final_qc";

// Delivery Phase Processes
export type DeliveryProcess =
  | "packing"
  | "final_inspection"
  | "loading"
  | "shipping"
  | "delivered";

export type ProcessName = ProductionProcess | DeliveryProcess;

// ==================== REJECT ====================

export type RejectType =
  | "material_defect"
  | "cutting_error"
  | "sewing_defect"
  | "measurement_error"
  | "color_mismatch"
  | "stain_damage"
  | "other";

export type RejectCategory = "reject" | "rework";

export type RejectAction = "rework" | "scrap" | "pending";

export type RejectDisposition =
  | "passed" // Setelah rework berhasil
  | "scrapped" // Dibuang
  | "pending"; // Masih menunggu keputusan

// ==================== BUYER ====================

export type BuyerType = "repeat" | "one-time";

export interface Buyer {
  id: string;
  name: string;
  type: BuyerType;
  code: string;
  contactPerson?: string;
  phone?: string;
  leftoverPolicy: {
    canReuse: boolean;
    returRequired: boolean;
    storageLocation?: string;
  };
}

// ==================== STYLE ====================

export type GarmentCategory = "shirt" | "pants" | "jacket" | "dress" | "other";
export type SizeType = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL";

export interface Style {
  id: string;
  styleCode: string;
  name: string;
  category: GarmentCategory;
  description?: string;
  imageUrl?: string;
  estimatedCuttingTime?: number;
  estimatedSewingTime?: number;
}

export interface SizeBreakdown {
  size: SizeType;
  quantity: number;
  completed: number;
  rejected: number;
  bundleCount?: number;
}

// ==================== ORDER ====================

export interface Order {
  id: string;
  orderNumber: string;
  buyer: Buyer;
  style: Style;
  orderDate: Date;

  // TWO DEADLINES
  productionDeadline: Date; // Deadline produksi selesai
  deliveryDeadline: Date; // Deadline kirim ke buyer

  totalQuantity: number;
  sizeBreakdown: SizeBreakdown[];

  // CURRENT STATE
  currentPhase: ProductionPhase;
  currentProcess: ProcessName;
  currentState: ProcessState;

  assignedLine?: string;
  assignedTo?: string;
  materialsIssued: boolean;

  totalCompleted: number;
  totalRejected: number;
  totalRework: number;

  hasLeftover: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  notes?: string;

  // Related data
  processSteps?: ProcessStep[];
  processTransitions?: ProcessTransition[];
  rejectLogs?: RejectLog[];
}

// ==================== PROCESS STEP ====================

export interface ProcessStep {
  id: string;
  orderId: string;
  processName: ProcessName;
  processPhase: ProductionPhase;
  sequenceOrder: number;
  department: string;

  status: ProcessStatus;

  // Assignment
  assignedTo?: string;
  assignedLine?: string;

  // DETAILED TIMESTAMPS
  arrivedAtPpicTime?: Date; // Sampai di PPIC
  addedToWaitingTime?: Date; // Masuk waiting list
  assignedTime?: Date; // Di-assign ke operator
  startedTime?: Date; // Mulai dikerjakan
  completedTime?: Date; // Selesai

  // Quantities
  quantityReceived: number;
  quantityCompleted: number;
  quantityRejected: number;
  quantityRework: number;

  // Duration (in minutes)
  waitingDuration?: number;
  processingDuration?: number;
  totalDuration?: number;

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

// ==================== PROCESS TRANSITION ====================

export interface ProcessTransition {
  id: string;
  orderId: string;
  processStepId: string;

  fromState: ProcessState;
  toState: ProcessState;

  transitionTime: Date;
  performedBy: string;

  processName: ProcessName;
  department: string;

  quantity?: number;
  notes?: string;

  createdAt: Date;
}

// ==================== REJECT LOG ====================

export interface RejectLog {
  id: string;
  orderId: string;
  processStepId: string;

  processName: ProcessName;
  processPhase: ProductionPhase;

  detectedTime: Date;
  reportedBy: string;

  rejectType: RejectType;
  rejectCategory: RejectCategory;

  quantity: number;
  size?: string;
  bundleNumber?: string;

  description: string;
  rootCause?: string;

  // Action
  action: RejectAction;
  actionTakenBy?: string;
  actionTakenTime?: Date;

  // Resolution
  reworkCompleted: boolean;
  reworkCompletedTime?: Date;
  finalDisposition?: RejectDisposition;

  images?: string[];

  createdAt: Date;
  updatedAt: Date;
}

// ==================== OTHER MODELS ====================

export interface Bundle {
  bundleNumber: string;
  orderId: string;
  size: SizeType;
  quantity: number;
  currentLocation: string;
  currentStatus: string;
  createdAt: Date;
  lastUpdated: Date;
}

export interface SewingLine {
  id: string;
  lineName: string;
  lineCode: string;
  capacity: number;
  currentLoad: number;
  operators: number;
  supervisor: string;
  status: "active" | "maintenance" | "inactive";
}

export interface User {
  id: string;
  name: string;
  department: string;
  role:
    | "admin"
    | "ppic"
    | "cutting"
    | "sewing"
    | "qc"
    | "warehouse"
    | "packing"
    | "shipping";
}

export interface LeftoverMaterial {
  id: string;
  orderId: string;
  orderNumber: string;
  buyerId: string;
  buyerType: BuyerType;
  materials: any[];
  status: "stored" | "reused" | "returned" | "disposed";
  storageLocation?: string;
  notes?: string;
  createdAt: Date;
}

// ==================== DASHBOARD ====================

export interface DashboardStats {
  totalOrders: number;
  ordersInProduction: number;
  ordersInDelivery: number;
  ordersCompleted: number;
  ordersOnHold: number;
  wipProduction: number;
  wipDelivery: number;
  avgProductionTime: number;
  avgDeliveryTime: number;
  totalRejectRate: number;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ProcessStepUpdate {
  processStepId: string;
  newState: ProcessState;
  performedBy: string;
  assignedTo?: string;
  assignedLine?: string;
  quantity?: number;
  notes?: string;
}

export interface RejectLogCreate {
  processStepId: string;
  rejectType: RejectType;
  rejectCategory: RejectCategory;
  quantity: number;
  size?: string;
  bundleNumber?: string;
  description: string;
  rootCause?: string;
  action: RejectAction;
  reportedBy: string;
  images?: string[];
}

export function isProcessState(value: string): value is ProcessState {
  return [
    "at_ppic",
    "waiting",
    "assigned",
    "in_progress",
    "completed",
  ].includes(value);
}

export function isProductionPhase(value: string): value is ProductionPhase {
  return ["production", "delivery"].includes(value);
}

export function isProcessName(value: string): value is ProcessName {
  return [...PRODUCTION_PROCESSES, ...DELIVERY_PROCESSES].includes(
    value as any
  );
}
