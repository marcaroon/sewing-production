"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Camera, X, CheckCircle, AlertTriangle } from "lucide-react";

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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [lastScan, setLastScan] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const isMountedRef = useRef(true);

  const scannerId = "html5qr-code-full-region";

  const addDebugLog = (message: string) => {
    console.log("[Scanner Debug]", message);
    setDebugInfo((prev) => [
      ...prev.slice(-4),
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear();
          })
          .catch((err) => console.error("Cleanup error", err));
      }
    };
  }, []);

  const stopScanning = async () => {
    try {
      if (scannerRef.current) {
        addDebugLog("Stopping scanner...");
        const scanner = scannerRef.current;

        if (scanner.isScanning) {
          await scanner.stop();
          addDebugLog("Scanner stopped");
        }

        await scanner.clear();
        scannerRef.current = null;
        addDebugLog("Scanner cleared");
      }
    } catch (err: any) {
      console.error("Error stopping scanner:", err);
      addDebugLog(`Stop error: ${err.message}`);
    } finally {
      if (isMountedRef.current) {
        setIsScanning(false);
      }
    }
  };

  const startScanning = async () => {
    setCameraError("");
    addDebugLog("Start scanning initiated...");

    try {
      // Stop existing scanner first
      await stopScanning();
      await new Promise((resolve) => setTimeout(resolve, 150));

      if (!isMountedRef.current) {
        addDebugLog("Component unmounted, aborting start");
        return;
      }

      addDebugLog("Getting cameras...");
      const devices = await Html5Qrcode.getCameras();

      if (!devices || devices.length === 0) {
        throw new Error("No camera found on this device");
      }

      addDebugLog(
        `Found ${devices.length} camera(s): ${devices
          .map((d) => d.label)
          .join(", ")}`
      );

      scannerRef.current = new Html5Qrcode(scannerId);
      addDebugLog("Scanner instance created");

      const backCamera = devices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear")
      );
      const environmentCamera = devices.find((device) =>
        device.label.toLowerCase().includes("environment")
      );

      const selectedCamera = backCamera || environmentCamera || devices[0];
      addDebugLog(`Selected camera: ${selectedCamera.label}`);

      const config = {
        fps: fps,
        qrbox: { width: 600, height: 250 },
        // aspectRatio: 1.0,
      };

      addDebugLog("Starting camera with config...");

      await scannerRef.current.start(
        selectedCamera.id,
        config,
        (decodedText, decodedResult) => {
          const normalized = decodedText.trim().toUpperCase();
          addDebugLog(`🟢Scanned: ${normalized}`);
          console.log("Full scan result:", decodedResult);

          if (normalized !== lastScan) {
            setLastScan(normalized);
            onScanSuccess(normalized);
            addDebugLog(`Callback triggered for: ${normalized}`);
          } else {
            addDebugLog("Duplicate scan, ignored");
          }
        },
        (errorMessage) => {
          if (Math.random() < 0.01) {
            console.log("Scan frame (no code detected)");
          }
        }
      );

      if (isMountedRef.current) {
        setIsScanning(true);
        addDebugLog("🟢 Scanner started successfully!");
      }
    } catch (err: any) {
      console.error("Scanner start error:", err);
      addDebugLog(`Start failed: ${err.message}`);

      if (isMountedRef.current) {
        setIsScanning(false);

        let errorMessage = "Failed to start camera";

        if (err.name === "NotAllowedError") {
          errorMessage =
            "Camera permission denied. Please allow camera access in browser settings.";
        } else if (err.name === "NotFoundError") {
          errorMessage = "No camera found on this device.";
        } else if (err.name === "NotReadableError") {
          errorMessage = "Camera is already in use by another application.";
        } else if (err.name === "OverconstrainedError") {
          errorMessage =
            "Camera constraints could not be satisfied. Try using a different camera.";
        } else if (err.message) {
          errorMessage = err.message;
        }

        setCameraError(errorMessage);
        if (onScanError) {
          onScanError(errorMessage);
        }
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const normalized = manualCode.trim().replace(/[-\s]/g, "").toUpperCase();
    if (!normalized) return;

    addDebugLog(`Manual input: ${normalized}`);
    setLastScan(normalized);
    onScanSuccess(normalized);
    setManualCode("");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <CardTitle>Barcode Scanner</CardTitle>
          </div>
          <Badge variant={isScanning ? "success" : "default"}>
            {isScanning ? "🟢 Scanning" : "⚫ Stopped"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error */}
        {cameraError && (
          <div className="bg-red-500/10 border border-red-500/40 rounded p-3 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-600 font-semibold">Camera Error</p>
              <p className="text-sm text-red-600 mt-1">{cameraError}</p>
            </div>
          </div>
        )}

        {/* Debug Info */}
        {debugInfo.length > 0 && (
          <div className="bg-muted border border-border rounded p-3">
            <p className="text-xs font-semibold text-foreground mb-2">
              Debug Log:
            </p>
            <div className="space-y-1">
              {debugInfo.map((log, idx) => (
                <p
                  key={idx}
                  className="text-xs text-muted-foreground font-mono"
                >
                  {log}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Scanner Container - SIMPLIFIED */}
        <div className="w-full">
          {!isScanning && (
            <div className="w-full h-100 flex flex-col items-center justify-center bg-muted rounded-lg border-2 border-border">
              <Camera className="w-16 h-16 text-muted-foreground mb-3" />
              <p className="font-semibold text-foreground text-lg">
                Ready to Scan
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Click "Start Scanning" below
              </p>
            </div>
          )}

          {/* Scanner renders here */}
          <div
            id={scannerId}
            style={{
              display: isScanning ? "block" : "none",
            }}
          />
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!isScanning ? (
            <Button
              onClick={startScanning}
              variant="primary"
              className="flex-1"
            >
              <Camera className="mr-2 w-4 h-4" /> Start Scanning
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="danger" className="flex-1">
              <X className="mr-2 w-4 h-4" /> Stop Scanning
            </Button>
          )}
        </div>

        {/* Manual Input */}
        <div className="pt-4 border-t">
          <p className="text-sm font-semibold text-foreground mb-2">
            Manual Entry (for testing):
          </p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              className="flex-1 border rounded px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ORD202400001 or ORD202400001M001"
            />
            <Button type="submit" disabled={!manualCode.trim()}>
              Submit
            </Button>
          </form>
        </div>

        {/* Last Scan */}
        {lastScan && (
          <div className="bg-green-500/10 border-2 border-green-400 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="font-bold text-green-600">Last Scanned Code:</p>
            </div>
            <p className="font-mono text-lg text-green-600 bg-card rounded px-3 py-2 border border-green-500/40">
              {lastScan}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
