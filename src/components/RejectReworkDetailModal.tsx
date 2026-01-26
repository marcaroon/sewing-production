// src/components/RejectReworkDetailModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { Badge } from "./ui/Badge";
import { REJECT_TYPE_LABELS } from "@/lib/constants-new";
import { formatDateTime } from "@/lib/utils";
import { RejectLog } from "@/lib/types-new";
import {
  XCircle,
  RotateCcw,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface RejectReworkDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  processStepId: string;
  processName: string;
}

const REJECT_CATEGORY_LABELS = {
  reject: "Reject",
  rework: "Rework",
};

const REJECT_ACTION_LABELS = {
  rework: "Rework",
  scrap: "Scrap/Buang",
  pending: "Pending",
};

export const RejectReworkDetailModal: React.FC<
  RejectReworkDetailModalProps
> = ({ isOpen, onClose, processStepId, processName }) => {
  const [rejectLogs, setRejectLogs] = useState<RejectLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && processStepId) {
      loadRejectLogs();
    }
  }, [isOpen, processStepId]);

  const loadRejectLogs = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/process-steps/${processStepId}/reject`
      );
      const result = await response.json();

      if (result.success) {
        setRejectLogs(result.data);
      } else {
        setError(result.error || "Failed to load reject logs");
      }
    } catch (err) {
      console.error("Error loading reject logs:", err);
      setError("Failed to load reject logs");
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalRejects = () => {
    return rejectLogs
      .filter((log) => log.rejectCategory === "reject")
      .reduce((sum, log) => sum + log.quantity, 0);
  };

  const getTotalReworks = () => {
    return rejectLogs
      .filter((log) => log.rejectCategory === "rework")
      .reduce((sum, log) => sum + log.quantity, 0);
  };

  const getCompletedReworks = () => {
    return rejectLogs.filter(
      (log) => log.rejectCategory === "rework" && log.reworkCompleted
    ).length;
  };

  const getPendingReworks = () => {
    return rejectLogs.filter(
      (log) => log.rejectCategory === "rework" && !log.reworkCompleted
    ).length;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Reject & Rework - ${processName}`}
      size="xl"
    >
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-red-700 uppercase mb-1">
                Total Rejected
              </p>
              <p className="text-3xl font-bold text-red-900">
                {getTotalRejects()}
              </p>
              <p className="text-xs text-red-600 mt-1">pieces</p>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-yellow-700 uppercase mb-1">
                Total Rework
              </p>
              <p className="text-3xl font-bold text-yellow-900">
                {getTotalReworks()}
              </p>
              <p className="text-xs text-yellow-600 mt-1">pieces</p>
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-green-700 uppercase mb-1">
                Rework Selesai
              </p>
              <p className="text-3xl font-bold text-green-900">
                {getCompletedReworks()}
              </p>
              <p className="text-xs text-green-600 mt-1">items</p>
            </div>

            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-orange-700 uppercase mb-1">
                Rework Pending
              </p>
              <p className="text-3xl font-bold text-orange-900">
                {getPendingReworks()}
              </p>
              <p className="text-xs text-orange-600 mt-1">items</p>
            </div>
          </div>

          {/* Reject Logs List */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Riwayat Reject & Rework ({rejectLogs.length} items)
            </h3>

            <div className="space-y-4">
              {rejectLogs.map((log) => (
                <div
                  key={log.id}
                  className={`border-2 rounded-xl p-5 ${
                    log.rejectCategory === "reject"
                      ? "bg-red-50 border-red-300"
                      : "bg-yellow-50 border-yellow-300"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {log.rejectCategory === "reject" ? (
                        <XCircle className="w-6 h-6 text-red-600" />
                      ) : (
                        <RotateCcw className="w-6 h-6 text-yellow-600" />
                      )}
                      <div>
                        <h4 className="font-bold text-gray-900">
                          {REJECT_TYPE_LABELS[log.rejectType]}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {log.bundleNumber && `${log.bundleNumber} • `}
                          {log.size && `Size ${log.size}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          log.rejectCategory === "reject" ? "danger" : "warning"
                        }
                      >
                        {REJECT_CATEGORY_LABELS[log.rejectCategory]}
                      </Badge>
                      {log.reworkCompleted && (
                        <Badge variant="success">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Rework Selesai
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">
                        Quantity
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {log.quantity} pieces
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">
                        Action
                      </p>
                      <Badge
                        variant={
                          log.action === "rework"
                            ? "warning"
                            : log.action === "scrap"
                            ? "danger"
                            : "default"
                        }
                      >
                        {REJECT_ACTION_LABELS[log.action]}
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Deskripsi:
                    </p>
                    <p className="text-sm text-gray-900 font-medium">
                      {log.description}
                    </p>
                  </div>

                  {/* Root Cause */}
                  {log.rootCause && (
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mb-4">
                      <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Root Cause:
                      </p>
                      <p className="text-sm text-gray-900 font-medium">
                        {log.rootCause}
                      </p>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="border-t-2 border-gray-300 pt-4 space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <div>
                        <span className="font-semibold text-gray-700">
                          Terdeteksi:{" "}
                        </span>
                        <span className="text-gray-900">
                          {formatDateTime(log.detectedTime)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <User className="w-4 h-4 text-gray-600" />
                      <div>
                        <span className="font-semibold text-gray-700">
                          Dilaporkan oleh:{" "}
                        </span>
                        <span className="text-gray-900">{log.reportedBy}</span>
                      </div>
                    </div>

                    {log.reworkCompleted && (
                      <>
                        <div className="flex items-center gap-3 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <div>
                            <span className="font-semibold text-gray-700">
                              Rework Selesai:{" "}
                            </span>
                            <span className="text-gray-900">
                              {log.reworkCompletedTime &&
                                formatDateTime(log.reworkCompletedTime)}
                            </span>
                          </div>
                        </div>

                        {log.actionTakenBy && (
                          <div className="flex items-center gap-3 text-sm">
                            <User className="w-4 h-4 text-gray-600" />
                            <div>
                              <span className="font-semibold text-gray-700">
                                Dikerjakan oleh:{" "}
                              </span>
                              <span className="text-gray-900">
                                {log.actionTakenBy}
                              </span>
                            </div>
                          </div>
                        )}

                        {log.finalDisposition && (
                          <div className="bg-green-100 border-2 border-green-300 rounded-lg p-3 mt-3">
                            <p className="text-sm font-bold text-green-900">
                              Final Status:{" "}
                              {log.finalDisposition === "passed"
                                ? "✓ Passed"
                                : "✗ Scrapped"}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {rejectLogs.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Tidak ada reject/rework yang tercatat
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
