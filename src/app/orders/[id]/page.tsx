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
  const canEdit = checkPermission("canEditOrder");
  const canAssign = checkPermission("canAssignProcess");
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
        <div className="flex items-center justify-center min-h-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Memuat detail order...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
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
              <p className="text-sm font-medium text-red-600">Error</p>
              <p className="text-sm text-red-600 mt-1">
                {error || "Order not found"}
              </p>
              <button
                onClick={() => router.push("/orders")}
                className="mt-3 text-sm text-red-600 underline hover:text-red-600"
              >
                Kembali ke order
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
            className="text-muted-foreground hover:text-foreground"
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
            <h1 className="text-3xl font-bold text-foreground">
              {order.orderNumber}
            </h1>
            <p className="text-muted-foreground mt-1">
              {order.buyer.name} - {order.style.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={order.buyer.type === "repeat" ? "success" : "warning"}
            >
              {BUYER_TYPE_LABELS[order.buyer.type]}
            </Badge>
            {canAssign && order.currentState === "at_ppic" && (
              <Button
                onClick={() => setIsPPICModalOpen(true)}
                variant="primary"
                size="sm"
              >
                Assign ke Process Selanjutnya
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
        <div className="border-b border-border">
          <nav className="flex gap-8">
            {["overview", "process-steps", "transfers", "details", "qr"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {tab === "overview" && "Overview"}
                  {tab === "process-steps" && "Tahapan Proses"}
                  {tab === "transfers" && "Pemindahan"}
                  {tab === "details" && "Detail"}
                  {tab === "qr" && "Barcode"}
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
                    <p className="text-sm text-muted-foreground mb-1">
                      Jumlah Total
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatNumber(order.totalQuantity)}
                    </p>
                    <p className="text-xs text-muted-foreground">pieces</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Completed
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatNumber(order.totalCompleted)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {completionRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Rejected
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatNumber(order.totalRejected)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rejectRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Rework</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatNumber(order.totalRework)}
                    </p>
                    <p className="text-xs text-muted-foreground">pieces</p>
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
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground">
                          Size
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-foreground">
                          Quantity
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-foreground">
                          Completed
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-foreground">
                          Rejected
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-foreground">
                          Bundles
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-foreground">
                          Progress
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.sizeBreakdown.map((size) => (
                        <tr key={size.size} className="border-b border-border">
                          <td className="py-3 px-4 font-medium text-foreground">
                            {size.size}
                          </td>
                          <td className="py-3 px-4 text-right text-foreground">
                            {size.quantity}
                          </td>
                          <td className="py-3 px-4 text-right text-green-600 font-medium">
                            {size.completed}
                          </td>
                          <td className="py-3 px-4 text-right text-red-600 font-medium">
                            {size.rejected}
                          </td>
                          <td className="py-3 px-4 text-right text-foreground">
                            {size.bundleCount || 0}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-muted rounded-full h-2">
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
                              <span className="text-sm text-muted-foreground w-10 text-right">
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
                <CardTitle>Informasi Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Order</p>
                  <p className="font-semibold text-foreground">
                    {formatDate(order.orderDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tanggal Mulai Produksi
                  </p>
                  {order.productionStartedAt ? (
                    <div>
                      <p className="font-semibold text-blue-600">
                        {formatDate(new Date(order.productionStartedAt))}{" "}
                      </p>
                    </div>
                  ) : (
                    <Badge
                      variant="info"
                      className="mt-1 bg-muted text-muted-foreground border-border"
                    >
                      Order Belum Dimulai
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Batas Waktu Produksi
                  </p>
                  <p
                    className={`font-semibold ${
                      delayed ? "text-red-600" : "text-foreground"
                    }`}
                  >
                    {formatDate(order.productionDeadline)}
                    {delayed && (
                      <span className="text-xs ml-1">(+{delayDays}d)</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Batas Waktu Pengiriman
                  </p>
                  <p className="font-semibold text-foreground">
                    {formatDate(order.deliveryDeadline)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Fase Sekarang
                  </p>
                  <Badge variant="info">
                    {PHASE_LABELS[order.currentPhase]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Proses Sekarang
                  </p>
                  <p className="font-semibold text-foreground">
                    {PROCESS_LABELS[order.currentProcess]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    State Sekarang
                  </p>
                  <Badge variant="default">
                    {PROCESS_STATE_LABELS[order.currentState]}
                  </Badge>
                </div>
                {order.assignedLine && (
                  <div>
                    <p className="text-sm text-muted-foreground">Sewing Line</p>
                    <p className="font-semibold text-foreground">
                      {order.assignedLine}
                    </p>
                  </div>
                )}
                {order.assignedTo && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Ditugaskan ke
                    </p>
                    <p className="font-semibold text-foreground">
                      {order.assignedTo}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Dibuat oleh</p>
                  <p className="font-semibold text-foreground">
                    {order.createdBy}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Terakhir Diperbarui
                  </p>
                  <p className="font-semibold text-foreground">
                    {formatDateTime(order.updatedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Buyer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Buyer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nama</p>
                  <p className="font-semibold text-foreground">
                    {order.buyer.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Artikel</p>
                  <p className="font-semibold text-foreground">
                    {order.article}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kokde</p>
                  <p className="font-semibold text-foreground">
                    {order.buyer.code}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Tipe</p>
                  <Badge
                    variant={
                      order.buyer.type === "repeat" ? "success" : "warning"
                    }
                  >
                    {BUYER_TYPE_LABELS[order.buyer.type]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Aturan Pengembalian
                  </p>
                  <p className="text-sm text-foreground">
                    {order.buyer.leftoverPolicy?.canReuse
                      ? "✓ Can be reused"
                      : "✗ Must be returned"}
                  </p>
                </div>
                {order.buyer.contactPerson && (
                  <div>
                    <p className="text-sm text-muted-foreground">Kontak</p>
                    <p className="font-semibold text-foreground">
                      {order.buyer.contactPerson}
                    </p>
                    {order.buyer.phone && (
                      <p className="text-sm text-muted-foreground">
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
                <CardTitle>Informasi Style</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Kode Style</p>
                  <p className="font-semibold text-foreground">
                    {order.style.styleCode}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kategori</p>
                  <p className="font-semibold text-foreground">
                    {GARMENT_CATEGORIES[order.style.category]}
                  </p>
                </div>
                {order.style.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Deskripsi</p>
                    <p className="text-sm text-foreground">
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
                  <CardTitle>Catatan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground">{order.notes}</p>
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
              <p className="text-sm text-muted-foreground mb-4">
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
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">
                        Size
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">
                        Quantity
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">
                        Completed
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">
                        Rejected
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">
                        Bundles
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.sizeBreakdown.map((size) => (
                      <tr key={size.size} className="border-b border-border">
                        <td className="py-3 px-4 font-medium text-foreground">
                          {size.size}
                        </td>
                        <td className="py-3 px-4 text-right text-foreground">
                          {size.quantity}
                        </td>
                        <td className="py-3 px-4 text-right text-green-600 font-medium">
                          {size.completed}
                        </td>
                        <td className="py-3 px-4 text-right text-red-600 font-medium">
                          {size.rejected}
                        </td>
                        <td className="py-3 px-4 text-right text-foreground">
                          {size.bundleCount || 0}
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">
                          {size.quantity > 0
                            ? Math.round((size.completed / size.quantity) * 100)
                            : 0}
                          %
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-muted">
                      <td className="py-3 px-4 text-muted-foreground">Total</td>
                      <td className="py-3 px-4 text-muted-foreground text-right">
                        {order.totalQuantity}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600">
                        {order.totalCompleted}
                      </td>
                      <td className="py-3 px-4 text-right text-red-600">
                        {order.totalRejected}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-right">
                        {order.sizeBreakdown.reduce(
                          (sum, s) => sum + (s.bundleCount || 0),
                          0
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-right">
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
              <CardTitle>Status Bahan & Produksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="font-medium text-foreground">
                  Materials Issued
                </span>
                {order.materialsIssued ? (
                  <Badge variant="success">✓ Issued</Badge>
                ) : (
                  <Badge variant="warning">Pending</Badge>
                )}
              </div>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="font-medium text-foreground">
                  Pengembalian
                </span>
                {order.hasLeftover ? (
                  <Badge variant="info">Ya</Badge>
                ) : (
                  <Badge variant="default">Tidak</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Complete Buyer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Buyer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Nama</p>
                <p className="font-semibold text-foreground">
                  {order.buyer.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kode</p>
                <p className="font-semibold text-foreground">
                  {order.buyer.code}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tipe</p>
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
                  <p className="text-sm text-muted-foreground">Kontak</p>
                  <p className="font-semibold text-foreground">
                    {order.buyer.contactPerson}
                  </p>
                  {order.buyer.phone && (
                    <p className="text-sm text-muted-foreground">
                      {order.buyer.phone}
                    </p>
                  )}
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Aturan Pengembalian
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    {order.buyer.leftoverPolicy?.canReuse ? (
                      <span className="text-green-600">
                        ✓ Bisa digunakan ulang
                      </span>
                    ) : (
                      <span className="text-red-600">
                        ✗ Tidak bisa digunakan ulang
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    {order.buyer.leftoverPolicy?.returRequired ? (
                      <span className="text-orange-600">
                        ⚠ Perlu pengembalian
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Tidak perlu pengembalian
                      </span>
                    )}
                  </div>
                  {order.buyer.leftoverPolicy?.storageLocation && (
                    <div>
                      <p className="text-muted-foreground">
                        Penyimpanan:{" "}
                        {order.buyer.leftoverPolicy.storageLocation}
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
              <CardTitle>Informasi Style</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Kode Style</p>
                <p className="font-semibold text-foreground">
                  {order.style.styleCode}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nama</p>
                <p className="font-semibold text-foreground">
                  {order.style.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kategori</p>
                <p className="font-semibold text-foreground capitalize">
                  {GARMENT_CATEGORIES[order.style.category]}
                </p>
              </div>
              {order.style.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Deskripsi</p>
                  <p className="text-sm text-foreground">
                    {order.style.description}
                  </p>
                </div>
              )}
              {(order.style.estimatedCuttingTime ||
                order.style.estimatedSewingTime) && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Estimasi Waktu
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {order.style.estimatedCuttingTime && (
                      <div>
                        <p className="text-muted-foreground">Cutting</p>
                        <p className="font-semibold text-muted-foreground">
                          {order.style.estimatedCuttingTime} min
                        </p>
                      </div>
                    )}
                    {order.style.estimatedSewingTime && (
                      <div>
                        <p className="text-muted-foreground">Sewing</p>
                        <p className="font-semibold text-muted-foreground">
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
              <CardTitle>Manajemen Barcode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!qrCodes ? (
                  <div className="text-center py-8">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-muted-foreground"
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
                    <p className="text-muted-foreground mb-4">
                      Belum ada barcode dibuat
                    </p>
                    <Button
                      onClick={handleGenerateQR}
                      variant="primary"
                      disabled={isGeneratingQR}
                    >
                      {isGeneratingQR ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Dibuat...
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
                        Cetak Semua Barcode
                      </Button>
                    </div>

                    {/* Order QR Code */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">
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
                          <h3 className="text-lg font-semibold text-foreground">
                            Bundle Barcode ({qrCodes.bundleQRs.length})
                          </h3>
                          <Button
                            onClick={() => handlePrintQR("bundle")}
                            variant="outline"
                            size="sm"
                          >
                            Cetak Bundle Barcode
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
              <CardTitle>Pelacakan Alur Proses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Pantau setiap langkah proses dari PPIC hingga selesai, lengkap
                dengan detail waktu dan perubahan status.
              </p>
              <div className="space-y-4">
                {processSteps.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Tidak ada proses ditemukan</p>
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
