// src/components/AccessoryForm.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalFooter } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Accessory } from "@/lib/types-inventory";

interface AccessoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accessory?: Accessory | null;
}

const ACCESSORY_CATEGORIES = [
  { value: "button", label: "Button / Kancing" },
  { value: "zipper", label: "Zipper / Resleting" },
  { value: "label", label: "Label / Tag" },
  { value: "elastic", label: "Elastic / Karet" },
  { value: "velcro", label: "Velcro / Perekat" },
  { value: "snap", label: "Snap Button" },
  { value: "other", label: "Other / Lainnya" },
];

const UNIT_OPTIONS = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "dozen", label: "Dozen (12 pcs)" },
  { value: "gross", label: "Gross (144 pcs)" },
  { value: "meter", label: "Meter (m)" },
  { value: "roll", label: "Roll" },
];

export const AccessoryForm: React.FC<AccessoryFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accessory,
}) => {
  const isEdit = !!accessory;

  const [formData, setFormData] = useState({
    accessoryCode: "",
    name: "",
    category: "button" as string,
    unit: "pcs" as string,
    color: "",
    size: "",
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
    if (accessory) {
      setFormData({
        accessoryCode: accessory.accessoryCode,
        name: accessory.name,
        category: accessory.category,
        unit: accessory.unit,
        color: accessory.color || "",
        size: accessory.size || "",
        supplier: accessory.supplier || "",
        minimumStock: accessory.minimumStock,
        reorderPoint: accessory.reorderPoint,
        unitPrice: accessory.unitPrice || 0,
        initialStock: 0,
        performedBy: "Admin",
      });
    } else {
      setFormData({
        accessoryCode: "",
        name: "",
        category: "button",
        unit: "pcs",
        color: "",
        size: "",
        supplier: "",
        minimumStock: 0,
        reorderPoint: 0,
        unitPrice: 0,
        initialStock: 0,
        performedBy: "Admin",
      });
    }
    setError("");
  }, [accessory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const url = isEdit
        ? `/api/accessories/${accessory.id}`
        : "/api/accessories";
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
        setError(result.error || "Failed to save accessory");
      }
    } catch (err) {
      setError("Failed to save accessory");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title={isEdit ? "Edit Accessory" : "Add New Accessory"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Code & Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Kode Aksesoris *
              </label>
              <input
                type="text"
                value={formData.accessoryCode}
                onChange={(e) =>
                  setFormData({ ...formData, accessoryCode: e.target.value })
                }
                className="w-full px-4 py-2 text-muted-foreground border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="ACC-001"
                required
                disabled={isEdit || isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nama Aksesoris *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 text-muted-foreground border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Plastic Button"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Kategori *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-2 text-muted-foreground border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              >
                {ACCESSORY_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Unit *
              </label>
              <select
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="w-full px-4 py-2 text-muted-foreground border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
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

          {/* Color & Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Warna (Opsional)
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="w-full px-4 py-2 text-muted-foreground border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Black, White, etc"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Ukuran (Opsional)
              </label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) =>
                  setFormData({ ...formData, size: e.target.value })
                }
                className="w-full px-4 py-2 text-muted-foreground border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="10mm, 15mm, etc"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Supplier (Opsional)
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) =>
                setFormData({ ...formData, supplier: e.target.value })
              }
              className="w-full px-4 py-2 text-muted-foreground border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Supplier name"
              disabled={isSubmitting}
            />
          </div>

          {/* Stock Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Stok Minimum *
              </label>
              <input
                type="number"
                value={formData.minimumStock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minimumStock: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 text-muted-foreground border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Reorder Point *
              </label>
              <input
                type="number"
                value={formData.reorderPoint}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reorderPoint: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 text-muted-foreground border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Price & Initial Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Harga Satuan (Rp)
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
                className="w-full px-4 py-2 text-muted-foreground border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
                disabled={isSubmitting}
              />
            </div>
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Initial Stok
                </label>
                <input
                  type="number"
                  value={formData.initialStock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initialStock: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 text-muted-foreground border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
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
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEdit ? "Update" : "Create"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
