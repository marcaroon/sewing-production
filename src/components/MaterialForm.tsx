// src/components/MaterialForm.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalFooter } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Material } from "@/lib/types-inventory";

interface MaterialFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  material?: Material | null; // null = create, Material = edit
}

const MATERIAL_CATEGORIES = [
  { value: "fabric", label: "Fabric / Kain" },
  { value: "thread", label: "Thread / Benang" },
  { value: "interlining", label: "Interlining / Vislin" },
  { value: "lining", label: "Lining / Furing" },
  { value: "other", label: "Other / Lainnya" },
];

const UNIT_OPTIONS = [
  { value: "meter", label: "Meter (m)" },
  { value: "yard", label: "Yard (yd)" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "roll", label: "Roll" },
  { value: "pcs", label: "Pieces (pcs)" },
];

export const MaterialForm: React.FC<MaterialFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  material,
}) => {
  const isEdit = !!material;

  const [formData, setFormData] = useState({
    materialCode: "",
    name: "",
    category: "fabric" as string,
    unit: "meter" as string,
    color: "",
    supplier: "",
    minimumStock: 0,
    reorderPoint: 0,
    unitPrice: 0,
    initialStock: 0,
    performedBy: "Admin",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (material) {
      setFormData({
        materialCode: material.materialCode,
        name: material.name,
        category: material.category,
        unit: material.unit,
        color: material.color || "",
        supplier: material.supplier || "",
        minimumStock: material.minimumStock,
        reorderPoint: material.reorderPoint,
        unitPrice: material.unitPrice || 0,
        initialStock: 0,
        performedBy: "Admin",
      });
    } else {
      // Reset form for create
      setFormData({
        materialCode: "",
        name: "",
        category: "fabric",
        unit: "meter",
        color: "",
        supplier: "",
        minimumStock: 0,
        reorderPoint: 0,
        unitPrice: 0,
        initialStock: 0,
        performedBy: "Admin",
      });
    }
    setError("");
  }, [material, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const url = isEdit ? `/api/materials/${material.id}` : "/api/materials";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || "Failed to save material");
      }
    } catch (err) {
      setError("Failed to save material");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title={isEdit ? "Edit Material" : "Add New Material"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Material Code & Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Material Code *
              </label>
              <input
                type="text"
                value={formData.materialCode}
                onChange={(e) =>
                  setFormData({ ...formData, materialCode: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="MAT-001"
                required
                disabled={isEdit || isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Material Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Cotton Fabric"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              >
                {MATERIAL_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Unit *
              </label>
              <select
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              >
                {UNIT_OPTIONS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Color & Supplier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Color (Optional)
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Blue, Red, etc"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Supplier (Optional)
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) =>
                  setFormData({ ...formData, supplier: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Supplier name"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Stock Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Minimum Stock *
              </label>
              <input
                type="number"
                value={formData.minimumStock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minimumStock: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Reorder Point *
              </label>
              <input
                type="number"
                value={formData.reorderPoint}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reorderPoint: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Price & Initial Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Unit Price (Rp)
              </label>
              <input
                type="number"
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    unitPrice: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
                disabled={isSubmitting}
              />
            </div>
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Initial Stock
                </label>
                <input
                  type="number"
                  value={formData.initialStock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initialStock: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEdit ? "Update" : "Create"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
