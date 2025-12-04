// components/StatusUpdateForm.tsx (Updated with API)

"use client";

import React, { useState } from "react";
import { Order, ProcessStatus } from "@/lib/types";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import {
  PROCESS_STATUS_LABELS,
  STATUS_DEPARTMENT_MAP,
} from "@/lib/constants";
import { getNextProcessStatus } from "@/lib/utils";
import apiClient from "@/lib/api-client";

interface StatusUpdateFormProps {
  order: Order;
  onUpdate: () => void;
}

export const StatusUpdateForm: React.FC<StatusUpdateFormProps> = ({
  order,
  onUpdate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  
  const [formData, setFormData] = useState({
    performedBy: "",
    receivedBy: "",
    notes: "",
    items: [
      {
        description: `${order.style.name} - All Sizes`,
        quantity: order.totalQuantity,
        unit: "pcs",
        condition: "good" as const,
      },
    ],
  });

  const nextStatus = getNextProcessStatus(order.currentStatus);

  if (!nextStatus || order.currentStatus === "completed") {
    return null;
  }

  const currentDepartment = STATUS_DEPARTMENT_MAP[order.currentStatus];
  const nextDepartment = STATUS_DEPARTMENT_MAP[nextStatus];

  // Ganti handleSubmit dengan:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setIsSubmitting(true);

  try {
    // Get current process step
    const processSteps = await apiClient.getProcessStepsByOrderId(order.id);
    const currentStep = processSteps.find(s => 
      s.status === "in_progress" || s.status === "pending"
    );

    if (!currentStep) {
      throw new Error("No active process step");
    }

    // Transition to completed
    await apiClient.transitionProcessStep(currentStep.id, {
      newState: "completed",
      performedBy: formData.performedBy,
      notes: formData.notes,
      quantity: order.totalQuantity
    });

    onUpdate();
  } catch (err) {
    setError("Failed to update status");
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} variant="primary">
        Update Status ke: {PROCESS_STATUS_LABELS[nextStatus]}
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title="Update Status Produksi"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current & Next Status Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-900 font-medium mb-1">
                  Status Sekarang
                </p>
                <p className="text-blue-800">
                  {PROCESS_STATUS_LABELS[order.currentStatus]}
                </p>
                <p className="text-blue-600 text-xs mt-1">
                  {currentDepartment}
                </p>
              </div>
              <div>
                <p className="text-blue-900 font-medium mb-1">
                  Status Berikutnya
                </p>
                <p className="text-blue-800">
                  {PROCESS_STATUS_LABELS[nextStatus]}
                </p>
                <p className="text-blue-600 text-xs mt-1">{nextDepartment}</p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-red-600 mr-3 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Transfer Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diserahkan oleh *
              </label>
              <input
                type="text"
                value={formData.performedBy}
                onChange={(e) =>
                  setFormData({ ...formData, performedBy: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nama staff yang menyerahkan"
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Department: {currentDepartment}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diterima oleh *
              </label>
              <input
                type="text"
                value={formData.receivedBy}
                onChange={(e) =>
                  setFormData({ ...formData, receivedBy: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nama staff yang menerima"
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Department: {nextDepartment}
              </p>
            </div>
          </div>

          {/* Items Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item yang Ditransfer
            </label>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-700">{item.description}</span>
                  <span className="font-semibold text-gray-900">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan (Opsional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tambahkan catatan jika ada reject, kurang, atau informasi penting lainnya"
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                "Update Status & Buat Surat Jalan"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};