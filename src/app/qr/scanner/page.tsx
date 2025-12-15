// app/qr/scanner/page.tsx

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

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

  const handleScanSuccess = async (decodedText: string) => {
    setIsLoading(true);
    setError("");

    try {
      // Call scan API
      const response = await fetch("/api/qr/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qrCode: decodedText,
          scannedBy: "Scanner User", // TODO: Get from auth
          location: "Production Floor", // TODO: Get from device/user
          action: "view",
          deviceInfo: navigator.userAgent,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setScannedData(result.data);
        setIsModalOpen(true);
      } else {
        setError(result.error || "Failed to scan QR code");
      }
    } catch (err) {
      console.error("Scan error:", err);
      setError("Failed to process QR code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = () => {
    if (scannedData?.type === "order" && scannedData.order) {
      router.push(`/orders/${scannedData.order.id}`);
    } else if (scannedData?.type === "bundle" && scannedData.bundle) {
      router.push(
        `/orders/${scannedData.bundle.orderId}?tab=bundles&bundle=${scannedData.bundle.id}`
      );
    }
  };

  const handleTransfer = () => {
    // Navigate to transfer page with scanned data
    if (scannedData?.type === "bundle" && scannedData.bundle) {
      router.push(`/transfers/new?bundleId=${scannedData.bundle.id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push("/")}
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">QR Scanner</h1>
            <p className="text-gray-600 mt-1">
              Scan QR codes to track orders and bundles
            </p>
          </div>
        </div>
      </div>

      {/* Scanner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BarcodeScanner
            onScanSuccess={handleScanSuccess}
            onScanError={(err) => setError(err)}
          />

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-red-600 mr-3 mt-0.5"
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
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3" />
                <p className="text-sm text-blue-800">Processing QR code...</p>
              </div>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-gray-900 mb-1">
                  📦 Order QR Code
                </p>
                <p className="text-gray-600">
                  Format: ORD-2024-00001
                  <br />
                  Shows complete order information
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-900 mb-1">
                  📦 Bundle QR Code
                </p>
                <p className="text-gray-600">
                  Format: ORD-2024-00001-M-001
                  <br />
                  Shows bundle details and tracking
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="font-medium text-gray-900 mb-2">Actions:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>View details</li>
                  <li>Transfer to department</li>
                  <li>QC check</li>
                  <li>Complete process</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scanned Data Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Scanned QR Code"
        size="lg"
      >
        {scannedData && (
          <div className="space-y-6">
            {/* Type Badge */}
            <div className="flex items-center justify-between">
              <Badge
                variant={scannedData.type === "order" ? "info" : "success"}
                className="text-base px-4 py-2"
              >
                {scannedData.type === "order" ? "📋 Order" : "📦 Bundle"}
              </Badge>
              <p className="font-mono text-sm text-gray-600">
                {scannedData.qrCode}
              </p>
            </div>

            {/* Order Info */}
            {scannedData.order && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Order Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Order Number</p>
                    <p className="font-semibold text-gray-900">
                      {scannedData.order.orderNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className="font-semibold text-gray-900">
                      {scannedData.order.currentStatus}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Buyer</p>
                    <p className="font-semibold text-gray-900">
                      {scannedData.order.buyer.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Style</p>
                    <p className="font-semibold text-gray-900">
                      {scannedData.order.style.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Quantity</p>
                    <p className="font-semibold text-gray-900">
                      {scannedData.order.totalQuantity} pcs
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bundle Info */}
            {scannedData.bundle && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Bundle Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Bundle Number</p>
                    <p className="font-semibold text-gray-900">
                      {scannedData.bundle.bundleNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Size</p>
                    <p className="font-semibold text-gray-900">
                      {scannedData.bundle.size}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Quantity</p>
                    <p className="font-semibold text-gray-900">
                      {scannedData.bundle.quantity} pcs
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Current Location</p>
                    <p className="font-semibold text-gray-900">
                      {scannedData.bundle.currentLocation}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className="font-semibold text-gray-900">
                      {scannedData.bundle.currentStatus}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                onClick={handleViewDetails}
                className="flex-1"
              >
                View Full Details
              </Button>
              {scannedData.type === "bundle" && (
                <Button
                  variant="outline"
                  onClick={handleTransfer}
                  className="flex-1"
                >
                  Transfer
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
