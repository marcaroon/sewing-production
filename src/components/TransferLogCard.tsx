// components/TransferLogCard.tsx - IMPROVED VERSION
"use client";

import React, { useState } from "react";
import { TransferLog, ProcessName } from "@/lib/types-new";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Modal, ModalFooter } from "./ui/Modal";
import { PROCESS_LABELS } from "@/lib/constants-new";
import { formatDateTime, formatNumber } from "@/lib/utils";
import {
  FileText,
  ArrowRight,
  Package,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Printer,
  AlertTriangle,
  User,
  Calendar,
  Clock,
} from "lucide-react";

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

  const rejects = transferLog.rejectSummary
    ? JSON.parse(transferLog.rejectSummary)
    : [];

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
          transferLog.status === "disputed" ? "border-red-400 border-2" : ""
        }`}
        hover
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <CardTitle className="text-base">
                  {transferLog.transferNumber}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-3 h-3 text-gray-600" />
                  <p className="text-xs font-semibold text-gray-700">
                    {formatDateTime(transferLog.transferDate)}
                  </p>
                </div>
              </div>
            </div>
            <Badge
              variant={
                transferLog.status === "received"
                  ? "success"
                  : transferLog.status === "disputed"
                  ? "danger"
                  : "warning"
              }
              size="sm"
            >
              {transferLog.status === "received"
                ? "Received"
                : transferLog.status === "disputed"
                ? "Disputed"
                : "Pending"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Transfer Route */}
          <div className="flex items-center justify-between bg-linear-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex-1">
              <p className="text-xs font-bold text-blue-700 uppercase mb-1">
                From
              </p>
              <p className="font-bold text-sm text-gray-900">
                {getProcessLabel(transferLog.fromProcess)}
              </p>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">
                {transferLog.fromDepartment}
              </p>
            </div>
            <div className="px-4">
              <ArrowRight className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-purple-700 uppercase mb-1">
                To
              </p>
              <p className="font-bold text-sm text-gray-900">
                {getProcessLabel(transferLog.toProcess)}
              </p>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">
                {transferLog.toDepartment}
              </p>
            </div>
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-2 gap-2.5 text-sm">
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-2.5">
              <Package className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs font-bold text-blue-700">Transferred</p>
                <p className="font-bold text-blue-900">
                  {formatNumber(transferLog.quantityTransferred)} pcs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-2.5">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs font-bold text-green-700">Completed</p>
                <p className="font-bold text-green-900">
                  {formatNumber(transferLog.quantityCompleted)} pcs
                </p>
              </div>
            </div>
            {transferLog.quantityRejected > 0 && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5">
                <XCircle className="w-4 h-4 text-red-600" />
                <div>
                  <p className="text-xs font-bold text-red-700">Rejected</p>
                  <p className="font-bold text-red-900">
                    {formatNumber(transferLog.quantityRejected)} pcs
                  </p>
                </div>
              </div>
            )}
            {transferLog.quantityRework > 0 && (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2.5">
                <RotateCcw className="w-4 h-4 text-yellow-600" />
                <div>
                  <p className="text-xs font-bold text-yellow-700">Rework</p>
                  <p className="font-bold text-yellow-900">
                    {formatNumber(transferLog.quantityRework)} pcs
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* People */}
          <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <User className="w-3 h-3 text-gray-600" />
                <p className="text-xs font-bold text-gray-700">Handed Over</p>
              </div>
              <p className="font-bold text-gray-900">
                {transferLog.handedOverBy}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <User className="w-3 h-3 text-gray-600" />
                <p className="text-xs font-bold text-gray-700">Received By</p>
              </div>
              <p className="font-bold text-gray-900">
                {transferLog.receivedBy || "-"}
              </p>
            </div>
          </div>

          {/* Duration Info */}
          {(transferLog.processingDuration || transferLog.waitingDuration) && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {transferLog.processingDuration && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded px-2.5 py-2">
                  <Clock className="w-3 h-3 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-700">Processing</p>
                    <p className="font-bold text-blue-900">
                      {transferLog.processingDuration} min
                    </p>
                  </div>
                </div>
              )}
              {transferLog.waitingDuration && (
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded px-2.5 py-2">
                  <Clock className="w-3 h-3 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-700">Waiting</p>
                    <p className="font-bold text-yellow-900">
                      {transferLog.waitingDuration} min
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t-2 border-gray-200">
            <Button
              onClick={() => setIsDetailModalOpen(true)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <FileText className="w-4 h-4" />
              Detail
            </Button>
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="w-4 h-4" />
            </Button>
            {!transferLog.isReceived && (
              <Button
                onClick={() => setIsReceiveModalOpen(true)}
                variant="success"
                size="sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Receive
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Surat Jalan - ${transferLog.transferNumber}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-linear-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-4">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Transfer Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-700 font-semibold">From Process</p>
                <p className="font-bold text-gray-900">
                  {getProcessLabel(transferLog.fromProcess)}
                </p>
                <p className="text-xs font-semibold text-gray-600">
                  {transferLog.fromDepartment}
                </p>
              </div>
              <div>
                <p className="text-gray-700 font-semibold">To Process</p>
                <p className="font-bold text-gray-900">
                  {getProcessLabel(transferLog.toProcess)}
                </p>
                <p className="text-xs font-semibold text-gray-600">
                  {transferLog.toDepartment}
                </p>
              </div>
            </div>
          </div>

          {rejects.length > 0 && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Reject/Rework Details
              </h4>
              <div className="space-y-2">
                {rejects.map((reject: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white border border-red-200 rounded-lg p-3 text-sm"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-gray-900">
                        {reject.type}
                      </span>
                      <Badge
                        variant={
                          reject.category === "reject" ? "danger" : "warning"
                        }
                        size="sm"
                      >
                        {reject.category}
                      </Badge>
                    </div>
                    <p className="text-gray-800 font-medium">
                      {reject.description}
                    </p>
                    <p className="text-gray-700 text-xs mt-2">
                      Qty:{" "}
                      <span className="font-bold">{reject.quantity} pcs</span> •
                      Action: <span className="font-bold">{reject.action}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {transferLog.notes && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
              <p className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes
              </p>
              <p className="text-sm font-medium text-yellow-800">
                {transferLog.notes}
              </p>
            </div>
          )}

          {transferLog.issues && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <p className="font-bold text-red-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Issues
              </p>
              <p className="text-sm font-medium text-red-800">
                {transferLog.issues}
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Receive Modal */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => !isSubmitting && setIsReceiveModalOpen(false)}
        title="Receive Transfer"
        size="md"
      >
        <form onSubmit={handleReceive}>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 text-sm font-semibold text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-sm">
              <p className="font-bold text-blue-900 mb-2">Will Receive:</p>
              <p className="text-gray-900 font-semibold">
                {transferLog.quantityTransferred} pcs from{" "}
                {getProcessLabel(transferLog.fromProcess)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Receiver Name *
              </label>
              <input
                type="text"
                value={receiveData.receivedBy}
                onChange={(e) =>
                  setReceiveData({ ...receiveData, receivedBy: e.target.value })
                }
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Issues? (optional)
              </label>
              <textarea
                value={receiveData.issues}
                onChange={(e) =>
                  setReceiveData({ ...receiveData, issues: e.target.value })
                }
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900"
                rows={3}
                placeholder="Any damage, shortage, or problems..."
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Additional Notes (optional)
              </label>
              <textarea
                value={receiveData.notes}
                onChange={(e) =>
                  setReceiveData({ ...receiveData, notes: e.target.value })
                }
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900"
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
              Cancel
            </Button>
            <Button type="submit" variant="success" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Confirm Receive"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
};
