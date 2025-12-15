// src/components/BarcodeScanner.tsx - FIXED VERSION
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Camera, X, CheckCircle } from "lucide-react";

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  fps?: number;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanSuccess,
  onScanError,
  fps = 10,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [lastScan, setLastScan] = useState<string>("");
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string>("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);
  const scannerDivId = "barcode-reader";

  // ✅ Track component mounted state
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      cleanupScanner();
    };
  }, []);

  // ✅ FIXED: Cleanup function yang benar
  const cleanupScanner = async () => {
    if (scannerRef.current) {
      const scanner = scannerRef.current;

      try {
        const state = scanner.getState();

        if (state === 2) {
          // SCANNING state
          try {
            await scanner.stop();
          } catch (stopError) {
            // Ignore stop errors during cleanup
            console.warn("Stop error (can be ignored):", stopError);
          }
        }

        // ✅ FIX: clear() bukan Promise, jadi tidak perlu await/catch
        try {
          scanner.clear();
        } catch (clearError) {
          // Ignore clear errors during cleanup
          console.warn("Clear error (can be ignored):", clearError);
        }
      } catch (err) {
        // Silent cleanup - errors are expected during unmount
        console.warn("Cleanup error (can be ignored):", err);
      } finally {
        scannerRef.current = null;
      }
    }
  };

  // ✅ IMPROVED: Start scanning dengan error handling yang lebih baik
  const startScanning = async () => {
    setCameraError("");
    setIsCameraReady(false);

    try {
      // Cleanup existing scanner first
      await cleanupScanner();

      // Wait a bit for cleanup to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!isMountedRef.current) return;

      // ✅ PENTING: Pastikan element sudah ada
      const scannerElement = document.getElementById(scannerDivId);
      if (!scannerElement) {
        throw new Error("Scanner element not found");
      }

      // Create new scanner instance
      scannerRef.current = new Html5Qrcode(scannerDivId);

      // ✅ IMPROVED: Konfigurasi yang lebih optimal
      const config = {
        fps,
        qrbox: {
          width: Math.min(250, window.innerWidth - 40),
          height: Math.min(150, window.innerHeight / 3),
        },
        aspectRatio: 1.7,
        // Disable beep sound
        disableFlip: false,
        videoConstraints: {
          facingMode: "environment",
          focusMode: "continuous",
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
        },
      };

      // ✅ IMPROVED: Start dengan promise yang lebih robust
      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText, decodedResult) => {
          // ✅ Hanya proses jika component masih mounted dan berbeda dari scan terakhir
          if (isMountedRef.current && decodedText !== lastScan) {
            console.log("✅ Barcode scanned:", decodedText);
            setLastScan(decodedText);
            onScanSuccess(decodedText);

            // Optional: Play success sound
            try {
              const audio = new Audio(
                "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0PVqzn77BdGAg+ltryxnMpBSl+zPLaizsIGGS57OaVSAwOUKXh8bllHAU2j9Xx0H0vBSF1xe/glEILElyt5O+rWBUIQ5zb8sFuJAUuhM/z1YU2Bhxqvu7mnUoPDlOo5O+zYBoGPJPU8tN+LQUie8rx3I4+CRZiturqpVITC0mi3vK8aB8GM4nP8tiJOQcZZr3s5qBLDRBVq+Xxtnwj"
              );
              audio.play().catch(() => {});
            } catch {}
          }
        },
        (errorMessage) => {
          // ✅ IMPROVED: Filter out expected errors
          if (
            !errorMessage.includes("NotFoundException") &&
            !errorMessage.includes("IndexSizeError") &&
            !errorMessage.includes("getImageData")
          ) {
            console.warn("Scan warning:", errorMessage);
          }
        }
      );

      if (isMountedRef.current) {
        setIsScanning(true);
        setIsCameraReady(true);
        setCameraError("");
      }
    } catch (err: any) {
      console.error("Error starting scanner:", err);

      if (isMountedRef.current) {
        setIsScanning(false);
        setIsCameraReady(false);

        // ✅ User-friendly error messages
        let errorMsg = "Failed to start camera";

        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          errorMsg =
            "Camera permission denied. Please allow camera access in your browser settings.";
        } else if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError"
        ) {
          errorMsg =
            "No camera found. Please connect a camera or use manual input.";
        } else if (
          err.name === "NotReadableError" ||
          err.name === "TrackStartError"
        ) {
          errorMsg = "Camera is already in use by another application.";
        } else if (err.name === "OverconstrainedError") {
          errorMsg =
            "Camera doesn't support required settings. Try a different camera.";
        } else if (err.message) {
          errorMsg = err.message;
        }

        setCameraError(errorMsg);

        if (onScanError) {
          onScanError(errorMsg);
        }
      }

      await cleanupScanner();
    }
  };

  // ✅ IMPROVED: Stop scanning dengan error handling
  const stopScanning = async () => {
    setIsScanning(false);
    setIsCameraReady(false);
    await cleanupScanner();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      console.log("📝 Manual input:", manualCode.trim());
      onScanSuccess(manualCode.trim());
      setManualCode("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <CardTitle>Barcode Scanner</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isCameraReady && (
              <Badge variant="success" size="sm" className="animate-pulse">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ready
              </Badge>
            )}
            <Badge variant={isScanning ? "success" : "default"} size="sm">
              {isScanning ? "Scanning..." : "Stopped"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ✅ Camera Error Alert */}
        {cameraError && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-900 mb-1">
                  Camera Error
                </p>
                <p className="text-sm text-red-800">{cameraError}</p>
                {cameraError.includes("permission") && (
                  <div className="mt-3 text-xs text-red-700 space-y-1">
                    <p className="font-semibold">To fix this:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Click the 🔒 icon in your browser's address bar</li>
                      <li>Allow camera permissions for this site</li>
                      <li>Refresh the page and try again</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scanner Area */}
        <div className="relative">
          {/* ✅ PENTING: Element harus selalu ada, visibility dikontrol dengan CSS */}
          <div
            id={scannerDivId}
            className={`w-full transition-all duration-300 ${
              !isScanning ? "hidden" : ""
            }`}
            style={{
              minHeight: isScanning ? "300px" : "0",
            }}
          />

          {/* Placeholder ketika tidak scanning */}
          {!isScanning && (
            <div className="flex flex-col items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 rounded-xl p-12 border-3 border-dashed border-gray-400 shadow-inner">
              <Camera className="w-24 h-24 text-gray-400 mb-4 animate-pulse" />
              <p className="text-gray-700 font-semibold text-center mb-2">
                Camera Ready to Scan
              </p>
              <p className="text-gray-500 text-sm text-center mb-4">
                Click "Start Scanning" to activate camera
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Supports QR codes and barcodes
              </div>
            </div>
          )}

          {/* Loading indicator saat kamera sedang loading */}
          {isScanning && !isCameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded-lg">
              <div className="bg-white rounded-lg p-6 shadow-xl">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm font-semibold text-gray-700">
                  Starting camera...
                </p>
              </div>
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
              size="lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              Start Scanning
            </Button>
          ) : (
            <Button
              onClick={stopScanning}
              variant="danger"
              className="flex-1"
              size="lg"
            >
              <X className="w-5 h-5 mr-2" />
              Stop Scanning
            </Button>
          )}
        </div>

        {/* Manual Input */}
        <div className="border-t-2 border-gray-200 pt-4">
          <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
              ALTERNATIVE
            </span>
            Enter barcode manually:
          </p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="ORD202400001 or ORD202400001M001"
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm font-bold uppercase"
              autoComplete="off"
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!manualCode.trim()}
            >
              Submit
            </Button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            💡 Tip: You can also paste barcode values (Ctrl+V / Cmd+V)
          </p>
        </div>

        {/* Last Scan Info */}
        {lastScan && (
          <div className="bg-linear-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-bold text-green-900">Last Scanned:</p>
            </div>
            <p className="font-mono text-base font-bold text-green-900 bg-white border border-green-200 rounded px-3 py-2">
              {lastScan}
            </p>
          </div>
        )}

        {/* Tips */}
        {!isScanning && !cameraError && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-xs space-y-2">
            <p className="font-bold text-blue-900 mb-2">📌 Scanning Tips:</p>
            <ul className="space-y-1 text-blue-800 list-disc list-inside">
              <li>Hold barcode steady and within the scan box</li>
              <li>Ensure good lighting for better accuracy</li>
              <li>Keep camera lens clean</li>
              <li>Allow camera permissions when prompted</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
