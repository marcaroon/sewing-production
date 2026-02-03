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
          qrCode: decodedText,
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
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Camera className="w-8 h-8 text-info" />
              Barcode Scanner
            </h1>
            <p className="text-muted-foreground mt-1">
              Scan barcodes untuk tracking orders dan bundles
            </p>
            {currentUser && (
              <p className="text-sm text-muted-foreground mt-1">
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
            <div className="mt-6 bg-destructive/10 border-2 border-destructive/40 rounded-xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="bg-destructive/15 rounded-full p-3">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-destructive mb-2">
                    Scan Error
                  </h3>
                  <pre className="text-sm text-destructive/80 whitespace-pre-wrap font-medium">
                    {error}
                  </pre>
                  <button
                    onClick={() => setError("")}
                    className="mt-4 text-sm text-destructive font-bold underline hover:text-destructive/80"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="mt-6 bg-info/10 border-2 border-info/40 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-3 border-info"></div>
                <div>
                  <p className="font-bold text-info">Processing Barcode...</p>
                  <p className="text-sm text-info/80 mt-1">
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
                <FileText className="w-5 h-5 text-info" />
                Quick Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="bg-info/10 border-2 border-info/30 rounded-lg p-3">
                <p className="font-bold text-info mb-2">Order Barcode</p>
                <p className="text-info mb-1 font-mono text-xs">ORD202400001</p>
                <p className="text-info/80 text-xs">
                  Shows complete order information
                </p>
              </div>

              <div className="bg-success/10 border-2 border-success/30 rounded-lg p-3">
                <p className="font-bold text-success mb-2">Bundle Barcode</p>
                <p className="text-success mb-1 font-mono text-xs">
                  ORD202400001M001
                </p>
                <p className="text-success/80 text-xs">
                  Shows bundle details and tracking
                </p>
              </div>

              <div className="pt-4 border-t-2 border-border">
                <p className="font-bold text-foreground mb-2">
                  Available Actions:
                </p>
                <ul className="space-y-2 text-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    View full details
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-info" />
                    Track progress
                  </li>
                  <li className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple" />
                    See process steps
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Scan Result"
        size="lg"
      >
        {scannedData && (
          <div className="space-y-6">
            {/* Header dengan Type Badge */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-border">
              <div className="flex items-center gap-3">
                {scannedData.type === "order" ? (
                  <div className="bg-blue-500/15 rounded-full p-3">
                    <FileText className="w-6 h-6 text-info" />
                  </div>
                ) : (
                  <div className="bg-green-500/15 rounded-full p-3">
                    <Package className="w-6 h-6 text-success" />
                  </div>
                )}
                <div>
                  <Badge
                    variant={scannedData.type === "order" ? "info" : "success"}
                    className="text-base px-4 py-2 mb-1"
                  >
                    {scannedData.type === "order" ? "📋 Order" : "📦 Bundle"}
                  </Badge>
                  <p className="font-mono text-xs text-muted-foreground mt-1">
                    {scannedData.qrCode}
                  </p>
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>

            {/* Order Info */}
            {scannedData.order && (
              <div className="bg-info/10 border-2 border-info/40 rounded-xl p-5">
                <h4 className="font-bold text-info mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Order Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-card rounded-lg p-3 border border-info/30">
                    <p className="text-info font-semibold mb-1">Order Number</p>
                    <p className="font-bold text-info text-lg">
                      {scannedData.order.orderNumber}
                    </p>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-info/30">
                    <p className="text-info font-semibold mb-1">Status</p>
                    <Badge variant="info" size="sm">
                      {scannedData.order.currentProcess}
                    </Badge>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-info/30">
                    <p className="text-info font-semibold mb-1">Buyer</p>
                    <p className="font-bold text-info">
                      {scannedData.order.buyer.name}
                    </p>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-info/30">
                    <p className="text-info font-semibold mb-1">Style</p>
                    <p className="font-bold text-info">
                      {scannedData.order.style.name}
                    </p>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-info/30">
                    <p className="text-info font-semibold mb-1">
                      Total Quantity
                    </p>
                    <p className="font-bold text-info text-lg">
                      {scannedData.order.totalQuantity} pcs
                    </p>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-info/30">
                    <p className="text-info font-semibold mb-1">Completed</p>
                    <p className="font-bold text-success text-lg">
                      {scannedData.order.totalCompleted} pcs
                    </p>
                  </div>
                  <div className="col-span-2 bg-card rounded-lg p-3 border border-info/30">
                    <p className="text-info font-semibold mb-2">Deadline</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-info" />
                      <p className="font-bold text-info">
                        {formatDate(scannedData.order.productionDeadline)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bundle Info */}
            {scannedData.bundle && (
              <div className="bg-success/10 border-2 border-success/40 rounded-xl p-5">
                <h4 className="font-bold text-success mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Bundle Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-card rounded-lg p-3 border border-success/30">
                    <p className="text-success font-semibold mb-1">
                      Bundle Number
                    </p>
                    <p className="font-bold text-success text-lg">
                      {scannedData.bundle.bundleNumber}
                    </p>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-success/30">
                    <p className="text-success font-semibold mb-1">Size</p>
                    <Badge variant="success" size="sm" className="text-base">
                      {scannedData.bundle.size}
                    </Badge>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-success/30">
                    <p className="text-success font-semibold mb-1">Quantity</p>
                    <p className="font-bold text-success text-lg">
                      {scannedData.bundle.quantity} pcs
                    </p>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-success/30">
                    <p className="text-success font-semibold mb-1">Status</p>
                    <Badge variant="success" size="sm">
                      {scannedData.bundle.currentStatus}
                    </Badge>
                  </div>
                  <div className="col-span-2 bg-card rounded-lg p-3 border border-success/30">
                    <p className="text-success font-semibold mb-2">
                      Current Location
                    </p>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-success" />
                      <p className="font-bold text-success">
                        {scannedData.bundle.currentLocation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t-2 border-border">
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
