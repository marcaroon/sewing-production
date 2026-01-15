// components/ProcessStepCards.tsx - SIMPLIFIED FLOW VERSION
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  ProcessStep,
  RejectType,
  RejectCategory,
  RejectAction,
  ProductionPhase,
} from "@/lib/types-new";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Modal, ModalFooter } from "./ui/Modal";
import {
  PROCESS_LABELS,
  PHASE_LABELS,
  REJECT_TYPE_LABELS,
} from "@/lib/constants-new";
import { formatDateTime, formatNumber } from "@/lib/utils";
import {
  Package,
  CheckCircle2,
  XCircle,
  RotateCcw,
  PlayCircle,
  AlertCircle,
  User,
  Eye,
  Lock,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
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

  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<
    "receive" | "complete" | ""
  >("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [actionData, setActionData] = useState({
    performedBy: user?.name || "",
    quantity: processStep.quantityReceived,
    notes: "",
  });

  const [rejectData, setRejectData] = useState({
    rejectType: "material_defect" as RejectType,
    rejectCategory: "rework" as RejectCategory,
    quantity: 1,
    description: "",
    rootCause: "",
    action: "rework" as RejectAction,
    reportedBy: user?.name || "",
  });

  const isAdmin = user?.isAdmin || false;
  const isPPIC = user?.department === "PPIC";

  // ✅ FIX: Use checkPermission with processName argument
  const canExecute = user
    ? checkPermission("canTransitionProcess", processStep.processName)
    : false;

  const canReject = user
    ? checkPermission("canRecordReject", processStep.processName)
    : false;

  // Debug log
  useEffect(() => {
    if (user) {
      console.log("=== ProcessStepCard Debug ===");
      console.log("User Department:", user.department);
      console.log("Process Department:", processStep.department);
      console.log("Process Name:", processStep.processName);
      console.log("Can Execute:", canExecute);
      console.log("Can Reject:", canReject);
      console.log("Is Admin:", isAdmin);
      console.log("============================");
    }
  }, [user, canExecute, canReject]);

  // Determine what actions are available
  const canReceive = processStep.status === "pending" && canExecute;
  const canComplete = processStep.status === "in_progress" && canExecute;
  const isCompleted = processStep.status === "completed";

  const completionRate =
    processStep.quantityReceived > 0
      ? Math.round(
          (processStep.quantityCompleted / processStep.quantityReceived) * 100
        )
      : 0;

  const handleAction = async (action: "receive" | "complete") => {
    setCurrentAction(action);
    setActionData({
      performedBy: user?.name || "",
      quantity: processStep.quantityReceived,
      notes: "",
    });
    setIsActionModalOpen(true);
  };

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/process-steps/${processStep.id}/transition`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: currentAction,
            ...actionData,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setIsActionModalOpen(false);
        setCurrentAction("");
        onUpdate();
      } else {
        setError(result.error || "Failed to process action");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process action");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/process-steps/${processStep.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rejectData),
        }
      );

      const result = await response.json();

      if (result.success) {
        setIsRejectModalOpen(false);
        setRejectData({
          rejectType: "material_defect",
          rejectCategory: "rework",
          quantity: 1,
          description: "",
          rootCause: "",
          action: "rework",
          reportedBy: user?.name || "",
        });
        onUpdate();
      } else {
        setError(result.error || "Failed to record reject");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record reject");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          Loading user permissions...
        </CardContent>
      </Card>
    );
  }

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
                {isAdmin && (
                  <div
                    title="Admin Full Access"
                    className="flex items-center gap-1"
                  >
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-bold text-green-600">
                      ADMIN
                    </span>
                  </div>
                )}
                {!canExecute && !isAdmin && (
                  <Lock className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-sm font-semibold text-gray-700">
                  {processStep.department}
                </p>
                {user.department &&
                  user.department !== processStep.department && (
                    <Badge variant="default" size="sm">
                      You: {user.department}
                    </Badge>
                  )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="info" size="sm">
                {PHASE_LABELS[processStep.processPhase as ProductionPhase]}
              </Badge>
              <Badge
                variant={
                  processStep.status === "completed"
                    ? "success"
                    : processStep.status === "in_progress"
                    ? "warning"
                    : "default"
                }
              >
                {processStep.status === "completed"
                  ? "Completed"
                  : processStep.status === "in_progress"
                  ? "In Progress"
                  : "Waiting"}
              </Badge>
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
                <p className="text-xs font-semibold text-green-700">Selesai</p>
                <p className="text-lg font-bold text-green-900">
                  {formatNumber(processStep.quantityCompleted)}
                </p>
              </div>
            </div>
            {processStep.quantityRejected > 0 && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-xs font-semibold text-red-700">Rejected</p>
                  <p className="text-lg font-bold text-red-900">
                    {formatNumber(processStep.quantityRejected)}
                  </p>
                </div>
              </div>
            )}
            {processStep.quantityRework > 0 && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <RotateCcw className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-xs font-semibold text-yellow-700">
                    Rework
                  </p>
                  <p className="text-lg font-bold text-yellow-900">
                    {formatNumber(processStep.quantityRework)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {processStep.status === "in_progress" && (
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-2">
                <span>Progress</span>
                <span className="text-blue-600">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          )}

          {/* Timestamps */}
          {(processStep.addedToWaitingTime ||
            processStep.startedTime ||
            processStep.completedTime) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-xs">
              {processStep.addedToWaitingTime && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">
                    Added to Waiting:
                  </span>
                  <span className="font-bold text-gray-900">
                    {formatDateTime(processStep.addedToWaitingTime)}
                  </span>
                </div>
              )}
              {processStep.startedTime && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Started:</span>
                  <span className="font-bold text-gray-900">
                    {formatDateTime(processStep.startedTime)}
                  </span>
                </div>
              )}
              {processStep.completedTime && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">
                    Completed:
                  </span>
                  <span className="font-bold text-gray-900">
                    {formatDateTime(processStep.completedTime)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {canExecute && !isCompleted && (
            <div className="flex gap-2 pt-3 border-t-2 border-gray-200">
              {canReceive && (
                <Button
                  onClick={() => handleAction("receive")}
                  variant="primary"
                  size="md"
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  Terima dari Waiting List
                </Button>
              )}

              {canComplete && (
                <>
                  <Button
                    onClick={() => handleAction("complete")}
                    variant="success"
                    size="md"
                    className="flex-1"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Complete Process
                  </Button>
                  {canReject && (
                    <Button
                      onClick={() => setIsRejectModalOpen(true)}
                      variant="danger"
                      size="md"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Reject
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* View-Only Notice */}
          {!canExecute && !isCompleted && (
            <div className="mt-4 p-3 bg-gray-50 border-2 border-gray-300 rounded-lg">
              <div className="flex items-start gap-3 text-sm">
                {isAdmin ? (
                  <>
                    <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900 mb-1">
                        Admin View Mode
                      </p>
                      <p className="text-gray-600">
                        You have full access. Action buttons will appear based
                        on process status.
                      </p>
                    </div>
                  </>
                ) : isPPIC ? (
                  <>
                    <Eye className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900 mb-1">PPIC View</p>
                      <p className="text-gray-600">
                        PPIC can monitor but cannot execute processes directly.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900 mb-1">View Only</p>
                      <p className="text-gray-600">
                        This process is handled by{" "}
                        <span className="font-bold">
                          {processStep.department}
                        </span>
                        . Your department:{" "}
                        <span className="font-bold">{user.department}</span>.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Completed Badge */}
          {isCompleted && (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-bold text-green-900">Process Completed</p>
                  <p className="text-sm text-green-700 mt-1">
                    Completed at{" "}
                    {processStep.completedTime &&
                      formatDateTime(processStep.completedTime)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Modal */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => !isSubmitting && setIsActionModalOpen(false)}
        title={
          currentAction === "receive"
            ? "Terima dari Waiting List"
            : "Complete Process"
        }
        size="md"
      >
        <form onSubmit={handleSubmitAction}>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="font-bold text-blue-900 mb-2">
                {currentAction === "receive"
                  ? "Terima Order"
                  : "Menyelesaikan Proses"}
              </p>
              <p className="text-sm text-blue-800">
                Process:{" "}
                <span className="font-bold">
                  {PROCESS_LABELS[processStep.processName]}
                </span>
              </p>
              <p className="text-sm text-blue-800">
                Quantity:{" "}
                <span className="font-bold">
                  {formatNumber(processStep.quantityReceived)} pcs
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Performed By *
              </label>
              <input
                type="text"
                value={actionData.performedBy}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-gray-100 font-medium text-gray-900"
                disabled
              />
            </div>

            {currentAction === "complete" && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Quantity Completed
                </label>
                <input
                  type="number"
                  value={actionData.quantity}
                  onChange={(e) =>
                    setActionData({
                      ...actionData,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-900"
                  min="0"
                  max={processStep.quantityReceived}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={actionData.notes}
                onChange={(e) =>
                  setActionData({ ...actionData, notes: e.target.value })
                }
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-900"
                rows={3}
              />
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsActionModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant={currentAction === "receive" ? "primary" : "success"}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Processing..."
                : currentAction === "receive"
                ? "Terima"
                : "Complete"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Reject Modal - Keep as is */}
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
                className="w-full px-4 py-2.5 border rounded-lg"
                required
              >
                {Object.entries(REJECT_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Category *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="rework"
                    checked={rejectData.rejectCategory === "rework"}
                    onChange={(e) =>
                      setRejectData({ ...rejectData, rejectCategory: "rework" })
                    }
                  />
                  <span>Rework</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="reject"
                    checked={rejectData.rejectCategory === "reject"}
                    onChange={(e) =>
                      setRejectData({ ...rejectData, rejectCategory: "reject" })
                    }
                  />
                  <span>Reject</span>
                </label>
              </div>
            </div>

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
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2.5 border rounded-lg"
                min="1"
                required
              />
            </div>

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
