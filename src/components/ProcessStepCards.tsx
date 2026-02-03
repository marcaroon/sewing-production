// src/components/ProcessStepCards.tsx

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
  FileText,
  Layers,
  Calendar,
  History,
} from "lucide-react";
import { RejectReworkDetailModal } from "./RejectReworkDetailModal";
import { TransitionHistoryModal } from "./TransitionHistoryModal";

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
  const [isRejectDetailModalOpen, setIsRejectDetailModalOpen] = useState(false);
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

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const isAdmin = user?.isAdmin || false;
  const isPPIC = user?.department === "PPIC";

  const canExecute = user
    ? checkPermission("canTransitionProcess", processStep.processName)
    : false;

  const canReject = user
    ? checkPermission("canRecordReject", processStep.processName)
    : false;

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

  // --- AMBIL INFO ORDER ---
  // Kita menggunakan casting (as any) untuk mengakses properti 'order'
  // karena mungkin type ProcessStep belum diupdate di types-new.ts
  const orderInfo = (processStep as any).order;

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
      <Card>
        <CardHeader>
          {orderInfo && (
            <div className="mb-4 pb-3 border-b border-gray-100 bg-gray-50 -mx-6 -mt-6 px-6 pt-4 rounded-t-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {/* <FileText className="w-5 h-5 text-blue-700" /> */}
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                    {orderInfo.orderNumber}
                  </h3>
                </div>
                {orderInfo.productionDeadline && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                    <Calendar className="w-3 h-3" />
                    Due:{" "}
                    {new Date(orderInfo.productionDeadline).toLocaleDateString(
                      "id-ID",
                      { day: "numeric", month: "short" }
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div
                  className="flex items-center gap-2 text-gray-700"
                  title="Buyer"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium truncate">
                    {orderInfo.buyer?.name || "Unknown Buyer"}
                  </span>
                </div>
                <div
                  className="flex items-center gap-2 text-gray-700"
                  title="Style"
                >
                  <Layers className="w-4 h-4 text-gray-400" />
                  <span className="font-medium truncate">
                    {orderInfo.style?.styleCode} - {orderInfo.style?.name}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-xl font-semibold text-blue-800">
                  {PROCESS_LABELS[processStep.processName] ||
                    processStep.processName}
                </CardTitle>
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip-trigger"
                  title="Lihat Riwayat & Catatan"
                >
                  <History className="w-5 h-5" />
                </button>
                {isAdmin && (
                  <div
                    title="Admin Full Access"
                    className="flex items-center gap-1"
                  >
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                  </div>
                )}
                {!canExecute && !isAdmin && (
                  <Lock className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {/* <p className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {processStep.department}
                </p> */}
                <Badge variant="purple" size="sm" className="text-[10px]">
                  {processStep.department}
                </Badge>
                {user.department &&
                  user.department !== processStep.department && (
                    <Badge variant="default" size="sm" className="text-[10px]">
                      Your Dept: {user.department}
                    </Badge>
                  )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="info" size="sm">
                {PHASE_LABELS[processStep.processPhase as ProductionPhase]}
              </Badge>
              <Badge
                size="sm"
                variant={
                  processStep.status === "completed"
                    ? "success"
                    : processStep.status === "in_progress"
                    ? "info"
                    : "warning"
                }
              >
                {processStep.status === "completed"
                  ? "Completed"
                  : processStep.status === "in_progress"
                  ? "In Progress"
                  : "Waiting List"}
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

            {/* REJECT BOX - Clickable */}
            {processStep.quantityRejected > 0 && (
              <div
                className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                onClick={() => setIsRejectDetailModalOpen(true)}
                title="Klik untuk melihat detail Reject"
              >
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-xs font-semibold text-red-700">Rejected</p>
                  <p className="text-lg font-bold text-red-900">
                    {formatNumber(processStep.quantityRejected)}
                  </p>
                </div>
              </div>
            )}

            {/* REWORK BOX - Clickable */}
            {processStep.quantityRework > 0 && (
              <div
                className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
                onClick={() => setIsRejectDetailModalOpen(true)}
                title="Klik untuk melihat detail Rework"
              >
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
                    Masuk Waiting List:
                  </span>
                  <span className="font-bold text-gray-900">
                    {formatDateTime(processStep.addedToWaitingTime)}
                  </span>
                </div>
              )}
              {processStep.startedTime && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">
                    Mulai Dikerjakan:
                  </span>
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

          {/* Action Buttons */}
          {canExecute && !isCompleted && (
            <div className="flex gap-2 pt-3 border-t-2 border-gray-200 mt-2">
              {canReceive && (
                <Button
                  onClick={() => handleAction("receive")}
                  variant="primary"
                  size="md"
                  className="flex-1 w-full justify-center py-3 text-base"
                >
                  Terima Proses
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
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Selesai
                  </Button>
                  {canReject && (
                    <Button
                      onClick={() => setIsRejectModalOpen(true)}
                      variant="danger"
                      size="md"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Reject/Rework
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* View-Only Notice */}
          {!canExecute && !isCompleted && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Lock className="w-4 h-4" />
                <div>
                  <span className="font-bold">View Only</span>
                  {/* <p className="text-xs">
                    Proses ini ditangani oleh dept:{" "}
                    <span className="font-bold text-gray-700">
                      {processStep.department}
                    </span>
                  </p> */}
                </div>
              </div>
            </div>
          )}

          {/* Completed Badge */}
          {isCompleted && (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-bold text-green-900">Proses Selesai</p>
                  <p className="text-sm text-green-700 mt-1">
                    Pada{" "}
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
            ? "Terima Job dari Waiting List"
            : "Selesaikan Proses"
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

            {/* Konfirmasi Order di Modal */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-sm mb-4">
              <p className="font-bold text-blue-900">
                {orderInfo?.orderNumber}
              </p>
              <p className="text-blue-800">
                {PROCESS_LABELS[processStep.processName]}
              </p>
              <p className="mt-1 text-blue-700">
                Quantity:{" "}
                <span className="font-bold">
                  {formatNumber(processStep.quantityReceived)} pcs
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Dikerjakan Oleh *
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
                  Jumlah Selesai (Quantity Completed)
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
                Catatan (Opsional)
              </label>
              <textarea
                value={actionData.notes}
                onChange={(e) =>
                  setActionData({ ...actionData, notes: e.target.value })
                }
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-900"
                rows={3}
                placeholder="Contoh: Mesin no 3, lembur 1 jam..."
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
                ? "Terima & Mulai"
                : "Simpan Selesai"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Reject Input Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => !isSubmitting && setIsRejectModalOpen(false)}
        title="Laporkan Reject/Rework"
        size="lg"
      >
        <form onSubmit={handleReject}>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* Konfirmasi Order di Modal Reject */}
            <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-sm mb-4">
              <p className="font-bold text-red-900">
                Melaporkan Masalah untuk: {orderInfo?.orderNumber}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Jenis Masalah (Type) *
              </label>
              <select
                value={rejectData.rejectType}
                onChange={(e) =>
                  setRejectData({
                    ...rejectData,
                    rejectType: e.target.value as RejectType,
                  })
                }
                className="w-full px-4 py-2.5 text-gray-800 border rounded-lg"
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
                Kategori Tindakan *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center text-gray-800 gap-2 cursor-pointer border p-3 rounded hover:bg-gray-50 flex-1 transition-colors">
                  <input
                    type="radio"
                    value="rework"
                    checked={rejectData.rejectCategory === "rework"}
                    onChange={() =>
                      setRejectData({
                        ...rejectData,
                        rejectCategory: "rework",
                        action: "rework",
                      })
                    }
                  />
                  <div>
                    <span className="font-bold block text-yellow-700">
                      Rework
                    </span>
                    <span className="text-xs text-gray-500">
                      Bisa diperbaiki (Masuk keranjang rework)
                    </span>
                  </div>
                </label>
                <label className="flex items-center text-gray-800 gap-2 cursor-pointer border p-3 rounded hover:bg-gray-50 flex-1 transition-colors">
                  <input
                    type="radio"
                    value="reject"
                    checked={rejectData.rejectCategory === "reject"}
                    onChange={() =>
                      setRejectData({
                        ...rejectData,
                        rejectCategory: "reject",
                        action: "scrap",
                      })
                    }
                  />
                  <div>
                    <span className="font-bold block text-red-700">Reject</span>
                    <span className="text-xs text-gray-500">Scrap/Buang</span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Jumlah (Quantity) *
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
                className="w-full px-4 py-2.5 text-gray-800 border rounded-lg"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Keterangan Masalah *
              </label>
              <textarea
                value={rejectData.description}
                onChange={(e) =>
                  setRejectData({ ...rejectData, description: e.target.value })
                }
                className="w-full px-4 py-2.5 text-gray-800 border rounded-lg"
                rows={3}
                required
                placeholder="Jelaskan detail kerusakan agar mudah diperbaiki/dianalisa..."
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
              {isSubmitting ? "Menyimpan..." : "Simpan Laporan"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <RejectReworkDetailModal
        isOpen={isRejectDetailModalOpen}
        onClose={() => setIsRejectDetailModalOpen(false)}
        processStepId={processStep.id}
        processName={
          PROCESS_LABELS[processStep.processName] || processStep.processName
        }
      />

      <TransitionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        processStepId={processStep.id}
        processName={
          PROCESS_LABELS[processStep.processName] || processStep.processName
        }
      />
    </>
  );
};
