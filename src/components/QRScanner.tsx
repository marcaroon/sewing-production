// components/QRScanner.tsx

"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  fps?: number;
  qrbox?: number;
  aspectRatio?: number;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onScanError,
  fps = 10,
  qrbox = 250,
  aspectRatio = 1,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string>("");
  const [manualCode, setManualCode] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = "qr-reader";

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current && isScanning) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear();
          })
          .catch((err) => {
            console.error("Error stopping scanner:", err);
          });
      }
    };
  }, [isScanning]);

  const startScanning = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerDivId);
      }

      const config = {
        fps,
        qrbox,
        aspectRatio,
      };

      await scannerRef.current.start(
        { facingMode: "environment" }, // Use back camera
        config,
        (decodedText) => {
          // Prevent duplicate scans
          if (decodedText !== lastScan) {
            setLastScan(decodedText);
            onScanSuccess(decodedText);
          }
        },
        (errorMessage) => {
          // Ignore common errors
          if (!errorMessage.includes("NotFoundException")) {
            console.warn("QR Scan error:", errorMessage);
          }
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      if (onScanError) {
        onScanError("Failed to start camera. Please check permissions.");
      }
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim());
      setManualCode("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>QR Code Scanner</CardTitle>
          <Badge variant={isScanning ? "success" : "default"}>
            {isScanning ? "Scanning..." : "Stopped"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scanner Area */}
        <div className="relative">
          <div
            id={scannerDivId}
            className={`w-full ${!isScanning ? "hidden" : ""}`}
          />

          {!isScanning && (
            <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg p-12 border-2 border-dashed border-gray-300">
              <svg
                className="w-24 h-24 text-gray-400 mb-4"
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
              <p className="text-gray-600 text-center mb-4">
                Click "Start Scanning" to activate camera
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!isScanning ? (
            <Button
              onClick={startScanning}
              variant="primary"
              className="flex-1"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Start Scanning
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="danger" className="flex-1">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
              Stop Scanning
            </Button>
          )}
        </div>

        {/* Manual Input */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Or enter code manually:
          </p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="ORD-2024-00001-M-001"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <Button type="submit" variant="primary">
              Submit
            </Button>
          </form>
        </div>

        {/* Last Scan Info */}
        {lastScan && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-800 mb-1">Last Scanned:</p>
            <p className="font-mono text-sm font-bold text-green-900">
              {lastScan}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
