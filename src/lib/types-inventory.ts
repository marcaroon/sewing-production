// src/lib/types-inventory.ts

export type MaterialCategory =
  | "fabric"
  | "thread"
  | "interlining"
  | "lining"
  | "other";

export type AccessoryCategory =
  | "button"
  | "zipper"
  | "label"
  | "elastic"
  | "velcro"
  | "snap"
  | "other";

export type StockTransactionType =
  | "in" // Purchase/Receiving
  | "out" // Issue to production
  | "adjustment" // Stock adjustment
  | "return"; // Return from production

export interface Material {
  id: string;
  materialCode: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  color?: string;
  supplier?: string;
  minimumStock: number;
  reorderPoint: number;
  unitPrice?: number;
  currentStock?: number; // Calculated field
  createdAt: Date;
  updatedAt: Date;
}

export interface Accessory {
  id: string;
  accessoryCode: string;
  name: string;
  category: AccessoryCategory;
  unit: string;
  color?: string;
  size?: string;
  supplier?: string;
  minimumStock: number;
  reorderPoint: number;
  unitPrice?: number;
  currentStock?: number; // Calculated field
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialStockTransaction {
  id: string;
  materialId: string;
  transactionType: StockTransactionType;
  quantity: number;
  unit: string;
  referenceType?: string;
  referenceId?: string;
  remarks?: string;
  performedBy: string;
  transactionDate: Date;
  createdAt: Date;
}

export interface AccessoryStockTransaction {
  id: string;
  accessoryId: string;
  transactionType: StockTransactionType;
  quantity: number;
  unit: string;
  referenceType?: string;
  referenceId?: string;
  remarks?: string;
  performedBy: string;
  transactionDate: Date;
  createdAt: Date;
}

export interface OrderMaterial {
  id: string;
  orderId: string;
  materialId: string;
  material?: Material;
  quantityRequired: number;
  quantityIssued: number;
  quantityUsed: number;
  quantityReturned: number;
  quantityWasted: number;
  unit: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderAccessory {
  id: string;
  orderId: string;
  accessoryId: string;
  accessory?: Accessory;
  quantityRequired: number;
  quantityIssued: number;
  quantityUsed: number;
  quantityReturned: number;
  quantityWasted: number;
  unit: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialUsage {
  id: string;
  processStepId: string;
  materialId: string;
  material?: Material;
  quantityUsed: number;
  quantityWasted: number;
  unit: string;
  usedBy: string;
  usageDate: Date;
  notes?: string;
  createdAt: Date;
}

export interface AccessoryUsage {
  id: string;
  processStepId: string;
  accessoryId: string;
  accessory?: Accessory;
  quantityUsed: number;
  quantityWasted: number;
  unit: string;
  usedBy: string;
  usageDate: Date;
  notes?: string;
  createdAt: Date;
}

export interface StockSummary {
  totalMaterials: number;
  totalAccessories: number;
  lowStockMaterials: number;
  lowStockAccessories: number;
  totalMaterialValue: number;
  totalAccessoryValue: number;
}
