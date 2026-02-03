// src/components/MaterialUsageModal.tsx - RECORD USAGE IN PROCESS STEPS

"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalFooter } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Material, Accessory } from "@/lib/types-inventory";

interface MaterialUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  processStepId: string;
  processName: string;
}

export const MaterialUsageModal: React.FC<MaterialUsageModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  processStepId,
  processName,
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [usageData, setUsageData] = useState({
    materials: [] as Array<{
      materialId: string;
      quantityUsed: number;
      quantityWasted: number;
    }>,
    accessories: [] as Array<{
      accessoryId: string;
      quantityUsed: number;
      quantityWasted: number;
    }>,
    usedBy: "",
    notes: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadInventory();
    }
  }, [isOpen]);

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
    if (!usageData.materials.find((m) => m.materialId === materialId)) {
      setUsageData({
        ...usageData,
        materials: [
          ...usageData.materials,
          { materialId, quantityUsed: 0, quantityWasted: 0 },
        ],
      });
    }
  };

  const removeMaterial = (materialId: string) => {
    setUsageData({
      ...usageData,
      materials: usageData.materials.filter((m) => m.materialId !== materialId),
    });
  };

  const updateMaterial = (
    materialId: string,
    field: "quantityUsed" | "quantityWasted",
    value: number
  ) => {
    setUsageData({
      ...usageData,
      materials: usageData.materials.map((m) =>
        m.materialId === materialId ? { ...m, [field]: value } : m
      ),
    });
  };

  const addAccessory = (accessoryId: string) => {
    if (!usageData.accessories.find((a) => a.accessoryId === accessoryId)) {
      setUsageData({
        ...usageData,
        accessories: [
          ...usageData.accessories,
          { accessoryId, quantityUsed: 0, quantityWasted: 0 },
        ],
      });
    }
  };

  const removeAccessory = (accessoryId: string) => {
    setUsageData({
      ...usageData,
      accessories: usageData.accessories.filter(
        (a) => a.accessoryId !== accessoryId
      ),
    });
  };

  const updateAccessory = (
    accessoryId: string,
    field: "quantityUsed" | "quantityWasted",
    value: number
  ) => {
    setUsageData({
      ...usageData,
      accessories: usageData.accessories.map((a) =>
        a.accessoryId === accessoryId ? { ...a, [field]: value } : a
      ),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!usageData.usedBy.trim()) {
      setError("Masukkan nama");
      return;
    }

    if (
      usageData.materials.length === 0 &&
      usageData.accessories.length === 0
    ) {
      setError("Please add at least one material or accessory");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/process-steps/${processStepId}/usage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(usageData),
        }
      );

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
        // Reset form
        setUsageData({
          materials: [],
          accessories: [],
          usedBy: "",
          notes: "",
        });
      } else {
        setError(result.error || "Failed to record usage");
      }
    } catch (err) {
      setError("Failed to record usage");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title={`Record Material Usage - ${processName}`}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Materials Section */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">
              Materials Used
            </h4>

            {/* Selected Materials */}
            <div className="space-y-3 mb-4">
              {usageData.materials.map((um) => {
                const material = materials.find((m) => m.id === um.materialId);
                if (!material) return null;

                return (
                  <div
                    key={um.materialId}
                    className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {material.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {material.materialCode} • Stock: {material.currentStock}{" "}
                        {material.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <label className="text-xs text-foreground font-semibold">
                          Used
                        </label>
                        <input
                          type="number"
                          value={um.quantityUsed || ""}
                          onChange={(e) =>
                            updateMaterial(
                              um.materialId,
                              "quantityUsed",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          className="w-20 px-2 py-1 border border-border rounded text-sm"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-foreground font-semibold">
                          Wasted
                        </label>
                        <input
                          type="number"
                          value={um.quantityWasted || ""}
                          onChange={(e) =>
                            updateMaterial(
                              um.materialId,
                              "quantityWasted",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          className="w-20 px-2 py-1 border border-border rounded text-sm"
                          step="0.01"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {material.unit}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeMaterial(um.materialId)}
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
              className="w-full px-4 py-2 border border-border rounded-lg"
            >
              <option value="">+ Add Material</option>
              {materials
                .filter(
                  (m) =>
                    !usageData.materials.find((um) => um.materialId === m.id)
                )
                .map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.materialCode}) - Stock:{" "}
                    {material.currentStock} {material.unit}
                  </option>
                ))}
            </select>
          </div>

          {/* Accessories Section */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">
              Accessories Used
            </h4>

            {/* Selected Accessories */}
            <div className="space-y-3 mb-4">
              {usageData.accessories.map((ua) => {
                const accessory = accessories.find(
                  (a) => a.id === ua.accessoryId
                );
                if (!accessory) return null;

                return (
                  <div
                    key={ua.accessoryId}
                    className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {accessory.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {accessory.accessoryCode} • Stock:{" "}
                        {accessory.currentStock} {accessory.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <label className="text-xs text-foreground font-semibold">
                          Used
                        </label>
                        <input
                          type="number"
                          value={ua.quantityUsed || ""}
                          onChange={(e) =>
                            updateAccessory(
                              ua.accessoryId,
                              "quantityUsed",
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          className="w-20 px-2 py-1 border border-border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-foreground font-semibold">
                          Wasted
                        </label>
                        <input
                          type="number"
                          value={ua.quantityWasted || ""}
                          onChange={(e) =>
                            updateAccessory(
                              ua.accessoryId,
                              "quantityWasted",
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          className="w-20 px-2 py-1 border border-border rounded text-sm"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {accessory.unit}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeAccessory(ua.accessoryId)}
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
              className="w-full px-4 py-2 border border-border rounded-lg"
            >
              <option value="">+ Add Accessory</option>
              {accessories
                .filter(
                  (a) =>
                    !usageData.accessories.find((ua) => ua.accessoryId === a.id)
                )
                .map((accessory) => (
                  <option key={accessory.id} value={accessory.id}>
                    {accessory.name} ({accessory.accessoryCode}) - Stock:{" "}
                    {accessory.currentStock} {accessory.unit}
                  </option>
                ))}
            </select>
          </div>

          {/* Used By */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Recorded By *
            </label>
            <input
              type="text"
              value={usageData.usedBy}
              onChange={(e) =>
                setUsageData({ ...usageData, usedBy: e.target.value })
              }
              className="w-full px-4 py-2 border border-border rounded-lg"
              placeholder="Your name"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={usageData.notes}
              onChange={(e) =>
                setUsageData({ ...usageData, notes: e.target.value })
              }
              className="w-full px-4 py-2 border border-border rounded-lg"
              rows={3}
              placeholder="Any additional notes..."
            />
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
            {isSubmitting ? "Recording..." : "Record Usage"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
