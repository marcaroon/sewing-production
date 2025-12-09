"use client";

import React, { useState } from "react";
import { TransferLog, ProcessName } from "@/lib/types-new"; // Import ProcessName
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Modal, ModalFooter } from "./ui/Modal";
import { PROCESS_LABELS } from "@/lib/constants-new";
import { formatDateTime, formatNumber } from "@/lib/utils";

interface TransferLogCardProps {
  transferLog: TransferLog;
  onUpdate?: () => void;
}

export const TransferLogCard: React.FC<TransferLogCardProps> = ({
  transferLog,
  onUpdate,
}) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receiveData, setReceiveData] = useState({
    receivedBy: "",
    issues: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Parse reject summary
  const rejects = transferLog.rejectSummary
    ? JSON.parse(transferLog.rejectSummary)
    : [];

  // Helper function to get process label safely
  const getProcessLabel = (processName: ProcessName): string => {
    return PROCESS_LABELS[processName] || processName;
  };

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/transfer-logs/${transferLog.id}/receive`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(receiveData),
        }
      );

      const result = await response.json();

      if (result.success) {
        setIsReceiveModalOpen(false);
        setReceiveData({ receivedBy: "", issues: "", notes: "" });
        if (onUpdate) onUpdate();
      } else {
        setError(result.error || "Failed to receive transfer");
      }
    } catch (err) {
      setError("Failed to receive transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.open(`/api/transfer-logs/${transferLog.id}/print`, "_blank");
  };

  return (
    <>
      <Card
        className={`${
          transferLog.status === "disputed" ? "border-red-300 border-2" : ""
        }`}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">
                {transferLog.transferNumber}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {formatDateTime(transferLog.transferDate)}
              </p>
            </div>
            <Badge
              variant={
                transferLog.status === "received"
                  ? "success"
                  : transferLog.status === "disputed"
                  ? "danger"
                  : "warning"
              }
            >
              {transferLog.status === "received"
                ? "Diterima"
                : transferLog.status === "disputed"
                ? "Disputed"
                : "Pending"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Transfer Route */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
            <div className="flex-1">
              <p className="text-xs text-gray-600">Dari</p>
              <p className="font-semibold text-sm text-gray-900">
                {getProcessLabel(transferLog.fromProcess)}
              </p>
              <p className="text-xs text-gray-600">
                {transferLog.fromDepartment}
              </p>
            </div>
            <div className="px-4">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-600">Ke</p>
              <p className="font-semibold text-sm text-gray-900">
                {getProcessLabel(transferLog.toProcess)}
              </p>
              <p className="text-xs text-gray-600">
                {transferLog.toDepartment}
              </p>
            </div>
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-blue-50 rounded p-2">
              <p className="text-xs text-blue-800">Transferred</p>
              <p className="font-bold text-blue-900">
                {formatNumber(transferLog.quantityTransferred)} pcs
              </p>
            </div>
            <div className="bg-green-50 rounded p-2">
              <p className="text-xs text-green-800">Completed</p>
              <p className="font-bold text-green-900">
                {formatNumber(transferLog.quantityCompleted)} pcs
              </p>
            </div>
            {transferLog.quantityRejected > 0 && (
              <div className="bg-red-50 rounded p-2">
                <p className="text-xs text-red-800">Rejected</p>
                <p className="font-bold text-red-900">
                  {formatNumber(transferLog.quantityRejected)} pcs
                </p>
              </div>
            )}
            {transferLog.quantityRework > 0 && (
              <div className="bg-yellow-50 rounded p-2">
                <p className="text-xs text-yellow-800">Rework</p>
                <p className="font-bold text-yellow-900">
                  {formatNumber(transferLog.quantityRework)} pcs
                </p>
              </div>
            )}
          </div>

          {/* People */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-600">Diserahkan</p>
              <p className="font-semibold text-gray-900">
                {transferLog.handedOverBy}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Diterima</p>
              <p className="font-semibold text-gray-900">
                {transferLog.receivedBy || "-"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <Button
              onClick={() => setIsDetailModalOpen(true)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Detail
            </Button>
            <Button onClick={handlePrint} variant="outline" size="sm">
              Print
            </Button>
            {!transferLog.isReceived && (
              <Button
                onClick={() => setIsReceiveModalOpen(true)}
                variant="primary"
                size="sm"
              >
                Terima
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Detail Surat Jalan - ${transferLog.transferNumber}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Full details here - similar to card but expanded */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Informasi Transfer</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Dari Proses</p>
                <p className="font-semibold">
                  {getProcessLabel(transferLog.fromProcess)}
                </p>
                <p className="text-xs text-gray-600">
                  {transferLog.fromDepartment}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Ke Proses</p>
                <p className="font-semibold">
                  {getProcessLabel(transferLog.toProcess)}
                </p>
                <p className="text-xs text-gray-600">
                  {transferLog.toDepartment}
                </p>
              </div>
            </div>
          </div>

          {rejects.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-3">
                Detail Reject/Rework
              </h4>
              <div className="space-y-2">
                {rejects.map((reject: any, idx: number) => (
                  <div key={idx} className="bg-white rounded p-3 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold">{reject.type}</span>
                      <Badge
                        variant={
                          reject.category === "reject" ? "danger" : "warning"
                        }
                      >
                        {reject.category}
                      </Badge>
                    </div>
                    <p className="text-gray-700">{reject.description}</p>
                    <p className="text-gray-600 text-xs mt-1">
                      Qty: {reject.quantity} pcs • Action: {reject.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {transferLog.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="font-semibold text-yellow-900 mb-1">Catatan</p>
              <p className="text-sm text-yellow-800">{transferLog.notes}</p>
            </div>
          )}

          {transferLog.issues && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
              <p className="font-semibold text-red-900 mb-1">⚠ Issues</p>
              <p className="text-sm text-red-800">{transferLog.issues}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Receive Modal */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => !isSubmitting && setIsReceiveModalOpen(false)}
        title="Terima Surat Jalan"
        size="md"
      >
        <form onSubmit={handleReceive}>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4 text-sm">
              <p className="font-semibold mb-2">Yang akan diterima:</p>
              <p>
                {transferLog.quantityTransferred} pcs dari{" "}
                {getProcessLabel(transferLog.fromProcess)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Nama Penerima *
              </label>
              <input
                type="text"
                value={receiveData.receivedBy}
                onChange={(e) =>
                  setReceiveData({ ...receiveData, receivedBy: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Ada Masalah/Issues? (opsional)
              </label>
              <textarea
                value={receiveData.issues}
                onChange={(e) =>
                  setReceiveData({ ...receiveData, issues: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Jika ada kerusakan, kekurangan, atau masalah lainnya..."
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Catatan Tambahan (opsional)
              </label>
              <textarea
                value={receiveData.notes}
                onChange={(e) =>
                  setReceiveData({ ...receiveData, notes: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReceiveModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Konfirmasi Terima"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
};