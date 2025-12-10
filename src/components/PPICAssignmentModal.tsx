"use client";

import React, { useState, useEffect } from "react";
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
  const [completedProcesses, setCompletedProcesses] = useState<ProcessName[]>(
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

  useEffect(() => {
    if (isOpen && orderId) {
      loadCompletedProcesses();
    }
  }, [isOpen, orderId]);

  const loadCompletedProcesses = async () => {
    try {
      const completed = await apiClient.getCompletedProcesses(orderId);
      setCompletedProcesses(completed as ProcessName[]);

      const available = getAvailableNextProcesses(completed as ProcessName[]);
      setAvailableProcesses(available);

      // Auto-select first available
      if (available.length > 0) {
        setSelectedProcess(available[0]);
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
              📋 Current Situation
            </h4>
            <div className="text-sm space-y-1">
              <p className="text-blue-800">
                <span className="font-medium">Just Completed:</span>{" "}
                {PROCESS_LABELS[currentProcess as ProcessName]}
              </p>
              <p className="text-blue-800">
                <span className="font-medium">Status:</span> Awaiting PPIC
                assignment
              </p>
            </div>
          </div>

          {/* Completed Processes History */}
          {completedProcesses.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3">
                ✓ Completed Processes
              </h4>
              <div className="flex flex-wrap gap-2">
                {completedProcesses.map((process) => (
                  <Badge key={process} variant="success">
                    {PROCESS_LABELS[process]}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-green-700 mt-2">
                These processes cannot be selected again
              </p>
            </div>
          )}

          {/* Process Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select Next Process *
            </label>
            <select
              value={selectedProcess}
              onChange={(e) =>
                setSelectedProcess(e.target.value as ProcessName)
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              required
              disabled={isSubmitting}
            >
              <option value="">-- Select Process --</option>

              {/* Production Processes */}
              <optgroup label="📦 Production Phase">
                {PRODUCTION_PROCESSES.filter((p) =>
                  availableProcesses.includes(p)
                ).map((process) => (
                  <option key={process} value={process}>
                    {PROCESS_LABELS[process]}
                  </option>
                ))}
              </optgroup>

              {/* Delivery Processes */}
              <optgroup label="🚚 Delivery Phase">
                {DELIVERY_PROCESSES.filter((p) =>
                  availableProcesses.includes(p)
                ).map((process) => (
                  <option key={process} value={process}>
                    {PROCESS_LABELS[process]}
                  </option>
                ))}
              </optgroup>
            </select>

            {availableProcesses.length === 0 && (
              <p className="text-sm text-red-600 mt-2">
                ⚠️ No more processes available. Order might be completed.
              </p>
            )}
          </div>

          {/* Selected Process Info */}
          {selectedProcess && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-3">
                🎯 Assignment Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-800">Process:</span>
                  <span className="font-semibold text-purple-900">
                    {PROCESS_LABELS[selectedProcess]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-800">Department:</span>
                  <span className="font-semibold text-purple-900">
                    {selectedDepartment}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-800">Phase:</span>
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
              Your Name (PPIC Staff) *
            </label>
            <input
              type="text"
              value={assignedBy}
              onChange={(e) => setAssignedBy(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your name"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Any special instructions or notes for this assignment..."
              disabled={isSubmitting}
            />
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Important:</strong> This assignment cannot be undone.
              Make sure you select the correct next process.
            </p>
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
