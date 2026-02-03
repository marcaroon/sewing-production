// src/components/BarcodeDisplay.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Download, Printer, Package, FileText } from "lucide-react";

interface BarcodeDisplayProps {
  barcodeValue: string;
  title?: string;
  subtitle?: string;
  type?: "order" | "bundle";
  width?: number;
  height?: number;
  showDownload?: boolean;
}

export const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({
  barcodeValue,
  title,
  subtitle,
  type = "order",
  width = 2,
  height = 60,
  showDownload = true,
}) => {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && typeof window !== "undefined") {
      // Dynamically load JsBarcode
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js";
      script.onload = () => {
        // @ts-ignore
        if (window.JsBarcode) {
          // @ts-ignore
          window.JsBarcode(barcodeRef.current, barcodeValue, {
            format: "CODE128",
            width: width,
            height: height,
            displayValue: true,
            fontSize: 14,
            margin: 10,
          });
        }
      };
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    }
  }, [barcodeValue, width, height]);

  const handleDownload = () => {
    if (!barcodeRef.current) return;

    const svgData = new XMLSerializer().serializeToString(barcodeRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `barcode-${barcodeValue}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=600,height=400");
    if (printWindow && barcodeRef.current) {
      const svgData = new XMLSerializer().serializeToString(barcodeRef.current);
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode - ${barcodeValue}</title>
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
              .barcode-container {
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
            <div class="barcode-container">
              ${svgData}
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
            <CardTitle>{title || "Barcode"}</CardTitle>
          </div>
          <Badge variant={type === "order" ? "info" : "success"} size="sm">
            {type === "order" ? "Order" : "Bundle"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          {/* Barcode */}
          <div className="bg-card p-5 rounded-lg border-4 border-border shadow-sm">
            <svg ref={barcodeRef}></svg>
          </div>

          {/* Labels */}
          <div className="text-center w-full">
            <p className="font-mono text-sm font-bold text-foreground bg-muted border-2 border-border rounded px-3 py-2">
              {barcodeValue}
            </p>
            {subtitle && (
              <p className="text-xs font-semibold text-foreground mt-2 bg-blue-500/10 border border-blue-500/30 rounded px-2 py-1">
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
                className="flex-1"
              >
                <Download className="w-4 h-4" />
                Unduh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex-1"
              >
                <Printer className="w-4 h-4" />
                Cetak
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Grid component untuk menampilkan multiple barcodes
interface BarcodeGridProps {
  barcodes: Array<{
    code: string;
    title: string;
    subtitle?: string;
    type: "order" | "bundle";
  }>;
  columns?: number;
}

export const BarcodeGrid: React.FC<BarcodeGridProps> = ({
  barcodes,
  columns = 3,
}) => {
  return (
    <div
      className="grid gap-6"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {barcodes.map((barcode, index) => (
        <BarcodeDisplay
          key={index}
          barcodeValue={barcode.code}
          title={barcode.title}
          subtitle={barcode.subtitle}
          type={barcode.type}
          width={1.5}
          height={50}
        />
      ))}
    </div>
  );
};
