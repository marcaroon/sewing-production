// components/ProcessStepCard.tsx - IMPROVED VERSION
"use client";

import React, { useState } from "react";
import {
  ProcessState,
  ProcessStep,
  ProductionPhase,
  isProcessState,
  RejectType,
  RejectCategory,
  RejectAction,
} from "@/lib/types-new";
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
  REJECT_TYPE_LABELS,
  REJECT_CATEGORY_LABELS,
  REJECT_ACTION_LABELS,
  getNextProcess,
  PROCESS_DEPARTMENT_MAP,
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

  const currentStateTyped: ProcessState = isProcessState(currentState)
    ? currentState
    : "at_ppic";

  const validNextStates = VALID_STATE_TRANSITIONS[currentStateTyped] || [];

  // Get next process info for better context
  const nextProcess = getNextProcess(
    processStep.processName as any,
    processStep.processPhase as any
  );
  const nextDepartment = nextProcess ? PROCESS_DEPARTMENT_MAP[nextProcess] : null;

  const [transitionData, setTransitionData] = useState<{
    newState: ProcessState | "";
    performedBy: string;
    assignedTo: string;
    assignedLine: string;
    quantity: number;
    notes: string;
  }>({
    newState: (validNextStates[0] as ProcessState) || "",
    performedBy: "",
    assignedTo: "",
    assignedLine: "",
    quantity: processStep.quantityReceived,
    notes: "",
  });

  const [rejectData, setRejectData] = useState({
    rejectType: "material_defect" as RejectType,
    rejectCategory: "rework" as RejectCategory,
    quantity: 1,
    size: "",
    bundleNumber: "",
    description: "",
    rootCause: "",
    action: "rework" as RejectAction,
    reportedBy: "",
  });

  const handleTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await apiClient.transitionProcessStep(processStep.id, {
        newState: transitionData.newState as ProcessState,
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

  // Get state label helper
  const getStateLabel = (state: string): string => {
    return PROCESS_STATE_LABELS[state as ProcessState] || state;
  };

  return (
    <>
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">
                {PROCESS_LABELS[processStep.processName]}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {processStep.department}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="info">
                {PHASE_LABELS[processStep.processPhase as ProductionPhase]}
              </Badge>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  PROCESS_STATE_COLORS[currentState as ProcessState]
                }`}
              >
                {PROCESS_STATE_LABELS[currentState as ProcessState]}
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
                Next: {PROCESS_STATE_LABELS[validNextStates[0]]}
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

      {/* ========== IMPROVED TRANSITION MODAL ========== */}
      <Modal
        isOpen={isTransitionModalOpen}
        onClose={() => !isSubmitting && setIsTransitionModalOpen(false)}
        title="Process Transition"
        size="lg"
      >
        <form onSubmit={handleTransition}>
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* CONTEXT INFO - Show DETAILED transition path */}
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-5">
              <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Transition Details
              </h4>
              
              <div className="space-y-4">
                {/* FROM (Current State) */}
                <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                  <p className="text-xs font-semibold text-blue-600 uppercase mb-2">📍 FROM (Current)</p>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-gray-900">
                      {PROCESS_LABELS[processStep.processName]}
                    </p>
                    <p className="text-sm text-gray-700">
                      📂 Department: <span className="font-semibold">{processStep.department}</span>
                    </p>
                    <p className="text-sm text-gray-700">
                      🔄 Status: <span className="font-semibold">{getStateLabel(currentState)}</span>
                    </p>
                    {processStep.assignedTo && (
                      <p className="text-sm text-gray-700">
                        👤 Current PIC: <span className="font-semibold">{processStep.assignedTo}</span>
                        {processStep.assignedLine && <span className="text-gray-600"> (Line: {processStep.assignedLine})</span>}
                      </p>
                    )}
                  </div>
                </div>

                {/* ARROW */}
                <div className="flex justify-center">
                  <svg className="w-8 h-8 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>

                {/* TO (Next State) */}
                <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                  <p className="text-xs font-semibold text-green-600 uppercase mb-2">🎯 TO (Next)</p>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-gray-900">
                      {getStateLabel(transitionData.newState)}
                    </p>
                    
                    {/* Show specific location based on state */}
                    {transitionData.newState === "at_ppic" && (
                      <div className="mt-2 bg-blue-50 rounded p-2">
                        <p className="text-sm text-blue-900">
                          📋 Will arrive at: <span className="font-bold">PPIC Department</span>
                        </p>
                        <p className="text-xs text-blue-700">For review and next process planning</p>
                      </div>
                    )}
                    
                    {transitionData.newState === "waiting" && (
                      <div className="mt-2 bg-yellow-50 rounded p-2">
                        <p className="text-sm text-yellow-900">
                          ⏳ Will be added to: <span className="font-bold">{processStep.department} Waiting List</span>
                        </p>
                        <p className="text-xs text-yellow-700">Waiting to be assigned to operator</p>
                      </div>
                    )}
                    
                    {transitionData.newState === "assigned" && (
                      <div className="mt-2 bg-purple-50 rounded p-2">
                        <p className="text-sm text-purple-900">
                          👤 Will be assigned at: <span className="font-bold">{processStep.department}</span>
                        </p>
                        <p className="text-xs text-purple-700">Specify operator/PIC below</p>
                      </div>
                    )}
                    
                    {transitionData.newState === "in_progress" && (
                      <div className="mt-2 bg-orange-50 rounded p-2">
                        <p className="text-sm text-orange-900">
                          ⚙️ Work will start at: <span className="font-bold">{processStep.department}</span>
                        </p>
                        <p className="text-xs text-orange-700">
                          By: {processStep.assignedTo || "Assigned operator"}
                          {processStep.assignedLine && ` (${processStep.assignedLine})`}
                        </p>
                      </div>
                    )}
                    
                    {transitionData.newState === "completed" && (
                      <div className="mt-2 bg-green-50 rounded p-2">
                        <p className="text-sm text-green-900">
                          ✅ Will complete at: <span className="font-bold">{processStep.department}</span>
                        </p>
                        {nextProcess && nextDepartment ? (
                          <div className="mt-2 pt-2 border-t border-green-200">
                            <p className="text-xs text-green-800 font-semibold">📦 Then transfer to:</p>
                            <p className="text-sm text-green-900">
                              → <span className="font-bold">{PROCESS_LABELS[nextProcess]}</span> ({nextDepartment})
                            </p>
                            <p className="text-xs text-green-700 mt-1">
                              ℹ️ Surat Jalan will be auto-generated
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-green-700 mt-1">
                            🎉 This is the final process - Order will be marked as delivered
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* New State Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Select Next State *
              </label>
              <select
                value={transitionData.newState}
                onChange={(e) =>
                  setTransitionData({
                    ...transitionData,
                    newState: e.target.value as ProcessState,
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              >
                {validNextStates.map((state: ProcessState) => (
                  <option key={state} value={state}>
                    {PROCESS_STATE_LABELS[state]}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1">
                Current: {getStateLabel(currentState)} → Next: {getStateLabel(transitionData.newState)}
              </p>
            </div>

            {/* Performed By */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Your Name (Performed By) *
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your name"
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                Person responsible for this transition
              </p>
            </div>

            {/* ASSIGN TO - Only show for "assigned" state */}
            {transitionData.newState === "assigned" && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-purple-900">Assignment Details</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Assign To (Operator/PIC) *
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Operator or PIC name"
                    required
                  />
                </div>

                {/* SEWING LINE - Only show for "sewing" process */}
                {processStep.processName === "sewing" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Sewing Line *
                    </label>
                    <select
                      value={transitionData.assignedLine}
                      onChange={(e) =>
                        setTransitionData({
                          ...transitionData,
                          assignedLine: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">-- Select Sewing Line --</option>
                      <option value="SL-01">Sewing Line 1 (SL-01)</option>
                      <option value="SL-02">Sewing Line 2 (SL-02)</option>
                      <option value="SL-03">Sewing Line 3 (SL-03)</option>
                      <option value="SL-04">Sewing Line 4 (SL-04)</option>
                    </select>
                    <p className="text-xs text-purple-700 mt-1">
                      ⚠️ Sewing line selection is required for sewing process
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* COMPLETED - Show quantity input */}
            {transitionData.newState === "completed" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-3">Completion Details</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Quantity Completed *
                  </label>
                  <input
                    type="number"
                    value={transitionData.quantity}
                    onChange={(e) =>
                      setTransitionData({
                        ...transitionData,
                        quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                    max={processStep.quantityReceived}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-green-700 mt-1">
                    Max: {formatNumber(processStep.quantityReceived)} pcs (received quantity)
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={transitionData.notes}
                onChange={(e) =>
                  setTransitionData({
                    ...transitionData,
                    notes: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Add any additional notes about this transition..."
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
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                `Confirm Transition`
              )}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* ========== IMPROVED REJECT MODAL ========== */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => !isSubmitting && setIsRejectModalOpen(false)}
        title="Record Reject/Rework"
        size="lg"
      >
        <form onSubmit={handleReject}>
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* CONTEXT */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">Process Information</h4>
              <div className="text-sm space-y-1">
                <p className="text-red-800">
                  <span className="font-medium">Process:</span> {PROCESS_LABELS[processStep.processName]}
                </p>
                <p className="text-red-800">
                  <span className="font-medium">Department:</span> {processStep.department}
                </p>
                <p className="text-red-700 text-xs mt-2">
                  Recording reject/rework will deduct from completed quantity
                </p>
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Category *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRejectData({ ...rejectData, rejectCategory: "reject", action: "scrap" })}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    rejectData.rejectCategory === "reject"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <p className="font-semibold text-gray-900">Reject</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Permanent defect, will be scrapped
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setRejectData({ ...rejectData, rejectCategory: "rework", action: "rework" })}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    rejectData.rejectCategory === "rework"
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <p className="font-semibold text-gray-900">Rework</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Can be fixed and reworked
                  </p>
                </button>
              </div>
            </div>

            {/* Reject Type */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Reject Type *
              </label>
              <select
                value={rejectData.rejectType}
                onChange={(e) =>
                  setRejectData({
                    ...rejectData,
                    rejectType: e.target.value as RejectType,
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              >
                {Object.entries(REJECT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity and Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={rejectData.quantity}
                  onChange={(e) =>
                    setRejectData({
                      ...rejectData,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                  min="1"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Size (Optional)
                </label>
                <select
                  value={rejectData.size}
                  onChange={(e) =>
                    setRejectData({ ...rejectData, size: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">-- Select Size --</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>
            </div>

            {/* Bundle Number */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Bundle Number (Optional)
              </label>
              <input
                type="text"
                value={rejectData.bundleNumber}
                onChange={(e) =>
                  setRejectData({ ...rejectData, bundleNumber: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., BDL-001"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Description *
              </label>
              <textarea
                value={rejectData.description}
                onChange={(e) =>
                  setRejectData({ ...rejectData, description: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
                placeholder="Describe the defect in detail..."
                required
              />
            </div>

            {/* Root Cause */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Root Cause (Optional)
              </label>
              <textarea
                value={rejectData.rootCause}
                onChange={(e) =>
                  setRejectData({ ...rejectData, rootCause: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={2}
                placeholder="What caused this defect?"
              />
            </div>

            {/* Reported By */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Reported By *
              </label>
              <input
                type="text"
                value={rejectData.reportedBy}
                onChange={(e) =>
                  setRejectData({ ...rejectData, reportedBy: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Your name"
                required
              />
            </div>

            {/* Summary */}
            <div className={`border-2 rounded-lg p-4 ${
              rejectData.rejectCategory === "reject" 
                ? "border-red-300 bg-red-50" 
                : "border-yellow-300 bg-yellow-50"
            }`}>
              <h4 className={`font-semibold mb-2 ${
                rejectData.rejectCategory === "reject" ? "text-red-900" : "text-yellow-900"
              }`}>
                Summary
              </h4>
              <div className="text-sm space-y-1">
                <p className={rejectData.rejectCategory === "reject" ? "text-red-800" : "text-yellow-800"}>
                  <span className="font-medium">Category:</span> {REJECT_CATEGORY_LABELS[rejectData.rejectCategory]}
                </p>
                <p className={rejectData.rejectCategory === "reject" ? "text-red-800" : "text-yellow-800"}>
                  <span className="font-medium">Type:</span> {REJECT_TYPE_LABELS[rejectData.rejectType]}
                </p>
                <p className={rejectData.rejectCategory === "reject" ? "text-red-800" : "text-yellow-800"}>
                  <span className="font-medium">Quantity:</span> {rejectData.quantity} pcs
                  {rejectData.size && ` (Size: ${rejectData.size})`}
                </p>
                <p className={rejectData.rejectCategory === "reject" ? "text-red-800" : "text-yellow-800"}>
                  <span className="font-medium">Action:</span> {REJECT_ACTION_LABELS[rejectData.action]}
                </p>
              </div>
            </div>
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
            <Button 
              type="submit" 
              variant="danger" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Recording...
                </>
              ) : (
                `Record ${rejectData.rejectCategory === "reject" ? "Reject" : "Rework"}`
              )}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
};