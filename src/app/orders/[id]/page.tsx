// app/orders/[id]/page.tsx (Updated with API)

"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BarcodeDisplay } from "@/components/BarcodeDisplay";
import { ProcessStepCard } from "@/components/ProcessStepCards";
import { PPICAssignmentModal } from "@/components/PPICAssignmentModal";
import { DualProgressBarsFull } from "@/components/DualProgressBars";
import apiClient from "@/lib/api-client";
import { Order, ProcessStep } from "@/lib/types-new";
import {
  PROCESS_LABELS,
  PHASE_LABELS,
  PROCESS_STATE_LABELS,
  BUYER_TYPE_LABELS,
  GARMENT_CATEGORIES,
} from "@/lib/constants-new";
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { TransferLogList } from "@/components/TransferLogList";

export default function OrderDetailPage() {
  const { user, checkPermission } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
  const [qrCodes, setQrCodes] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "process-steps" | "transfers" | "details" | "qr"
  >("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isPPICModalOpen, setIsPPICModalOpen] = useState(false);

  const canEdit = checkPermission("canEditOrder");
  const canAssign = checkPermission("canAssignProcess");

  useEffect(() => {
    loadOrderData();
  }, [id]);

  const loadOrderData = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Load order dan process steps
      const [orderData, stepsData] = await Promise.all([
        apiClient.getOrderById(id),
        apiClient.getProcessStepsByOrderId(id),
      ]);

      setOrder(orderData);
      setProcessSteps(stepsData);

      // Check if order has Barcodes
      if ((orderData as any).qrCode) {
        setQrCodes({
          orderQR: (orderData as any).qrCode,
          bundleQRs: (orderData as any).bundles
            ?.filter((b: any) => b.qrCode)
            .map((b: any) => b.qrCode),
        });
      }
    } catch (err) {
      console.error("Error loading order:", err);
      setError("Failed to load order data. Please try again.");
      setTimeout(() => router.push("/orders"), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = () => {
    loadOrderData();
  };

  useEffect(() => {
    if (id) {
      const loadProcessSteps = async () => {
        const steps = await apiClient.getProcessStepsByOrderId(id);
        setProcessSteps(steps);
      };
      loadProcessSteps();
    }
  }, [id]);

  const handleGenerateQR = async () => {
    if (!order) return;

    setIsGeneratingQR(true);
    try {
      const result = await apiClient.generateOrderQR(order.id);
      alert(
        `Barcodes generated successfully!\nOrder QR: 1\nBundle QRs: ${
          result.bundleQRCodes?.length || 0
        }`
      );
      // Reload to get Barcodes
      await loadOrderData();
    } catch (err) {
      console.error("Error generating Barcodes:", err);
      alert("Failed to generate Barcodes. Please try again.");
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handlePrintQR = (type: "order" | "bundle" | "all") => {
    if (!order) return;
    window.open(`/api/orders/${order.id}/print-qr?type=${type}`, "_blank");
  };

  // Helper functions untuk calculate metrics
  const calculateCompletionRate = () => {
    return order && order.totalQuantity > 0
      ? Math.round((order.totalCompleted / order.totalQuantity) * 100)
      : 0;
  };

  const calculateRejectRate = () => {
    return order && order.totalQuantity > 0
      ? Math.round((order.totalRejected / order.totalQuantity) * 100 * 10) / 10
      : 0;
  };

  const isDelayed = () => {
    if (!order) return false;
    const now = new Date();
    const productionDeadline = new Date(order.productionDeadline);
    return order.currentProcess !== "delivered" && now > productionDeadline;
  };

  const getDelayDays = () => {
    if (!order || !isDelayed()) return 0;
    const now = new Date();
    const deadline = new Date(order.productionDeadline);
    return Math.ceil(
      (now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg
              className="w-6 h-6 text-red-600 mr-3 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">
                {error || "Order not found"}
              </p>
              <button
                onClick={() => router.push("/orders")}
                className="mt-3 text-sm text-red-800 underline hover:text-red-900"
              >
                Back to Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const completionRate = calculateCompletionRate();
  const rejectRate = calculateRejectRate();
  const delayed = isDelayed();
  const delayDays = getDelayDays();

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
            <Badge
              variant={order.buyer.type === "repeat" ? "success" : "warning"}
            >
              {BUYER_TYPE_LABELS[order.buyer.type]}
            </Badge>
            {/* Show Assign button only if currentState is at_ppic */}
            {canAssign && order.currentState === "at_ppic" && (
              <Button
                onClick={() => setIsPPICModalOpen(true)}
                variant="primary"
                size="sm"
              >
                Assign Next Process
              </Button>
            )}
          </div>
        </div>

        {/* Status Bar */}
        {/* <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="info">{PHASE_LABELS[order.currentPhase]}</Badge>
                <span className="text-lg font-semibold text-gray-900">
                  {PROCESS_LABELS[order.currentProcess]}
                </span>
                <Badge variant="default">
                  {PROCESS_STATE_LABELS[order.currentState]}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Completion</p>
                <p className="text-2xl font-bold text-gray-900">
                  {completionRate}%
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            {delayed && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  ⚠️ Order delayed {delayDays} days from production deadline
                </p>
              </div>
            )}
          </CardContent>
        </Card> */}
        <DualProgressBarsFull order={order} />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex gap-8">
            {["overview", "process-steps", "transfers", "details", "qr"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab === "overview" && "Overview"}
                  {tab === "process-steps" && "Process Steps"}
                  {tab === "transfers" && "Transfers"}
                  {tab === "details" && "Details"}
                  {tab === "qr" && "Barcodes"}
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
                      {formatNumber(order.totalCompleted)}
                    </p>
                    <p className="text-xs text-gray-500">{completionRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatNumber(order.totalRejected)}
                    </p>
                    <p className="text-xs text-gray-500">{rejectRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Rework</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatNumber(order.totalRework)}
                    </p>
                    <p className="text-xs text-gray-500">pieces</p>
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
            {/* <Card>
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
            </Card> */}
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
                  <p className="text-sm text-gray-600">Production Deadline</p>
                  <p
                    className={`font-semibold ${
                      delayed ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {formatDate(order.productionDeadline)}
                    {delayed && (
                      <span className="text-xs ml-1">(+{delayDays}d)</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Delivery Deadline</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(order.deliveryDeadline)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Current Phase</p>
                  <Badge variant="info">
                    {PHASE_LABELS[order.currentPhase]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Process</p>
                  <p className="font-semibold text-gray-900">
                    {PROCESS_LABELS[order.currentProcess]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Current State</p>
                  <Badge variant="default">
                    {PROCESS_STATE_LABELS[order.currentState]}
                  </Badge>
                </div>
                {order.assignedLine && (
                  <div>
                    <p className="text-sm text-gray-600">Sewing Line</p>
                    <p className="font-semibold text-gray-900">
                      {order.assignedLine}
                    </p>
                  </div>
                )}
                {order.assignedTo && (
                  <div>
                    <p className="text-sm text-gray-600">Assigned To</p>
                    <p className="font-semibold text-gray-900">
                      {order.assignedTo}
                    </p>
                  </div>
                )}
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
                  <p className="text-sm text-gray-600 mb-2">Type</p>
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
                    {order.buyer.leftoverPolicy?.canReuse
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

      {activeTab === "transfers" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Surat Jalan / Transfer Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Riwayat perpindahan antar proses dengan detail lengkap termasuk
                reject dan durasi.
              </p>
              <TransferLogList orderId={order.id} />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "details" && (
        <div className="space-y-6">
          {/* Full Size Breakdown dengan detail */}
          <Card>
            <CardHeader>
              <CardTitle>Size Breakdown Details</CardTitle>
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
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.sizeBreakdown.map((size) => (
                      <tr key={size.size} className="border-b border-gray-100">
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
                          {size.quantity > 0
                            ? Math.round((size.completed / size.quantity) * 100)
                            : 0}
                          %
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-gray-50">
                      <td className="py-3 px-4">Total</td>
                      <td className="py-3 px-4 text-right">
                        {order.totalQuantity}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600">
                        {order.totalCompleted}
                      </td>
                      <td className="py-3 px-4 text-right text-red-600">
                        {order.totalRejected}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {order.sizeBreakdown.reduce(
                          (sum, s) => sum + (s.bundleCount || 0),
                          0
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {completionRate}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Material Status */}
          <Card>
            <CardHeader>
              <CardTitle>Material & Production Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">
                  Materials Issued
                </span>
                {order.materialsIssued ? (
                  <Badge variant="success">✓ Issued</Badge>
                ) : (
                  <Badge variant="warning">Pending</Badge>
                )}
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">Has Leftover</span>
                {order.hasLeftover ? (
                  <Badge variant="info">Yes</Badge>
                ) : (
                  <Badge variant="default">No</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Complete Buyer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Buyer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                <p className="text-sm text-gray-600 mb-2">Type</p>
                <Badge
                  variant={
                    order.buyer.type === "repeat" ? "success" : "warning"
                  }
                >
                  {BUYER_TYPE_LABELS[order.buyer.type]}
                </Badge>
              </div>
              {order.buyer.contactPerson && (
                <div>
                  <p className="text-sm text-gray-600">Contact Person</p>
                  <p className="font-semibold text-gray-900">
                    {order.buyer.contactPerson}
                  </p>
                  {order.buyer.phone && (
                    <p className="text-sm text-gray-600">{order.buyer.phone}</p>
                  )}
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 mb-2">Leftover Policy</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    {order.buyer.leftoverPolicy?.canReuse ? (
                      <span className="text-green-600">✓ Can be reused</span>
                    ) : (
                      <span className="text-red-600">✗ Cannot be reused</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    {order.buyer.leftoverPolicy?.returRequired ? (
                      <span className="text-orange-600">⚠ Return required</span>
                    ) : (
                      <span className="text-gray-600">No return required</span>
                    )}
                  </div>
                  {order.buyer.leftoverPolicy?.storageLocation && (
                    <div>
                      <p className="text-gray-600">
                        Storage: {order.buyer.leftoverPolicy.storageLocation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Complete Style Info */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Style Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Style Code</p>
                <p className="font-semibold text-gray-900">
                  {order.style.styleCode}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold text-gray-900">
                  {order.style.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-semibold text-gray-900 capitalize">
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
              {(order.style.estimatedCuttingTime ||
                order.style.estimatedSewingTime) && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Estimated Times</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {order.style.estimatedCuttingTime && (
                      <div>
                        <p className="text-gray-600">Cutting</p>
                        <p className="font-semibold">
                          {order.style.estimatedCuttingTime} min
                        </p>
                      </div>
                    )}
                    {order.style.estimatedSewingTime && (
                      <div>
                        <p className="text-gray-600">Sewing</p>
                        <p className="font-semibold">
                          {order.style.estimatedSewingTime} min/pc
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "qr" && (
        <div className="space-y-6">
          {/* QR Code Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Barcode Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!qrCodes ? (
                  <div className="text-center py-8">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                    <p className="text-gray-600 mb-4">
                      No Barcodes generated yet
                    </p>
                    <Button
                      onClick={handleGenerateQR}
                      variant="primary"
                      disabled={isGeneratingQR}
                    >
                      {isGeneratingQR ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        "Generate Barcodes"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <Button
                        onClick={handleGenerateQR}
                        variant="outline"
                        size="sm"
                        disabled={isGeneratingQR}
                      >
                        {isGeneratingQR
                          ? "Regenerating..."
                          : "Regenerate Barcode"}
                      </Button>
                      <Button
                        onClick={() => handlePrintQR("all")}
                        variant="primary"
                        size="sm"
                      >
                        Print All Barcodes
                      </Button>
                    </div>

                    {/* Order QR Code */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Order Barcode
                      </h3>
                      <BarcodeDisplay
                        barcodeValue={qrCodes.orderQR.qrCode}
                        title={order.orderNumber}
                        subtitle={`${order.buyer.name} - ${order.style.name}`}
                        type="order"
                      />
                    </div>

                    {/* Bundle Barcodes */}
                    {qrCodes.bundleQRs && qrCodes.bundleQRs.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Bundle Barcodes ({qrCodes.bundleQRs.length})
                          </h3>
                          <Button
                            onClick={() => handlePrintQR("bundle")}
                            variant="outline"
                            size="sm"
                          >
                            Print Bundle Barcodes
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {qrCodes.bundleQRs.map((bundleQR: any) => {
                            const bundle = (order as any).bundles?.find(
                              (b: any) => b.qrCode?.id === bundleQR.id
                            );
                            return (
                              <BarcodeDisplay
                                key={bundleQR.id}
                                barcodeValue={bundleQR.qrCode}
                                title={bundle?.bundleNumber || bundleQR.qrCode}
                                subtitle={
                                  bundle
                                    ? `Size ${bundle.size} - ${bundle.quantity} pcs`
                                    : undefined
                                }
                                type="bundle"
                                // size={150}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "process-steps" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Process Flow Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Track each process step from PPIC through completion. Each step
                shows detailed timestamps and state transitions.
              </p>
              <div className="space-y-4">
                {processSteps.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No process steps found</p>
                  </div>
                ) : (
                  processSteps.map((step) => (
                    <ProcessStepCard
                      key={step.id}
                      processStep={step}
                      onUpdate={loadOrderData}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* PPIC Assignment Modal */}
      <PPICAssignmentModal
        isOpen={isPPICModalOpen}
        onClose={() => setIsPPICModalOpen(false)}
        orderId={order.id}
        currentProcess={order.currentProcess}
        onSuccess={handleUpdate}
      />
    </div>
  );
}
