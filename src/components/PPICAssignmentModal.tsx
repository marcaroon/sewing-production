"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Modal, ModalFooter } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import {
  PROCESS_LABELS,
  PRODUCTION_PROCESSES,
  DELIVERY_PROCESSES,
  getAvailableNextProcesses,
  PROCESS_DEPARTMENT_MAP,
} from "@/lib/constants-new";
import apiClient from "@/lib/api-client";
import { ProcessName } from "@/lib/types-new";

interface PPICAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  currentProcess: string;
  onSuccess: () => void;
}

export const PPICAssignmentModal: React.FC<PPICAssignmentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  currentProcess,
  onSuccess,
}) => {
  const { user, checkPermission } = useAuth();
  const [completedProcesses, setCompletedProcesses] = useState<ProcessName[]>(
    []
  );
  const [inProgressProcesses, setInProgressProcesses] = useState<ProcessName[]>(
    []
  );
  const [availableProcesses, setAvailableProcesses] = useState<ProcessName[]>(
    []
  );
  const [selectedProcess, setSelectedProcess] = useState<ProcessName | "">("");
  const [assignedBy, setAssignedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canAssign = checkPermission("canAssignProcess");

  if (!canAssign) {
    return null;
  }

  useEffect(() => {
    if (user && isOpen) {
      setAssignedBy(user.name);
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (isOpen && orderId) {
      loadCompletedProcesses();
    }
  }, [isOpen, orderId]);

  const loadCompletedProcesses = async () => {
    try {
      // Get all process steps for this order
      const steps = await apiClient.getProcessStepsByOrderId(orderId);
      console.log("All Process Steps:", steps);

      // Separate by status
      const completed = steps
        .filter((s) => s.status === "completed")
        .map((s) => s.processName as ProcessName);

      const inProgress = steps
        .filter((s) => s.status === "in_progress" || s.status === "pending")
        .map((s) => s.processName as ProcessName);

      console.log("Completed:", completed);
      console.log("In Progress:", inProgress);

      // Get available processes (exclude completed AND in_progress)
      const available = getAvailableNextProcesses(completed, inProgress);
      console.log("Available:", available);

      // Keep them separate
      setCompletedProcesses(completed);
      setInProgressProcesses(inProgress);
      setAvailableProcesses(available);

      if (available.length > 0) {
        setSelectedProcess(available[0]);
      } else {
        setSelectedProcess("");
      }
    } catch (err) {
      console.error("Error loading processes:", err);
      setError("Failed to load available processes");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await apiClient.assignNextProcess({
        orderId,
        nextProcessName: selectedProcess as string,
        assignedBy,
        notes,
      });

      onSuccess();
      onClose();

      // Reset form
      setSelectedProcess("");
      setAssignedBy("");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign process");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDepartment = selectedProcess
    ? PROCESS_DEPARTMENT_MAP[selectedProcess]
    : "";

  const isProductionProcess = PRODUCTION_PROCESSES.includes(
    selectedProcess as any
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title="PPIC - Assign Next Process"
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Current Process Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              Current Situation
            </h4>
            <div className="text-sm space-y-1">
              <p className="text-blue-800">
                <span className="font-medium">Telah Selesai:</span>{" "}
                {PROCESS_LABELS[currentProcess as ProcessName]}
              </p>
              <p className="text-blue-800">
                <span className="font-medium">Status:</span> Menunggu PPIC
              </p>
              
              {/* Show completed processes */}
              {completedProcesses.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-blue-900 font-medium mb-1">
                    ✅ Completed Processes ({completedProcesses.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {completedProcesses.map(p => (
                      <span key={p} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {PROCESS_LABELS[p]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show in-progress processes */}
              {inProgressProcesses.length > 0 && (
                <div className="mt-2">
                  <p className="text-orange-900 font-medium mb-1">
                    ⏳ In Progress/Pending ({inProgressProcesses.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {inProgressProcesses.map(p => (
                      <span key={p} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        {PROCESS_LABELS[p]}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-orange-700 mt-2">
                    ℹ️ Process di atas tidak bisa di-assign lagi karena sedang berjalan
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Process Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Pilih Proses Selanjutnya *
            </label>
            <select
              value={selectedProcess}
              onChange={(e) =>
                setSelectedProcess(e.target.value as ProcessName)
              }
              className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              required
              disabled={isSubmitting}
            >
              <option value="">-- Pilih Proses --</option>

              {/* Production Processes */}
              {PRODUCTION_PROCESSES.filter((p) =>
                availableProcesses.includes(p)
              ).length > 0 && (
                <optgroup label="🏭 Production Phase">
                  {PRODUCTION_PROCESSES.filter((p) =>
                    availableProcesses.includes(p)
                  ).map((process) => (
                    <option key={process} value={process}>
                      {PROCESS_LABELS[process]}
                    </option>
                  ))}
                </optgroup>
              )}

              {/* Delivery Processes */}
              {DELIVERY_PROCESSES.filter((p) =>
                availableProcesses.includes(p)
              ).length > 0 && (
                <optgroup label="🚚 Delivery Phase">
                  {DELIVERY_PROCESSES.filter((p) =>
                    availableProcesses.includes(p)
                  ).map((process) => (
                    <option key={process} value={process}>
                      {PROCESS_LABELS[process]}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            {availableProcesses.length === 0 && (
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Tidak ada lagi proses tersedia. Order telah selesai atau semua proses sedang berjalan.
              </p>
            )}
          </div>

          {/* Selected Process Info */}
          {selectedProcess && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-3">
                Detail Assignment
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-800">Proses:</span>
                  <span className="font-semibold text-purple-900">
                    {PROCESS_LABELS[selectedProcess]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-800">Departemen:</span>
                  <span className="font-semibold text-purple-900">
                    {selectedDepartment}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-800">Fase:</span>
                  <Badge variant={isProductionProcess ? "info" : "success"}>
                    {isProductionProcess ? "Production" : "Delivery"}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Assigned By */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Nama (Staf PPIC) *
            </label>
            <input
              type="text"
              value={assignedBy}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 font-medium text-gray-900"
              disabled
            />
            <p className="text-xs text-gray-600 mt-1">
              Otomatis terisi dengan nama anda
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Catatan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Any special instructions or notes for this assignment..."
              disabled={isSubmitting}
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
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={
              isSubmitting ||
              !selectedProcess ||
              availableProcesses.length === 0
            }
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Assigning...
              </>
            ) : (
              "Assign Process"
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};