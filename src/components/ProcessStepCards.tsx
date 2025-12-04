// components/ProcessStepCard.tsx
"use client";

import React, { useState } from "react";
import { ProcessStep } from "@/lib/types-new";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Modal, ModalFooter } from "./ui/Modal";
import {
  PROCESS_LABELS,
  PROCESS_STATE_LABELS,
  PROCESS_STATE_COLORS,
  PHASE_LABELS,
  VALID_STATE_TRANSITIONS,
} from "@/lib/constants-new";
import { formatDateTime, formatNumber } from "@/lib/utils";
import apiClient from "@/lib/api-client";

interface ProcessStepCardProps {
  processStep: ProcessStep;
  onUpdate: () => void;
}

export const ProcessStepCard: React.FC<ProcessStepCardProps> = ({
  processStep,
  onUpdate,
}) => {
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Determine current state
  let currentState = "at_ppic";
  if (processStep.completedTime) {
    currentState = "completed";
  } else if (processStep.startedTime) {
    currentState = "in_progress";
  } else if (processStep.assignedTime) {
    currentState = "assigned";
  } else if (processStep.addedToWaitingTime) {
    currentState = "waiting";
  }

  const validNextStates = VALID_STATE_TRANSITIONS[currentState as any] || [];

  const [transitionData, setTransitionData] = useState({
    newState: validNextStates[0] || "",
    performedBy: "",
    assignedTo: "",
    assignedLine: "",
    quantity: processStep.quantityReceived,
    notes: "",
  });

  const [rejectData, setRejectData] = useState({
    rejectType: "material_defect",
    rejectCategory: "rework",
    quantity: 1,
    size: "",
    bundleNumber: "",
    description: "",
    rootCause: "",
    action: "rework",
    reportedBy: "",
  });

  const handleTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await apiClient.transitionProcessStep(processStep.id, {
        newState: transitionData.newState as any,
        performedBy: transitionData.performedBy,
        assignedTo: transitionData.assignedTo || undefined,
        assignedLine: transitionData.assignedLine || undefined,
        quantity: transitionData.quantity || undefined,
        notes: transitionData.notes || undefined,
      });

      setIsTransitionModalOpen(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to transition");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await apiClient.recordReject(processStep.id, rejectData);

      setIsRejectModalOpen(false);
      setRejectData({
        rejectType: "material_defect",
        rejectCategory: "rework",
        quantity: 1,
        size: "",
        bundleNumber: "",
        description: "",
        rootCause: "",
        action: "rework",
        reportedBy: "",
      });
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record reject");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">
                {PROCESS_LABELS[processStep.processName as any]}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {processStep.department}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="info">
                {PHASE_LABELS[processStep.processPhase as any]}
              </Badge>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  PROCESS_STATE_COLORS[currentState as any]
                }`}
              >
                {PROCESS_STATE_LABELS[currentState as any]}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quantities */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600">Received</p>
              <p className="text-lg font-bold text-gray-900">
                {formatNumber(processStep.quantityReceived)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Completed</p>
              <p className="text-lg font-bold text-green-600">
                {formatNumber(processStep.quantityCompleted)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Rejected</p>
              <p className="text-lg font-bold text-red-600">
                {formatNumber(processStep.quantityRejected)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Rework</p>
              <p className="text-lg font-bold text-yellow-600">
                {formatNumber(processStep.quantityRework)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>
                {processStep.quantityReceived > 0
                  ? Math.round(
                      (processStep.quantityCompleted /
                        processStep.quantityReceived) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${
                    processStep.quantityReceived > 0
                      ? (processStep.quantityCompleted /
                          processStep.quantityReceived) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Timestamps */}
          {(processStep.arrivedAtPpicTime ||
            processStep.addedToWaitingTime ||
            processStep.assignedTime ||
            processStep.startedTime ||
            processStep.completedTime) && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs">
              {processStep.arrivedAtPpicTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">At PPIC:</span>
                  <span className="font-medium">
                    {formatDateTime(processStep.arrivedAtPpicTime)}
                  </span>
                </div>
              )}
              {processStep.addedToWaitingTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Waiting:</span>
                  <span className="font-medium">
                    {formatDateTime(processStep.addedToWaitingTime)}
                  </span>
                </div>
              )}
              {processStep.assignedTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Assigned:</span>
                  <span className="font-medium">
                    {formatDateTime(processStep.assignedTime)}
                  </span>
                </div>
              )}
              {processStep.startedTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Started:</span>
                  <span className="font-medium">
                    {formatDateTime(processStep.startedTime)}
                  </span>
                </div>
              )}
              {processStep.completedTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium">
                    {formatDateTime(processStep.completedTime)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Durations */}
          {(processStep.waitingDuration ||
            processStep.processingDuration ||
            processStep.totalDuration) && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              {processStep.waitingDuration && (
                <div className="text-center">
                  <p className="text-gray-600">Wait</p>
                  <p className="font-bold text-yellow-600">
                    {processStep.waitingDuration}m
                  </p>
                </div>
              )}
              {processStep.processingDuration && (
                <div className="text-center">
                  <p className="text-gray-600">Process</p>
                  <p className="font-bold text-blue-600">
                    {processStep.processingDuration}m
                  </p>
                </div>
              )}
              {processStep.totalDuration && (
                <div className="text-center">
                  <p className="text-gray-600">Total</p>
                  <p className="font-bold text-gray-900">
                    {processStep.totalDuration}m
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Assignment Info */}
          {(processStep.assignedTo || processStep.assignedLine) && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm">
              {processStep.assignedTo && (
                <p>
                  <span className="text-gray-600">Assigned to:</span>{" "}
                  <span className="font-medium">{processStep.assignedTo}</span>
                </p>
              )}
              {processStep.assignedLine && (
                <p>
                  <span className="text-gray-600">Line:</span>{" "}
                  <span className="font-medium">
                    {processStep.assignedLine}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          {currentState !== "completed" && validNextStates.length > 0 && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => setIsTransitionModalOpen(true)}
                variant="primary"
                size="sm"
                className="flex-1"
              >
                Next: {PROCESS_STATE_LABELS[validNextStates[0] as any]}
              </Button>
              {currentState === "in_progress" && (
                <Button
                  onClick={() => setIsRejectModalOpen(true)}
                  variant="danger"
                  size="sm"
                >
                  Record Reject
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transition Modal */}
      <Modal
        isOpen={isTransitionModalOpen}
        onClose={() => !isSubmitting && setIsTransitionModalOpen(false)}
        title="Transition Process State"
        size="lg"
      >
        <form onSubmit={handleTransition}>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                New State *
              </label>
              <select
                value={transitionData.newState}
                onChange={(e) =>
                  setTransitionData({
                    ...transitionData,
                    newState: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                {validNextStates.map((state) => (
                  <option key={state} value={state}>
                    {PROCESS_STATE_LABELS[state as any]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Performed By *
              </label>
              <input
                type="text"
                value={transitionData.performedBy}
                onChange={(e) =>
                  setTransitionData({
                    ...transitionData,
                    performedBy: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            {transitionData.newState === "assigned" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Assign To
                  </label>
                  <input
                    type="text"
                    value={transitionData.assignedTo}
                    onChange={(e) =>
                      setTransitionData({
                        ...transitionData,
                        assignedTo: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Sewing Line (if applicable)
                  </label>
                  <input
                    type="text"
                    value={transitionData.assignedLine}
                    onChange={(e) =>
                      setTransitionData({
                        ...transitionData,
                        assignedLine: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </>
            )}

            {transitionData.newState === "completed" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Quantity Completed *
                </label>
                <input
                  type="number"
                  value={transitionData.quantity}
                  onChange={(e) =>
                    setTransitionData({
                      ...transitionData,
                      quantity: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={transitionData.notes}
                onChange={(e) =>
                  setTransitionData({
                    ...transitionData,
                    notes: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
              />
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTransitionModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Confirm Transition"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Reject Modal - similar structure */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => !isSubmitting && setIsRejectModalOpen(false)}
        title="Record Reject/Rework"
        size="lg"
      >
        <form onSubmit={handleReject}>
          <div className="space-y-4">
            {/* Reject form fields - implement similar to transition */}
            <p className="text-sm text-gray-600">
              Reject form implementation here...
            </p>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRejectModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Record Reject"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
};
