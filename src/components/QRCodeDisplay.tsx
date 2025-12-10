// components/QRCodeDisplay.tsx - IMPROVED VERSION

"use client";

import React, { useEffect, useState } from "react";
import QRCodeSVG from "react-qr-code";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Download, Printer, Package, FileText } from "lucide-react";

interface QRCodeDisplayProps {
  qrCode: string;
  title?: string;
  subtitle?: string;
  type?: "order" | "bundle";
  size?: number;
  showDownload?: boolean;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  qrCode,
  title,
  subtitle,
  type = "order",
  size = 200,
  showDownload = true,
}) => {
  const [downloadUrl, setDownloadUrl] = useState<string>("");

  useEffect(() => {
    if (showDownload) {
      const svg = document.getElementById(`qr-${qrCode}`);
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
      }
    }

    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [qrCode, showDownload]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `qr-${qrCode}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=600,height=600");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code - ${qrCode}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                font-family: Arial, sans-serif;
              }
              .qr-container {
                text-align: center;
                padding: 20px;
                border: 3px solid #000;
              }
              .title {
                font-size: 20px;
                font-weight: bold;
                margin: 10px 0;
                color: #000;
              }
              .subtitle {
                font-size: 14px;
                color: #333;
                margin: 5px 0 15px 0;
                font-weight: 600;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              ${document.getElementById(`qr-${qrCode}`)?.outerHTML || ""}
              ${title ? `<div class="title">${title}</div>` : ""}
              ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <Card hover>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {type === "order" ? (
              <FileText className="w-5 h-5 text-blue-600" />
            ) : (
              <Package className="w-5 h-5 text-green-600" />
            )}
            <CardTitle>{title || "QR Code"}</CardTitle>
          </div>
          <Badge variant={type === "order" ? "info" : "success"} size="sm">
            {type === "order" ? "Order" : "Bundle"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          {/* QR Code */}
          <div className="bg-white p-5 rounded-lg border-4 border-gray-300 shadow-sm">
            <QRCodeSVG
              id={`qr-${qrCode}`}
              value={qrCode}
              size={size}
              level="H"
            />
          </div>

          {/* Labels */}
          <div className="text-center w-full">
            <p className="font-mono text-sm font-bold text-gray-900 bg-gray-100 border-2 border-gray-300 rounded px-3 py-2">
              {qrCode}
            </p>
            {subtitle && (
              <p className="text-xs font-semibold text-gray-700 mt-2 bg-blue-50 border border-blue-200 rounded px-2 py-1">
                {subtitle}
              </p>
            )}
          </div>

          {/* Actions */}
          {showDownload && (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!downloadUrl}
                className="flex-1"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex-1"
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Grid component untuk menampilkan multiple QR codes
interface QRCodeGridProps {
  qrCodes: Array<{
    code: string;
    title: string;
    subtitle?: string;
    type: "order" | "bundle";
  }>;
  columns?: number;
}

export const QRCodeGrid: React.FC<QRCodeGridProps> = ({
  qrCodes,
  columns = 3,
}) => {
  return (
    <div
      className="grid gap-6"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {qrCodes.map((qr, index) => (
        <QRCodeDisplay
          key={index}
          qrCode={qr.code}
          title={qr.title}
          subtitle={qr.subtitle}
          type={qr.type}
          size={150}
        />
      ))}
    </div>
  );
};
