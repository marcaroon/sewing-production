// src/components/MaterialAccessorySelector.tsx

"use client";

import React, { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Material, Accessory } from "@/lib/types-inventory";

interface MaterialAccessorySelectorProps {
  totalQuantity: number;
  selectedMaterials: Array<{ materialId: string; quantityRequired: number }>;
  selectedAccessories: Array<{ accessoryId: string; quantityRequired: number }>;
  onMaterialsChange: (
    materials: Array<{ materialId: string; quantityRequired: number }>
  ) => void;
  onAccessoriesChange: (
    accessories: Array<{ accessoryId: string; quantityRequired: number }>
  ) => void;
}

export const MaterialAccessorySelector: React.FC<
  MaterialAccessorySelectorProps
> = ({
  totalQuantity,
  selectedMaterials,
  selectedAccessories,
  onMaterialsChange,
  onAccessoriesChange,
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const [matsRes, accsRes] = await Promise.all([
        fetch("/api/materials"),
        fetch("/api/accessories"),
      ]);

      const matsData = await matsRes.json();
      const accsData = await accsRes.json();

      if (matsData.success) setMaterials(matsData.data);
      if (accsData.success) setAccessories(accsData.data);
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMaterial = (materialId: string) => {
    if (!selectedMaterials.find((m) => m.materialId === materialId)) {
      onMaterialsChange([
        ...selectedMaterials,
        { materialId, quantityRequired: 0 },
      ]);
    }
  };

  const removeMaterial = (materialId: string) => {
    onMaterialsChange(
      selectedMaterials.filter((m) => m.materialId !== materialId)
    );
  };

  const updateMaterialQuantity = (materialId: string, quantity: number) => {
    onMaterialsChange(
      selectedMaterials.map((m) =>
        m.materialId === materialId ? { ...m, quantityRequired: quantity } : m
      )
    );
  };

  // Similar functions for accessories
  const addAccessory = (accessoryId: string) => {
    if (!selectedAccessories.find((a) => a.accessoryId === accessoryId)) {
      onAccessoriesChange([
        ...selectedAccessories,
        { accessoryId, quantityRequired: 0 },
      ]);
    }
  };

  const removeAccessory = (accessoryId: string) => {
    onAccessoriesChange(
      selectedAccessories.filter((a) => a.accessoryId !== accessoryId)
    );
  };

  const updateAccessoryQuantity = (accessoryId: string, quantity: number) => {
    onAccessoriesChange(
      selectedAccessories.map((a) =>
        a.accessoryId === accessoryId ? { ...a, quantityRequired: quantity } : a
      )
    );
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Materials Section */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Bahan</h4>

        {/* Selected Materials */}
        <div className="space-y-3 mb-4">
          {selectedMaterials.map((sm) => {
            const material = materials.find((m) => m.id === sm.materialId);
            if (!material) return null;

            return (
              <div
                key={sm.materialId}
                className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{material.name}</p>
                  <p className="text-sm text-gray-600">
                    {material.materialCode} • {material.category} • Stock:{" "}
                    {material.currentStock} {material.unit}
                  </p>
                </div>
                <input
                  type="number"
                  value={sm.quantityRequired || ""}
                  onChange={(e) =>
                    updateMaterialQuantity(
                      sm.materialId,
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="Qty"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                  step="0.01"
                />
                <span className="text-sm text-gray-600">{material.unit}</span>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => removeMaterial(sm.materialId)}
                >
                  Remove
                </Button>
              </div>
            );
          })}
        </div>

        {/* Add Material Dropdown */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              addMaterial(e.target.value);
              e.target.value = "";
            }
          }}
          className="w-full px-4 py-2 border text-gray-600 border-gray-300 rounded-lg"
        >
          <option value="">+ Tambah Bahan</option>
          {materials
            .filter(
              (m) => !selectedMaterials.find((sm) => sm.materialId === m.id)
            )
            .map((material) => (
              <option key={material.id} value={material.id}>
                {material.name} ({material.materialCode}) - Stok:{" "}
                {material.currentStock} {material.unit}
              </option>
            ))}
        </select>
      </div>

      {/* Accessories Section */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Aksesoris</h4>
        {/* Selected Accessories */}
        <div className="space-y-3 mb-4">
          {selectedAccessories.map((sa) => {
            const accessory = accessories.find((a) => a.id === sa.accessoryId);
            if (!accessory) return null;

            return (
              <div
                key={sa.accessoryId}
                className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {accessory.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {accessory.accessoryCode} • {accessory.category} • Stok:{" "}
                    {accessory.currentStock} {accessory.unit}
                  </p>
                </div>
                <input
                  type="number"
                  value={sa.quantityRequired || ""}
                  onChange={(e) =>
                    updateAccessoryQuantity(
                      sa.accessoryId,
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder="Qty"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span className="text-sm text-gray-600">{accessory.unit}</span>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => removeAccessory(sa.accessoryId)}
                >
                  Remove
                </Button>
              </div>
            );
          })}
        </div>

        {/* Add Accessory Dropdown */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              addAccessory(e.target.value);
              e.target.value = "";
            }
          }}
          className="w-full px-4 py-2 border text-gray-600 border-gray-300 rounded-lg"
        >
          <option value="">+ Tambah Aksesoris</option>
          {accessories
            .filter(
              (a) => !selectedAccessories.find((sa) => sa.accessoryId === a.id)
            )
            .map((accessory) => (
              <option key={accessory.id} value={accessory.id}>
                {accessory.name} ({accessory.accessoryCode}) - Stok:{" "}
                {accessory.currentStock} {accessory.unit}
              </option>
            ))}
        </select>
      </div>

      {/* Summary */}
      {(selectedMaterials.length > 0 || selectedAccessories.length > 0) && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-900 mb-2">Summary</h4>
          <p className="text-sm text-purple-800">
            Bahan: {selectedMaterials.length} items • Aksesoris:{" "}
            {selectedAccessories.length} items
          </p>
          <p className="text-xs text-purple-700 mt-1">
            Pastikan semua jumlah sesuai sebelum order dibuat
          </p>
        </div>
      )}
    </div>
  );
};
