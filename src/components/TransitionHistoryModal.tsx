// src/components/TransitionHistoryModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { Badge } from "./ui/Badge";
import { formatDateTime } from "@/lib/utils";
import { ProcessTransition } from "@/lib/types-new";
import {
  History,
  ArrowRight,
  User,
  FileText,
  Clock,
  AlertCircle,
} from "lucide-react";

interface TransitionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  processStepId: string;
  processName: string;
}

export const TransitionHistoryModal: React.FC<TransitionHistoryModalProps> = ({
  isOpen,
  onClose,
  processStepId,
  processName,
}) => {
  const [transitions, setTransitions] = useState<ProcessTransition[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransitions = async () => {
    if (!processStepId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/process-steps/${processStepId}/transition`
      );
      // Cek jika response tidak ok (misal 404 atau 500)
      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      if (data.success) {
        setTransitions(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch transitions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTransitions();
    }
  }, [isOpen, processStepId]);

  // PERBAIKAN DI SINI: Sesuaikan return value dengan tipe Badge yang valid
  // Valid types: "success" | "warning" | "default" | "danger" | "info" | "purple"
  const getStatusColor = (
    status: string
  ): "success" | "warning" | "default" | "info" | "danger" => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "info"; // Ganti 'primary' jadi 'info' (biru)
      case "waiting":
        return "warning";
      case "at_ppic":
        return "default"; // Ganti 'neutral' jadi 'default' (abu-abu)
      case "rejected":
        return "danger";
      default:
        return "default";
    }
  };

  const formatStatus = (status: string) => {
    return status ? status.replace(/_/g, " ").toUpperCase() : "-";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Riwayat Proses - ${processName}`}
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <div className="relative border-l-2 border-border ml-3 space-y-6 pl-6 py-2">
              {transitions.map((log) => (
                <div key={log.id} className="relative">
                  {/* Dot Indicator */}
                  <div className="absolute -left-7.75 top-1 bg-card border-2 border-blue-500 rounded-full w-4 h-4"></div>

                  <div className="bg-muted border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    {/* Header: Waktu & User */}
                    <div className="flex justify-between items-start mb-3 border-b border-border pb-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatDateTime(log.transitionTime)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded-full">
                        <User className="w-3 h-3" />
                        {log.performedBy}
                      </div>
                    </div>

                    {/* Body: Perubahan Status */}
                    <div className="flex items-center flex-wrap gap-2 mb-3">
                      <Badge variant={getStatusColor(log.fromState)}>
                        {formatStatus(log.fromState)}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <Badge variant={getStatusColor(log.toState)}>
                        {formatStatus(log.toState)}
                      </Badge>
                    </div>

                    {/* Footer: Notes */}
                    {log.notes ? (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 mt-2">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-xs font-bold text-blue-600 block mb-1">
                              Catatan:
                            </span>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                              {log.notes}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Tidak ada catatan
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {transitions.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">
                Belum ada riwayat transisi
              </p>
            </div>
          )}

          <div className="pt-4 border-t flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-muted hover:bg-muted text-foreground rounded-lg transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
