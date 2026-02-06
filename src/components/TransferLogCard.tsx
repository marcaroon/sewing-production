// components/TransferLogCard.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
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
  const { user, checkPermission } = useAuth();
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

  useEffect(() => {
    if (isReceiveModalOpen && user?.name) {
      setReceiveData((prev) => ({ ...prev, receivedBy: user.name }));
    }
  }, [isReceiveModalOpen, user?.name]);

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

  const canReceive = user
    ? checkPermission("canReceiveTransfer", transferLog.toProcess)
    : false;

  const isAdmin = user?.isAdmin || false;

  const handlePrint = () => {
    window.open(`/api/transfer-logs/${transferLog.id}/print`, "_blank");
  };

  return (
    <>
      <Card
        className={`${
          transferLog.status === "disputed"
            ? "border-destructive/40 border-2"
            : ""
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
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <p className="text-xs font-semibold text-foreground">
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
          <div className="flex items-center justify-between bg-linear-to-r from-muted to-purple-500/10 border-2 border-blue-500/30 rounded-lg p-4">
            <div className="flex-1">
              <p className="text-xs font-bold text-blue-600 uppercase mb-1">
                Dari
              </p>
              <p className="font-bold text-sm text-foreground">
                {getProcessLabel(transferLog.fromProcess)}
              </p>
              <p className="text-xs font-semibold text-foreground mt-0.5">
                {transferLog.fromDepartment}
              </p>
            </div>
            <div className="px-4">
              <ArrowRight className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-purple-600 uppercase mb-1">
                Ke
              </p>
              <p className="font-bold text-sm text-foreground">
                {getProcessLabel(transferLog.toProcess)}
              </p>
              <p className="text-xs font-semibold text-foreground mt-0.5">
                {transferLog.toDepartment}
              </p>
            </div>
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-2 gap-2.5 text-sm">
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-lg p-2.5">
              <Package className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs font-bold text-blue-600">Dipindahkan</p>
                <p className="font-bold text-blue-600">
                  {formatNumber(transferLog.quantityTransferred)} pcs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg p-2.5">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs font-bold text-green-600">Selesai</p>
                <p className="font-bold text-green-600">
                  {formatNumber(transferLog.quantityCompleted)} pcs
                </p>
              </div>
            </div>
            {transferLog.quantityRejected > 0 && (
              <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/40 rounded-lg p-2.5">
                <XCircle className="w-4 h-4 text-destructive" />
                <div>
                  <p className="text-xs font-bold text-destructive">Rejected</p>
                  <p className="font-bold text-destructive">
                    {formatNumber(transferLog.quantityRejected)} pcs
                  </p>
                </div>
              </div>
            )}
            {transferLog.quantityRework > 0 && (
              <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2.5">
                <RotateCcw className="w-4 h-4 text-yellow-600" />
                <div>
                  <p className="text-xs font-bold text-yellow-600">Rework</p>
                  <p className="font-bold text-yellow-600">
                    {formatNumber(transferLog.quantityRework)} pcs
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* People */}
          <div className="grid grid-cols-2 gap-3 text-sm bg-muted border border-border rounded-lg p-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <User className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs font-bold text-foreground">Handed Over</p>
              </div>
              <p className="font-bold text-foreground">
                {transferLog.handedOverBy}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <User className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs font-bold text-foreground">
                  Diterima oleh
                </p>
              </div>
              <p className="font-bold text-foreground">
                {transferLog.receivedBy || "-"}
              </p>
            </div>
          </div>

          {/* Duration Info */}
          {(transferLog.processingDuration || transferLog.waitingDuration) && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {transferLog.processingDuration && (
                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded px-2.5 py-2">
                  <Clock className="w-3 h-3 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-600">Memproses</p>
                    <p className="font-bold text-blue-600">
                      {transferLog.processingDuration} min
                    </p>
                  </div>
                </div>
              )}
              {transferLog.waitingDuration && (
                <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded px-2.5 py-2">
                  <Clock className="w-3 h-3 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-600">Menunggu</p>
                    <p className="font-bold text-yellow-600">
                      {transferLog.waitingDuration} min
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t-2 border-border">
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
            {!transferLog.isReceived && canReceive && (
              <Button
                onClick={() => setIsReceiveModalOpen(true)}
                variant="success"
                size="sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Terima
              </Button>
            )}
            {!transferLog.isReceived && !canReceive && !isAdmin && (
              <div className="text-xs text-muted-foreground flex items-center gap-1 px-2">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Hanya {transferLog.toDepartment} yang dapat menerima
                </span>
              </div>
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
          <div className="bg-linear-to-r from-muted to-purple-500/10 border-2 border-blue-500/40 rounded-lg p-4">
            <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Informasi Perpindahan
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-foreground font-semibold">Dari Proses</p>
                <p className="font-bold text-foreground">
                  {getProcessLabel(transferLog.fromProcess)}
                </p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {transferLog.fromDepartment}
                </p>
              </div>
              <div>
                <p className="text-foreground font-semibold">Ke Proses</p>
                <p className="font-bold text-foreground">
                  {getProcessLabel(transferLog.toProcess)}
                </p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {transferLog.toDepartment}
                </p>
              </div>
            </div>
          </div>

          {rejects.length > 0 && (
            <div className="bg-destructive/10 border-2 border-destructive/40 rounded-lg p-4">
              <h4 className="font-bold text-destructive mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Detail Reject/Rework
              </h4>
              <div className="space-y-2">
                {rejects.map((reject: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-card border border-destructive/40 rounded-lg p-3 text-sm"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-foreground">
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
                    <p className="text-foreground font-medium">
                      {reject.description}
                    </p>
                    <p className="text-foreground text-xs mt-2">
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
            <div className="bg-warning/10 border-2 border-warning/40 rounded-lg p-4">
              <p className="font-bold text-warning mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Catatan
              </p>
              <p className="text-sm font-medium text-warning-foreground">
                {transferLog.notes}
              </p>
            </div>
          )}

          {transferLog.issues && (
            <div className="bg-destructive/10 border-2 border-destructive/40 rounded-lg p-4">
              <p className="font-bold text-destructive mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Issues
              </p>
              <p className="text-sm font-medium text-destructive">
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
              <div className="bg-destructive/10 border-2 border-destructive/40 rounded-lg p-3 text-sm font-semibold text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="bg-blue-500/10 border-2 border-blue-500/40 rounded-lg p-4 text-sm">
              <p className="font-bold text-blue-600 mb-2">Akan diterima:</p>
              <p className="text-foreground font-semibold">
                {transferLog.quantityTransferred} pcs from{" "}
                {getProcessLabel(transferLog.fromProcess)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                Nama Penerima *
              </label>
              <input
                type="text"
                value={receiveData.receivedBy}
                readOnly
                className="w-full px-4 py-2.5 border-2 border-border rounded-lg font-medium text-foreground"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                Issues? (Opsional)
              </label>
              <textarea
                value={receiveData.issues}
                onChange={(e) =>
                  setReceiveData({ ...receiveData, issues: e.target.value })
                }
                className="w-full px-4 py-2.5 border-2 border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-foreground"
                rows={3}
                placeholder="Any damage, shortage, or problems..."
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                Catatan Tambahan (Oprional)
              </label>
              <textarea
                value={receiveData.notes}
                onChange={(e) =>
                  setReceiveData({ ...receiveData, notes: e.target.value })
                }
                className="w-full px-4 py-2.5 border-2 border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-foreground"
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
            <Button type="submit" variant="success" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Confirm Receive"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
};
