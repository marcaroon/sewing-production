// components/TransferLogTable.tsx

"use client";

import React, { useState } from "react";
import { TransferLog } from "@/lib/types";
import { Badge } from "./ui/Badge";
import { Modal } from "./ui/Modal";
import { formatDateTime } from "@/lib/utils";
import { ITEM_CONDITIONS } from "@/lib/constants";

interface TransferLogTableProps {
  transfers: TransferLog[];
}

export const TransferLogTable: React.FC<TransferLogTableProps> = ({
  transfers,
}) => {
  const [selectedTransfer, setSelectedTransfer] = useState<TransferLog | null>(
    null
  );

  // Sort by transfer date descending
  const sortedTransfers = [...transfers].sort(
    (a, b) =>
      new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime()
  );

  if (sortedTransfers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Belum ada surat jalan</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                No. Surat Jalan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dari
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ke
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTransfers.map((transfer) => (
              <tr key={transfer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {transfer.transferNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {transfer.fromDepartment}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {transfer.toDepartment}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDateTime(transfer.transferDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={transfer.isReceived ? "success" : "warning"}>
                    {transfer.isReceived ? "Diterima" : "Belum Diterima"}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => setSelectedTransfer(transfer)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={selectedTransfer !== null}
        onClose={() => setSelectedTransfer(null)}
        title="Detail Surat Jalan"
        size="lg"
      >
        {selectedTransfer && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-600">No. Surat Jalan</p>
                <p className="font-semibold text-gray-900">
                  {selectedTransfer.transferNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">No. Order</p>
                <p className="font-semibold text-gray-900">
                  {selectedTransfer.orderNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tanggal Transfer</p>
                <p className="font-semibold text-gray-900">
                  {formatDateTime(selectedTransfer.transferDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge
                  variant={selectedTransfer.isReceived ? "success" : "warning"}
                >
                  {selectedTransfer.isReceived ? "Diterima" : "Belum Diterima"}
                </Badge>
              </div>
            </div>

            {/* Transfer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Dari Department</p>
                <p className="font-semibold text-gray-900">
                  {selectedTransfer.fromDepartment}
                </p>
                <p className="text-sm text-gray-600 mt-2">Diserahkan oleh</p>
                <p className="font-semibold text-gray-900">
                  {selectedTransfer.handedOverBy}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Ke Department</p>
                <p className="font-semibold text-gray-900">
                  {selectedTransfer.toDepartment}
                </p>
                <p className="text-sm text-gray-600 mt-2">Diterima oleh</p>
                <p className="font-semibold text-gray-900">
                  {selectedTransfer.receivedBy}
                </p>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Daftar Item</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {selectedTransfer.items.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded p-3 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.description}
                        </p>
                        {item.bundleNumber && (
                          <p className="text-sm text-gray-600">
                            Bundle: {item.bundleNumber}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          item.condition === "good"
                            ? "success"
                            : item.condition === "defect"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {ITEM_CONDITIONS[item.condition]}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Jumlah:</span>
                      <span className="font-semibold text-gray-900">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    {item.remarks && (
                      <p className="text-xs text-gray-600 mt-2 italic">
                        Catatan: {item.remarks}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {selectedTransfer.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-900 mb-1">
                  Catatan
                </p>
                <p className="text-sm text-yellow-800">
                  {selectedTransfer.notes}
                </p>
              </div>
            )}

            {/* Received Info */}
            {selectedTransfer.isReceived && selectedTransfer.receivedDate && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-900 mb-1">
                  ✓ Barang Sudah Diterima
                </p>
                <p className="text-sm text-green-800">
                  Tanggal: {formatDateTime(selectedTransfer.receivedDate)}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};
