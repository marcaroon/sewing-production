// components/ProcessStepCards.tsx - FIXED RBAC VERSION
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
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
import {
  Package,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  PlayCircle,
  AlertCircle,
  ArrowRight,
  User,
  Eye,
  Lock,
} from "lucide-react";

interface ProcessStepCardProps {
  processStep: ProcessStep;
  onUpdate: () => void;
}

export const ProcessStepCard: React.FC<ProcessStepCardProps> = ({
  processStep,
  onUpdate,
}) => {
  const { user, checkPermission } = useAuth();

  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
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

  const nextProcess = getNextProcess(
    processStep.processName as any,
    processStep.processPhase as any
  );
  const nextDepartment = nextProcess
    ? PROCESS_DEPARTMENT_MAP[nextProcess]
    : null;

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

  const isAdmin = user?.isAdmin || false;
  const isPPIC = user?.role === "ppic";
  
  /**
   * CRITICAL: Cek permission dengan benar
   * - Admin: Bisa semua
   * - PPIC: View only (tidak bisa eksekusi)
   * - Role lain: Bisa eksekusi hanya process mereka
   */
  const canExecute = user
    ? checkPermission("canTransitionProcess", processStep.processName)
    : false;

  const canReject = user
    ? checkPermission("canRecordReject", processStep.processName)
    : false;

  const canView = true; // Semua bisa view

  // Load users saat assign
  useEffect(() => {
    if (transitionData.newState === "assigned") {
      loadAvailableUsers();
    }
  }, [transitionData.newState, processStep.processName]);

  const loadAvailableUsers = async () => {
    try {
      const response = await fetch(
        `/api/users/by-role?processName=${processStep.processName}`
      );
      const result = await response.json();

      if (result.success) {
        setAvailableUsers(result.data);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  // Auto-fill performedBy dengan current user
  useEffect(() => {
    if (user && !transitionData.performedBy) {
      setTransitionData((prev) => ({
        ...prev,
        performedBy: user.name,
      }));
    }
    if (user && !rejectData.reportedBy) {
      setRejectData((prev) => ({
        ...prev,
        reportedBy: user.name,
      }));
    }
  }, [user]);

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
        reportedBy: user?.name || "",
      });
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record reject");
    } finally {
      setIsSubmitting(false);
    }
  };

  const completionRate =
    processStep.quantityReceived > 0
      ? Math.round(
          (processStep.quantityCompleted / processStep.quantityReceived) * 100
        )
      : 0;

  return (
    <>
      <Card className="border-l-4 border-l-blue-600">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg">
                  {PROCESS_LABELS[processStep.processName]}
                </CardTitle>
                {/* Show lock icon if user can't execute */}
                {!canExecute && !isAdmin && (
                  <div title="View Only">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-sm font-semibold text-gray-700">
                  {processStep.department}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="info" size="sm">
                {PHASE_LABELS[processStep.processPhase as ProductionPhase]}
              </Badge>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  PROCESS_STATE_COLORS[currentState as ProcessState]
                }`}
              >
                {PROCESS_STATE_LABELS[currentState as ProcessState]}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Quantities */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs font-semibold text-blue-700">Diterima</p>
                <p className="text-lg font-bold text-blue-900">
                  {formatNumber(processStep.quantityReceived)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs font-semibold text-green-700">
                  Completed
                </p>
                <p className="text-lg font-bold text-green-900">
                  {formatNumber(processStep.quantityCompleted)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-xs font-semibold text-red-700">Rejected</p>
                <p className="text-lg font-bold text-red-900">
                  {formatNumber(processStep.quantityRejected)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <RotateCcw className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-xs font-semibold text-yellow-700">Rework</p>
                <p className="text-lg font-bold text-yellow-900">
                  {formatNumber(processStep.quantityRework)}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-2">
              <span>Progres</span>
              <span className="text-blue-600">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-linear-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Timestamps */}
          {(processStep.arrivedAtPpicTime ||
            processStep.addedToWaitingTime ||
            processStep.assignedTime ||
            processStep.startedTime ||
            processStep.completedTime) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2.5 text-xs">
              {processStep.arrivedAtPpicTime && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Di PPIC:</span>
                  <span className="font-bold text-gray-900">
                    {formatDateTime(processStep.arrivedAtPpicTime)}
                  </span>
                </div>
              )}
              {processStep.addedToWaitingTime && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Menunggu:</span>
                  <span className="font-bold text-gray-900">
                    {formatDateTime(processStep.addedToWaitingTime)}
                  </span>
                </div>
              )}
              {processStep.assignedTime && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Assigned:</span>
                  <span className="font-bold text-gray-900">
                    {formatDateTime(processStep.assignedTime)}
                  </span>
                </div>
              )}
              {processStep.startedTime && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Dimulai:</span>
                  <span className="font-bold text-gray-900">
                    {formatDateTime(processStep.startedTime)}
                  </span>
                </div>
              )}
              {processStep.completedTime && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Selesai:</span>
                  <span className="font-bold text-gray-900">
                    {formatDateTime(processStep.completedTime)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Assignment Info */}
          {(processStep.assignedTo || processStep.assignedLine) && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm">
              {processStep.assignedTo && (
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-purple-700">
                    Assigned to:
                  </span>
                  <span className="font-bold text-purple-900">
                    {processStep.assignedTo}
                  </span>
                </div>
              )}
              {processStep.assignedLine && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-purple-700">Line:</span>
                  <span className="font-bold text-purple-900">
                    {processStep.assignedLine}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ACTION BUTTONS - CRITICAL RBAC */}
          {canExecute &&
            currentState !== "completed" &&
            validNextStates.length > 0 && (
              <div className="flex gap-2 pt-3">
                <Button
                  onClick={() => setIsTransitionModalOpen(true)}
                  variant="primary"
                  size="md"
                  className="flex-1"
                >
                  <ArrowRight className="w-4 h-4" />
                  Next: {PROCESS_STATE_LABELS[validNextStates[0]]}
                </Button>
                {canReject && currentState === "in_progress" && (
                  <Button
                    onClick={() => setIsRejectModalOpen(true)}
                    variant="danger"
                    size="md"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Reject
                  </Button>
                )}
              </div>
            )}

          {/* VIEW ONLY MESSAGE */}
          {!canExecute && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Eye className="w-4 h-4" />
                <span>
                  {isPPIC
                    ? "View Only - PPIC tidak bisa eksekusi process, hanya assign"
                    : isAdmin
                    ? "Admin View Mode"
                    : `View Only - Process ini dihandle oleh ${processStep.department}`}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transition Modal - sama seperti sebelumnya */}
      <Modal
        isOpen={isTransitionModalOpen}
        onClose={() => !isSubmitting && setIsTransitionModalOpen(false)}
        title="Process Transition"
        size="lg"
      >
        <form onSubmit={handleTransition}>
          {/* ... Form content sama seperti sebelumnya ... */}
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* Minimal content untuk testing */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                New State *
              </label>
              <select
                value={transitionData.newState}
                onChange={(e) =>
                  setTransitionData({
                    ...transitionData,
                    newState: e.target.value as ProcessState,
                  })
                }
                className="w-full px-4 py-2.5 border rounded-lg"
                required
              >
                {validNextStates.map((state: ProcessState) => (
                  <option key={state} value={state}>
                    {PROCESS_STATE_LABELS[state]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTransitionModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Confirm Transition"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Reject Modal - sama seperti sebelumnya */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => !isSubmitting && setIsRejectModalOpen(false)}
        title="Record Reject/Rework"
        size="lg"
      >
        <form onSubmit={handleReject}>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* Minimal content */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Description *
              </label>
              <textarea
                value={rejectData.description}
                onChange={(e) =>
                  setRejectData({ ...rejectData, description: e.target.value })
                }
                className="w-full px-4 py-2.5 border rounded-lg"
                rows={3}
                required
              />
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRejectModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
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