// lib/types.ts

// Tipe Buyer
export type BuyerType = "repeat" | "one-time";

export interface Buyer {
  id: string;
  name: string;
  type: BuyerType;
  code: string;
  contactPerson?: string;
  phone?: string;
  // Aturan untuk leftover material
  leftoverPolicy: {
    canReuse: boolean; // repeat buyer = true, one-time = false
    returRequired: boolean; // one-time buyer = true
    storageLocation?: string; // lokasi penyimpanan leftover
  };
}

// Status Proses Produksi
export type ProcessStatus =
  | "draft"
  | "cutting_plan"
  | "material_request"
  | "material_issued"
  | "cutting"
  | "numbering"
  | "shiwake"
  | "transfer_to_sewing"
  | "sewing"
  | "qc_sewing"
  | "ironing"
  | "final_qc"
  | "packing"
  | "completed"
  | "on_hold"
  | "rejected";

// Kategori Garment
export type GarmentCategory = "shirt" | "pants" | "jacket" | "dress" | "other";

// Size Standard
export type SizeType = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL";

// Breakdown per Size
export interface SizeBreakdown {
  size: SizeType;
  quantity: number;
  completed: number; // jumlah yang sudah selesai
  rejected: number; // jumlah reject
  bundleCount?: number; // jumlah bundle untuk size ini
}

// Style / Model Garment
export interface Style {
  id: string;
  styleCode: string;
  name: string;
  category: GarmentCategory;
  description?: string;
  imageUrl?: string;
  estimatedCuttingTime?: number; // dalam menit
  estimatedSewingTime?: number; // dalam menit per piece
}

// Material Request
export interface MaterialRequest {
  id: string;
  orderId: string;
  requestDate: Date;
  requestedBy: string; // nama PPIC/Cutting
  materials: MaterialItem[];
  status: "pending" | "approved" | "issued" | "rejected";
  notes?: string;
}

export interface MaterialItem {
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string; // meter, kg, yard, dll
  warehouseLocation?: string;
}

// Surat Jalan / Transfer Log
export interface TransferLog {
  id: string;
  transferNumber: string; // nomor surat jalan (auto-generated)
  orderId: string;
  orderNumber: string;
  fromDepartment: string;
  toDepartment: string;
  transferDate: Date;
  handedOverBy: string; // nama yang menyerahkan
  receivedBy: string; // nama yang menerima
  processStatus: ProcessStatus; // status saat transfer
  items: TransferItem[];
  notes?: string;
  isReceived: boolean; // sudah diterima atau belum
  receivedDate?: Date;
}

export interface TransferItem {
  description: string; // nama part / item
  bundleNumber?: string;
  quantity: number;
  unit: string; // pcs, bundle, dll
  condition: "good" | "defect" | "rework"; // kondisi barang
  remarks?: string;
}

// Tracking Bundle (untuk detail tracking per bundle)
export interface Bundle {
  bundleNumber: string;
  orderId: string;
  size: SizeType;
  quantity: number;
  currentLocation: string; // department sekarang
  currentStatus: ProcessStatus;
  createdAt: Date;
  lastUpdated: Date;
}

// Reject / Rework Tracking
export interface RejectLog {
  id: string;
  orderId: string;
  processStatus: ProcessStatus;
  date: Date;
  reportedBy: string;
  rejectType: "material_defect" | "cutting_error" | "sewing_defect" | "other";
  quantity: number;
  size?: SizeType;
  description: string;
  action: "rework" | "scrap" | "pending";
  images?: string[];
}

// Leftover Material
export interface LeftoverMaterial {
  id: string;
  orderId: string;
  orderNumber: string;
  buyerId: string;
  buyerType: BuyerType;
  materials: MaterialItem[];
  status: "stored" | "reused" | "returned" | "disposed";
  storageLocation?: string;
  notes?: string;
  createdAt: Date;
}

// Order Utama
export interface Order {
  id: string;
  orderNumber: string; // auto-generated (ORD-YYYY-XXXXX)
  buyer: Buyer;
  style: Style;
  orderDate: Date;
  targetDate: Date;
  totalQuantity: number;
  sizeBreakdown: SizeBreakdown[];
  currentStatus: ProcessStatus;
  assignedLine?: string; // sewing line yang ditugaskan

  // Tracking progress
  progress: {
    cutting: number; // persentase
    numbering: number;
    shiwake: number;
    sewing: number;
    qc: number;
    ironing: number;
    finalQc: number;
    packing: number;
  };

  // Informasi material
  materialRequest?: MaterialRequest;
  materialsIssued: boolean;

  // WIP tracking
  wip: {
    atCutting: number;
    atNumbering: number;
    atShiwake: number;
    atSewing: number;
    atQC: number;
    atIroning: number;
    atPacking: number;
  };

  // Lead time tracking (dalam jam)
  leadTime: {
    cutting?: number;
    numbering?: number;
    shiwake?: number;
    sewing?: number;
    qc?: number;
    ironing?: number;
    finalQc?: number;
    packing?: number;
  };

  // Reject summary
  totalRejected: number;
  totalRework: number;

  // Leftover handling
  hasLeftover: boolean;
  leftoverMaterial?: LeftoverMaterial;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  notes?: string;
}

// Process History Log (untuk timeline)
export interface ProcessHistoryLog {
  id: string;
  orderId: string;
  timestamp: Date;
  processStatus: ProcessStatus;
  action: string; // deskripsi aksi yang dilakukan
  performedBy: string;
  department: string;
  duration?: number; // durasi proses (dalam menit)
  notes?: string;
  transferLogId?: string; // referensi ke transfer log jika ada
}

// Dashboard Statistics
export interface DashboardStats {
  totalOrders: number;
  ordersInProgress: number;
  ordersCompleted: number;
  ordersOnHold: number;
  totalWIP: number;
  avgLeadTime: number; // dalam hari
  rejectRate: number; // persentase
}

// Sewing Line
export interface SewingLine {
  id: string;
  lineName: string;
  lineCode: string;
  capacity: number; // pieces per day
  currentLoad: number; // current WIP
  operators: number;
  supervisor: string;
  status: "active" | "maintenance" | "inactive";
}

// User (simplified untuk demo)
export interface User {
  id: string;
  name: string;
  department: string;
  role: "admin" | "ppic" | "cutting" | "sewing" | "qc" | "warehouse";
}
