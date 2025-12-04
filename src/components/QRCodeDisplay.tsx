// components/QRCodeDisplay.tsx

"use client";

import React, { useEffect, useState } from "react";
import QRCodeSVG from "react-qr-code";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

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
    // Generate download URL for SVG
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
                border: 2px solid #000;
              }
              .title {
                font-size: 18px;
                font-weight: bold;
                margin: 10px 0;
              }
              .subtitle {
                font-size: 14px;
                color: #666;
                margin: 5px 0 15px 0;
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title || "QR Code"}</CardTitle>
          <Badge variant={type === "order" ? "info" : "success"}>
            {type === "order" ? "Order" : "Bundle"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <QRCodeSVG
              id={`qr-${qrCode}`}
              value={qrCode}
              size={size}
              level="H"
            //   includeMargin={true}
            />
          </div>

          {/* Labels */}
          <div className="text-center">
            <p className="font-mono text-sm font-bold text-gray-900">
              {qrCode}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>

          {/* Actions */}
          {showDownload && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!downloadUrl}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download SVG
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
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
