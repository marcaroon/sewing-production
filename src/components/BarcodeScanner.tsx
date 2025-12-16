// src/components/BarcodeScanner.tsx - FIXED WITH ZXING
"use client";

import React, { useEffect, useRef, useState } from "react";
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
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [lastScan, setLastScan] = useState<string>("");
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const codeReaderRef = useRef<any>(null);

  useEffect(() => {
    isMountedRef.current = true;

    // Load ZXing library
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@zxing/library@0.20.0/umd/index.min.js";
    script.async = true;
    script.onload = () => {
      console.log("✅ ZXing library loaded");
    };
    document.body.appendChild(script);

    return () => {
      isMountedRef.current = false;
      cleanupScanner();
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const cleanupScanner = () => {
    // Stop scanning interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    codeReaderRef.current = null;
  };

  const startScanning = async () => {
    setCameraError("");
    setIsCameraReady(false);

    // Wait for ZXing to load
    if (typeof (window as any).ZXing === "undefined") {
      setCameraError("Scanner library loading... Please wait.");
      setTimeout(startScanning, 1000);
      return;
    }

    try {
      cleanupScanner();
      await new Promise((resolve) => setTimeout(resolve, 200));

      if (!isMountedRef.current) return;

      // Initialize ZXing BrowserMultiFormatReader
      const { BrowserMultiFormatReader } = (window as any).ZXing;
      codeReaderRef.current = new BrowserMultiFormatReader();

      // Get video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");

      if (videoDevices.length === 0) {
        throw new Error("No camera found");
      }

      // Prefer back camera
      const backCamera =
        videoDevices.find((d) =>
          d.label.toLowerCase().includes("back")
        ) || videoDevices[0];

      // Get camera stream
      const constraints = {
        video: {
          deviceId: backCamera.deviceId,
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      // Set video stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsScanning(true);
      setIsCameraReady(true);
      setCameraError("");

      // Start scanning loop
      scanIntervalRef.current = window.setInterval(() => {
        scanFrame();
      }, 1000 / fps);
    } catch (err: any) {
      console.error("Camera error:", err);

      if (isMountedRef.current) {
        setIsScanning(false);
        setIsCameraReady(false);

        let errorMsg = "Failed to start camera";

        if (err.name === "NotAllowedError") {
          errorMsg = "❌ Camera access denied. Please allow camera permissions.";
        } else if (err.name === "NotFoundError") {
          errorMsg = "❌ No camera found. Please connect a camera.";
        } else if (err.name === "NotReadableError") {
          errorMsg = "❌ Camera is being used by another app.";
        } else if (err.message) {
          errorMsg = err.message;
        }

        setCameraError(errorMsg);
        if (onScanError) onScanError(errorMsg);
      }

      cleanupScanner();
    }
  };

  const scanFrame = () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !codeReaderRef.current ||
      !isMountedRef.current
    ) {
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
      }

      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // Decode barcode
      codeReaderRef.current
        .decodeFromImageData(imageData)
        .then((result: any) => {
          if (result && result.text && isMountedRef.current) {
            const decodedText = result.text.trim().toUpperCase();

            if (decodedText !== lastScan) {
              console.log("✅ Scanned:", decodedText);
              setLastScan(decodedText);
              onScanSuccess(decodedText);

              // Play beep
              try {
                const audio = new Audio(
                  "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0PVqzn77BdGAg+ltryxnMpBSl+zPLaizsIGGS57OaVSAwOUKXh8bllHAU2j9Xx0H0vBSF1xe/glEILElyt5O+rWBUIQ5zb8sFuJAUuhM/z1YU2Bhxqvu7mnUoPDlOo5O+zYBoGPJPU8tN+LQUie8rx3I4+CRZiturqpVITC0mi3vK8aB8GM4nP8tiJOQcZZr3s5qBLDRBVq+Xxtnwj"
                );
                audio.play().catch(() => {});
              } catch {}
            }
          }
        })
        .catch((err: any) => {
          // Expected errors during scanning
          if (
            err.message &&
            !err.message.includes("NotFoundException") &&
            !err.message.includes("No MultiFormat")
          ) {
            console.warn("Decode warning:", err.message);
          }
        });
    } catch (err) {
      console.warn("Scan frame error:", err);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    setIsCameraReady(false);
    cleanupScanner();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Normalize input: remove spaces and dashes, convert to uppercase
    const normalized = manualCode.trim().replace(/[-\s]/g, "").toUpperCase();
    
    if (normalized) {
      console.log("📝 Manual input:", normalized);
      setLastScan(normalized);
      onScanSuccess(normalized);
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
              {isScanning ? "Scanning" : "Stopped"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Camera Error */}
        {cameraError && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-900">Camera Error</p>
                <p className="text-sm text-red-800 mt-1">{cameraError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Scanner Area */}
        <div className="relative">
          <video
            ref={videoRef}
            className={`w-full rounded-lg ${!isScanning ? "hidden" : ""}`}
            playsInline
            muted
            style={{ maxHeight: "400px", objectFit: "cover" }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {!isScanning && (
            <div className="flex flex-col items-center justify-center bg-gray-100 rounded-xl p-12 border-2 border-dashed border-gray-400">
              <Camera className="w-20 h-20 text-gray-400 mb-4" />
              <p className="text-gray-700 font-semibold mb-2">Ready to Scan</p>
              <p className="text-gray-500 text-sm">
                Click Start to activate camera
              </p>
            </div>
          )}

          {isScanning && !isCameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded-lg">
              <div className="bg-white rounded-lg p-6">
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
              Stop
            </Button>
          )}
        </div>

        {/* Manual Input */}
        <div className="border-t-2 border-gray-200 pt-4">
          <p className="text-sm font-bold text-gray-900 mb-3">
            Or enter manually:
          </p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="ORD202400001 or ORD-2024-00001"
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg font-mono font-bold text-sm"
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
            💡 Tip: You can enter with or without dashes (e.g., ORD202400001 or ORD-2024-00001)
          </p>
        </div>

        {/* Last Scan */}
        {lastScan && (
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-bold text-green-900">Last Scanned:</p>
            </div>
            <p className="font-mono font-bold text-green-900 bg-white border border-green-200 rounded px-3 py-2">
              {lastScan}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};