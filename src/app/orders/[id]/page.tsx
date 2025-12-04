// D:\Jobs\Total Quality\DMOS\tq-sewingproduction\src\app\orders\[id]\page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Order, ProcessHistoryLog, TransferLog } from "@/lib/types";
import {
  orderStorage,
  processHistoryStorage,
  transferLogStorage,
} from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProcessTimeline } from "@/components/ProcessTimeline";
import { TransferLogTable } from "@/components/TransferLogTable";
import { StatusUpdateForm } from "@/components/StatusUpdateForm";
import {
  PROCESS_STATUS_LABELS,
  STATUS_COLORS,
  BUYER_TYPE_LABELS,
  GARMENT_CATEGORIES,
} from "@/lib/constants";
import {
  formatDate,
  formatDateTime,
  calculateProgress,
  isOrderDelayed,
  getDelayDays,
  calculateCompletionRate,
  calculateRejectRate,
  formatNumber,
  calculateTotalWIP,
} from "@/lib/utils";

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<ProcessHistoryLog[]>([]);
  const [transfers, setTransfers] = useState<TransferLog[]>([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "timeline" | "transfers" | "details"
  >("overview");

  useEffect(() => {
    loadOrderData();
  }, [id]);

  const loadOrderData = () => {
    const orderData = orderStorage.getById(id);
    if (!orderData) {
      router.push("/orders");
      return;
    }

    setOrder(orderData);
    setHistory(processHistoryStorage.getByOrderId(id));
    setTransfers(transferLogStorage.getByOrderId(id));
  };

  const handleUpdate = () => {
    loadOrderData();
  };

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const progress = calculateProgress(order);
  const isDelayed = isOrderDelayed(order);
  const delayDays = getDelayDays(order);
  const completionRate = calculateCompletionRate(order);
  const rejectRate = calculateRejectRate(order);
  const totalWIP = calculateTotalWIP(order);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push("/orders")}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {order.orderNumber}
            </h1>
            <p className="text-gray-600 mt-1">
              {order.buyer.name} - {order.style.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusUpdateForm order={order} onUpdate={handleUpdate} />
            <Badge
              variant={order.buyer.type === "repeat" ? "success" : "warning"}
            >
              {BUYER_TYPE_LABELS[order.buyer.type]}
            </Badge>
          </div>
        </div>

        {/* Status Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  STATUS_COLORS[order.currentStatus]
                }`}
              >
                {PROCESS_STATUS_LABELS[order.currentStatus]}
              </span>
              <div className="text-right">
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-gray-900">{progress}%</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            {isDelayed && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  ⚠️ Order terlambat {delayDays} hari dari target
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex gap-8">
            {(["overview", "timeline", "transfers", "details"] as const).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab === "overview" && "Overview"}
                  {tab === "timeline" && "Timeline Process"}
                  {tab === "transfers" && "Surat Jalan"}
                  {tab === "details" && "Detail Order"}
                </button>
              )
            )}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Quantity</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(order.totalQuantity)}
                    </p>
                    <p className="text-xs text-gray-500">pieces</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Completed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {completionRate}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.sizeBreakdown.reduce(
                        (sum, s) => sum + s.completed,
                        0
                      )}{" "}
                      pcs
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">WIP</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatNumber(totalWIP)}
                    </p>
                    <p className="text-xs text-gray-500">pieces</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Reject Rate</p>
                    <p
                      className={`text-2xl font-bold ${
                        rejectRate > 5 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {rejectRate}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.totalRejected} pcs
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Size Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Size Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                          Size
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          Quantity
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          Completed
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          Rejected
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          Bundles
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          Progress
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.sizeBreakdown.map((size) => (
                        <tr
                          key={size.size}
                          className="border-b border-gray-100"
                        >
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {size.size}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900">
                            {size.quantity}
                          </td>
                          <td className="py-3 px-4 text-right text-green-600 font-medium">
                            {size.completed}
                          </td>
                          <td className="py-3 px-4 text-right text-red-600 font-medium">
                            {size.rejected}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900">
                            {size.bundleCount || 0}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{
                                    width: `${
                                      size.quantity > 0
                                        ? (size.completed / size.quantity) * 100
                                        : 0
                                    }%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 w-10 text-right">
                                {size.quantity > 0
                                  ? Math.round(
                                      (size.completed / size.quantity) * 100
                                    )
                                  : 0}
                                %
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* WIP Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>WIP Distribution by Department</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(order.wip).map(([dept, qty]) => (
                    <div key={dept}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {dept
                            .replace("at", "")
                            .replace(/([A-Z])/g, " $1")
                            .trim()}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatNumber(qty)} pcs
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${
                              totalWIP > 0 ? (qty / totalWIP) * 100 : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(order.orderDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Target Date</p>
                  <p
                    className={`font-semibold ${
                      isDelayed ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {formatDate(order.targetDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sewing Line</p>
                  <p className="font-semibold text-gray-900">
                    {order.assignedLine || "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created By</p>
                  <p className="font-semibold text-gray-900">
                    {order.createdBy}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="font-semibold text-gray-900">
                    {formatDateTime(order.updatedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Buyer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Buyer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">
                    {order.buyer.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Code</p>
                  <p className="font-semibold text-gray-900">
                    {order.buyer.code}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <Badge
                    variant={
                      order.buyer.type === "repeat" ? "success" : "warning"
                    }
                  >
                    {BUYER_TYPE_LABELS[order.buyer.type]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Leftover Policy</p>
                  <p className="text-sm text-gray-900">
                    {order.buyer.leftoverPolicy.canReuse
                      ? "✓ Can be reused"
                      : "✗ Must be returned"}
                  </p>
                </div>
                {order.buyer.contactPerson && (
                  <div>
                    <p className="text-sm text-gray-600">Contact Person</p>
                    <p className="font-semibold text-gray-900">
                      {order.buyer.contactPerson}
                    </p>
                    {order.buyer.phone && (
                      <p className="text-sm text-gray-600">
                        {order.buyer.phone}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Style Info */}
            <Card>
              <CardHeader>
                <CardTitle>Style Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Style Code</p>
                  <p className="font-semibold text-gray-900">
                    {order.style.styleCode}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-semibold text-gray-900">
                    {GARMENT_CATEGORIES[order.style.category]}
                  </p>
                </div>
                {order.style.description && (
                  <div>
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="text-sm text-gray-900">
                      {order.style.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <Card>
          <CardHeader>
            <CardTitle>Process Timeline & History</CardTitle>
          </CardHeader>
          <CardContent>
            <ProcessTimeline history={history} />
          </CardContent>
        </Card>
      )}

      {activeTab === "transfers" && (
        <Card>
          <CardHeader>
            <CardTitle>Surat Jalan & Transfer Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <TransferLogTable transfers={transfers} />
          </CardContent>
        </Card>
      )}

      {activeTab === "details" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Time */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Time per Process (hours)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(order.leadTime).map(([process, hours]) => (
                  <div
                    key={process}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-gray-700 capitalize">
                      {process.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {hours} hours
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Process Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Process Progress (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(order.progress).map(([process, percentage]) => (
                  <div key={process}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {process}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
