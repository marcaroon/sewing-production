// src/lib/process-templates.ts
// Process Template System untuk Pre-defined Flow

import { ProcessName } from "./types-new";

// ==================== PROCESS TEMPLATES ====================

export interface ProcessTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  processes: ProcessName[];
  estimatedDays: number;
}

export const PROCESS_TEMPLATES: Record<string, ProcessTemplate> = {
  standard_shirt: {
    id: "standard_shirt",
    name: "Standard Shirt",
    description: "Kemeja standar dengan proses lengkap",
    category: "shirt",
    processes: [
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
      "packing",
      "final_inspection",
      "loading",
      "shipping",
      "delivered",
    ],
    estimatedDays: 12,
  },

  simple_shirt: {
    id: "simple_shirt",
    name: "Simple Shirt",
    description: "Kemeja sederhana tanpa numbering",
    category: "shirt",
    processes: [
      "draft",
      "material_request",
      "material_issued",
      "cutting",
      "sewing",
      "qc_sewing",
      "ironing",
      "final_qc",
      "packing",
      "final_inspection",
      "loading",
      "shipping",
      "delivered",
    ],
    estimatedDays: 10,
  },

  standard_pants: {
    id: "standard_pants",
    name: "Standard Pants",
    description: "Celana panjang standar",
    category: "pants",
    processes: [
      "draft",
      "material_request",
      "material_issued",
      "cutting",
      "numbering",
      "sewing",
      "qc_sewing",
      "ironing",
      "final_qc",
      "packing",
      "final_inspection",
      "loading",
      "shipping",
      "delivered",
    ],
    estimatedDays: 11,
  },

  simple_pants: {
    id: "simple_pants",
    name: "Simple Pants",
    description: "Celana sederhana tanpa numbering & shiwake",
    category: "pants",
    processes: [
      "draft",
      "material_request",
      "material_issued",
      "cutting",
      "sewing",
      "qc_sewing",
      "final_qc",
      "packing",
      "final_inspection",
      "loading",
      "shipping",
      "delivered",
    ],
    estimatedDays: 9,
  },

  complex_jacket: {
    id: "complex_jacket",
    name: "Complex Jacket",
    description: "Jaket dengan proses kompleks",
    category: "jacket",
    processes: [
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
      "packing",
      "final_inspection",
      "loading",
      "shipping",
      "delivered",
    ],
    estimatedDays: 14,
  },

  express_order: {
    id: "express_order",
    name: "Express Order",
    description: "Order express dengan proses minimal",
    category: "express",
    processes: [
      "draft",
      "material_issued",
      "cutting",
      "sewing",
      "final_qc",
      "packing",
      "delivered",
    ],
    estimatedDays: 5,
  },

  full_process: {
    id: "full_process",
    name: "Full Process",
    description: "Semua proses (default)",
    category: "all",
    processes: [
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
      "packing",
      "final_inspection",
      "loading",
      "shipping",
      "delivered",
    ],
    estimatedDays: 15,
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): ProcessTemplate[] {
  return Object.values(PROCESS_TEMPLATES).filter(
    (t) => t.category === category || t.category === "all"
  );
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): ProcessTemplate | null {
  return PROCESS_TEMPLATES[id] || null;
}

/**
 * Get all template options for select
 */
export function getTemplateOptions(): Array<{
  value: string;
  label: string;
  description: string;
  steps: number;
  days: number;
}> {
  return Object.values(PROCESS_TEMPLATES).map((template) => ({
    value: template.id,
    label: template.name,
    description: template.description,
    steps: template.processes.length,
    days: template.estimatedDays,
  }));
}

/**
 * Calculate process progress percentage
 */
export function calculateProcessProgress(
  completedProcesses: string[],
  totalProcesses: string[]
): {
  percentage: number;
  completed: number;
  total: number;
} {
  const completed = completedProcesses.length;
  const total = totalProcesses.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { percentage, completed, total };
}

/**
 * Get process status in template
 */
export function getProcessStatusInTemplate(
  processName: string,
  completedProcesses: string[],
  currentProcess: string
): "completed" | "current" | "pending" {
  if (completedProcesses.includes(processName)) return "completed";
  if (processName === currentProcess) return "current";
  return "pending";
}
