// src/app/qr/scanner/page.tsx - COMPLETE VERSION
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  Package,
  FileText,
  ArrowRight,
  CheckCircle,
  Calendar,
  Layers,
  TrendingUp,
  AlertTriangle,
  X,
  Camera,
} from "lucide-react";

interface ScannedData {
  type: "order" | "bundle";
  qrCode: string;
  order?: any;
  bundle?: any;
}

export default function QRScannerPage() {
  const router = useRouter();
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [currentUser, setCurrentUser] = useState<{
    name: string;
    department: string;
  } | null>(null);

  const loadCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const result = await response.json();

      if (result.success && result.user) {
        setCurrentUser({
          name: result.user.name,
          department: result.user.department,
        });
      } else {
        // Default fallback if auth not implemented yet
        setCurrentUser({
          name: "Anonymous User",
          department: "Production Floor",
        });
      }
    } catch (err) {
      console.error("Error loading user:", err);
      // Fallback
      setCurrentUser({
        name: "Anonymous User",
        department: "Production Floor",
      });
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const handleScanSuccess = async (decodedText: string) => {
    setIsLoading(true);
    setError("");

    if (!currentUser) {
      await loadCurrentUser();
    }

    try {
      const response = await fetch("/api/qr/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: decodedText,
          scannedBy: currentUser?.name || "Unknown User",
          location: currentUser?.department || "Production Floor",
          action: "view",
          deviceInfo: navigator.userAgent,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setScannedData(result.data);
        setIsModalOpen(true);
        setError("");
      } else {
        // User-friendly error messages
        if (
          result.error.includes("not found") ||
          result.error.includes("Not found")
        ) {
          setError(
            `❌ Barcode tidak ditemukan di sistem.\n\nCode: ${decodedText}\n\nPastikan barcode sudah di-generate untuk order ini.`
          );
        } else if (result.error.includes("Invalid barcode format")) {
          setError(
            `❌ Format barcode tidak valid.\n\nCode: ${decodedText}\n\n${
              result.hint ||
              "Format yang benar:\n• Order: ORD-2025-00001\n• Bundle: ORD-2025-00001-M-001"
            }`
          );
        } else {
          setError(result.error || "Failed to scan barcode");
        }
      }
    } catch (err) {
      console.error("Scan error:", err);
      setError(
        "❌ Gagal memproses barcode.\n\nPastikan koneksi internet Anda stabil dan coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = () => {
    if (scannedData?.type === "order" && scannedData.order) {
      router.push(`/orders/${scannedData.order.id}`);
    } else if (scannedData?.type === "bundle" && scannedData.bundle) {
      router.push(
        `/orders/${scannedData.bundle.orderId}?tab=details#bundle-${scannedData.bundle.id}`
      );
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Camera className="w-8 h-8 text-blue-600" />
              Barcode Scanner
            </h1>
            <p className="text-gray-600 mt-1">
              Scan barcodes untuk tracking orders dan bundles
            </p>
            {currentUser && (
              <p className="text-sm text-gray-500 mt-1">
                Logged in as:{" "}
                <span className="font-semibold">{currentUser.name}</span> (
                {currentUser.department})
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner - Left Column (Larger) */}
        <div className="lg:col-span-2">
          <BarcodeScanner
            onScanSuccess={handleScanSuccess}
            onScanError={(err) => setError(err)}
          />

          {/* Error Display */}
          {error && (
            <div className="mt-6 bg-red-50 border-2 border-red-300 rounded-xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="bg-red-100 rounded-full p-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-900 mb-2">
                    Scan Error
                  </h3>
                  <pre className="text-sm text-red-800 whitespace-pre-wrap font-medium">
                    {error}
                  </pre>
                  <button
                    onClick={() => setError("")}
                    className="mt-4 text-sm text-red-800 font-bold underline hover:text-red-900"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="mt-6 bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-3 border-blue-600"></div>
                <div>
                  <p className="font-bold text-blue-900">
                    Processing Barcode...
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Fetching data from database
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Panel - Right Column */}
        <div className="space-y-6">
          {/* Quick Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Quick Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                <p className="font-bold text-blue-900 mb-2">📦 Order Barcode</p>
                <p className="text-blue-800 mb-1 font-mono text-xs">
                  ORD202400001
                </p>
                <p className="text-blue-700 text-xs">
                  Shows complete order information
                </p>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                <p className="font-bold text-green-900 mb-2">
                  📦 Bundle Barcode
                </p>
                <p className="text-green-800 mb-1 font-mono text-xs">
                  ORD202400001M001
                </p>
                <p className="text-green-700 text-xs">
                  Shows bundle details and tracking
                </p>
              </div>

              <div className="pt-4 border-t-2 border-gray-200">
                <p className="font-bold text-gray-900 mb-2">
                  Available Actions:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    View full details
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Track progress
                  </li>
                  <li className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    See process steps
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Supported Formats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Supported Formats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                <span className="font-semibold text-gray-700">QR Code</span>
                <Badge variant="success" size="sm">
                  ✓
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                <span className="font-semibold text-gray-700">Code 128</span>
                <Badge variant="success" size="sm">
                  ✓
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                <span className="font-semibold text-gray-700">EAN / UPC</span>
                <Badge variant="success" size="sm">
                  ✓
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ✅ IMPROVED: Scanned Data Modal - Better Design */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Scan Result"
        size="lg"
      >
        {scannedData && (
          <div className="space-y-6">
            {/* Header dengan Type Badge */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200">
              <div className="flex items-center gap-3">
                {scannedData.type === "order" ? (
                  <div className="bg-blue-100 rounded-full p-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                ) : (
                  <div className="bg-green-100 rounded-full p-3">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                )}
                <div>
                  <Badge
                    variant={scannedData.type === "order" ? "info" : "success"}
                    className="text-base px-4 py-2 mb-1"
                  >
                    {scannedData.type === "order" ? "📋 Order" : "📦 Bundle"}
                  </Badge>
                  <p className="font-mono text-xs text-gray-600 mt-1">
                    {scannedData.qrCode}
                  </p>
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            {/* Order Info */}
            {scannedData.order && (
              <div className="bg-linear-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-5">
                <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Order Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-blue-700 font-semibold mb-1">
                      Order Number
                    </p>
                    <p className="font-bold text-blue-900 text-lg">
                      {scannedData.order.orderNumber}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-blue-700 font-semibold mb-1">Status</p>
                    <Badge variant="info" size="sm">
                      {scannedData.order.currentProcess}
                    </Badge>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-blue-700 font-semibold mb-1">Buyer</p>
                    <p className="font-bold text-blue-900">
                      {scannedData.order.buyer.name}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-blue-700 font-semibold mb-1">Style</p>
                    <p className="font-bold text-blue-900">
                      {scannedData.order.style.name}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-blue-700 font-semibold mb-1">
                      Total Quantity
                    </p>
                    <p className="font-bold text-blue-900 text-lg">
                      {scannedData.order.totalQuantity} pcs
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-blue-700 font-semibold mb-1">
                      Completed
                    </p>
                    <p className="font-bold text-green-600 text-lg">
                      {scannedData.order.totalCompleted} pcs
                    </p>
                  </div>
                  <div className="col-span-2 bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-blue-700 font-semibold mb-2">Deadline</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <p className="font-bold text-blue-900">
                        {formatDate(scannedData.order.productionDeadline)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bundle Info */}
            {scannedData.bundle && (
              <div className="bg-linear-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5">
                <h4 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Bundle Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-green-700 font-semibold mb-1">
                      Bundle Number
                    </p>
                    <p className="font-bold text-green-900 text-lg">
                      {scannedData.bundle.bundleNumber}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-green-700 font-semibold mb-1">Size</p>
                    <Badge variant="success" size="sm" className="text-base">
                      {scannedData.bundle.size}
                    </Badge>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-green-700 font-semibold mb-1">
                      Quantity
                    </p>
                    <p className="font-bold text-green-900 text-lg">
                      {scannedData.bundle.quantity} pcs
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-green-700 font-semibold mb-1">Status</p>
                    <Badge variant="success" size="sm">
                      {scannedData.bundle.currentStatus}
                    </Badge>
                  </div>
                  <div className="col-span-2 bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-green-700 font-semibold mb-2">
                      Current Location
                    </p>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-green-600" />
                      <p className="font-bold text-green-900">
                        {scannedData.bundle.currentLocation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
              <Button
                variant="primary"
                onClick={handleViewDetails}
                className="flex-1"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                View Full Details
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
