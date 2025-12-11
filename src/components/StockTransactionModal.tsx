// src/components/StockTransactionModal.tsx

"use client";

import React, { useState } from "react";
import { Modal, ModalFooter } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

interface StockTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: {
    id: string;
    code: string;
    name: string;
    unit: string;
    currentStock?: number;
  };
  type: "material" | "accessory";
}

const TRANSACTION_TYPES = [
  { value: "in", label: "Stock In (Receive)", color: "success" },
  { value: "out", label: "Stock Out (Issue)", color: "danger" },
  { value: "adjustment", label: "Stock Adjustment", color: "warning" },
  { value: "return", label: "Return from Production", color: "info" },
];

export const StockTransactionModal: React.FC<StockTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  item,
  type,
}) => {
  const [formData, setFormData] = useState({
    transactionType: "in" as string,
    quantity: 0,
    referenceType: "",
    referenceId: "",
    remarks: "",
    performedBy: "Admin",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (formData.quantity <= 0) {
      setError("Quantity must be greater than 0");
      setIsSubmitting(false);
      return;
    }

    try {
      const endpoint =
        type === "material"
          ? `/api/materials/${item.id}/transactions`
          : `/api/accessories/${item.id}/transactions`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          transactionType: "in",
          quantity: 0,
          referenceType: "",
          referenceId: "",
          remarks: "",
          performedBy: "Admin",
        });
      } else {
        setError(result.error || "Failed to record transaction");
      }
    } catch (err) {
      setError("Failed to record transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = TRANSACTION_TYPES.find(
    (t) => t.value === formData.transactionType
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title="Stock Transaction"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Item Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-600">{item.code}</p>
              </div>
              <Badge variant="info">{type}</Badge>
            </div>
            {item.currentStock !== undefined && (
              <div className="mt-2 pt-2 border-t border-blue-300">
                <p className="text-sm text-gray-700">
                  Current Stock:{" "}
                  <span className="font-bold">
                    {item.currentStock} {item.unit}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Transaction Type *
            </label>
            <select
              value={formData.transactionType}
              onChange={(e) =>
                setFormData({ ...formData, transactionType: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              disabled={isSubmitting}
            >
              {TRANSACTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Quantity *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={formData.quantity || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity:
                      type === "material"
                        ? parseFloat(e.target.value) || 0
                        : parseInt(e.target.value) || 0,
                  })
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                step={type === "material" ? "0.01" : "1"}
                min="0"
                required
                disabled={isSubmitting}
              />
              <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-semibold">
                {item.unit}
              </div>
            </div>
          </div>

          {/* Reference */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Reference Type
              </label>
              <input
                type="text"
                value={formData.referenceType}
                onChange={(e) =>
                  setFormData({ ...formData, referenceType: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Purchase, Order, etc"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Reference ID
              </label>
              <input
                type="text"
                value={formData.referenceId}
                onChange={(e) =>
                  setFormData({ ...formData, referenceId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="PO#, Order#, etc"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Remarks
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Additional notes..."
              disabled={isSubmitting}
            />
          </div>

          {/* Summary */}
          {formData.quantity > 0 && (
            <div
              className={`border-2 rounded-lg p-4 ${
                formData.transactionType === "in"
                  ? "bg-green-50 border-green-300"
                  : formData.transactionType === "out"
                  ? "bg-red-50 border-red-300"
                  : "bg-yellow-50 border-yellow-300"
              }`}
            >
              <p className="font-semibold text-gray-900 mb-2">Summary:</p>
              <p className="text-sm text-gray-800">
                <span className="font-bold">{selectedType?.label}</span> of{" "}
                <span className="font-bold">
                  {formData.quantity} {item.unit}
                </span>
              </p>
              {item.currentStock !== undefined && (
                <p className="text-sm text-gray-800 mt-1">
                  New stock will be:{" "}
                  <span className="font-bold">
                    {formData.transactionType === "in"
                      ? item.currentStock + formData.quantity
                      : formData.transactionType === "out"
                      ? item.currentStock - formData.quantity
                      : "Depends on adjustment"}{" "}
                    {item.unit}
                  </span>
                </p>
              )}
            </div>
          )}
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
            {isSubmitting ? "Recording..." : "Record Transaction"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
