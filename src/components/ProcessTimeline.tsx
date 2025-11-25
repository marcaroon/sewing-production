// components/ProcessTimeline.tsx

"use client";

import React from "react";
import { ProcessHistoryLog } from "@/lib/types";
import { PROCESS_STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

interface ProcessTimelineProps {
  history: ProcessHistoryLog[];
}

export const ProcessTimeline: React.FC<ProcessTimelineProps> = ({
  history,
}) => {
  // Sort by timestamp descending (newest first)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (sortedHistory.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Belum ada history proses</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedHistory.map((log, index) => (
        <div key={log.id} className="relative">
          {/* Timeline Line */}
          {index !== sortedHistory.length - 1 && (
            <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200" />
          )}

          <div className="flex gap-4">
            {/* Timeline Dot */}
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_COLORS[log.processStatus]
                    }`}
                  >
                    {PROCESS_STATUS_LABELS[log.processStatus]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDateTime(log.timestamp)}
                  </span>
                </div>

                {/* Action Description */}
                <p className="text-sm text-gray-900 mb-2">{log.action}</p>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Department:</span>{" "}
                    {log.department}
                  </div>
                  <div>
                    <span className="font-medium">Performed by:</span>{" "}
                    {log.performedBy}
                  </div>
                  {log.duration && (
                    <div>
                      <span className="font-medium">Duration:</span>{" "}
                      {log.duration} menit
                    </div>
                  )}
                </div>

                {/* Notes */}
                {log.notes && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600 italic">{log.notes}</p>
                  </div>
                )}

                {/* Transfer Log Link */}
                {log.transferLogId && (
                  <div className="mt-2">
                    <span className="text-xs text-blue-600">
                      📋 Surat Jalan: {log.transferLogId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
