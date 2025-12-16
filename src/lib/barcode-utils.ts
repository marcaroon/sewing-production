// src/lib/barcode-utils.ts
// Utility functions for Barcode generation (replacing QR codes)

export interface BarcodeData {
  type: "order" | "bundle";
  code: string;
  url: string;
  metadata?: Record<string, any>;
}

/**
 * Normalize barcode string - remove dashes and spaces
 */
function normalizeBarcode(barcodeString: string): string {
  return barcodeString.trim().replace(/[-\s]/g, "").toUpperCase();
}

// Generate Barcode string untuk Order
export function generateOrderBarcode(orderNumber: string): string {
  return normalizeBarcode(orderNumber);
}

// Generate Barcode string untuk Bundle
export function generateBundleBarcode(
  orderNumber: string,
  size: string,
  bundleIndex: number
): string {
  const normalized = normalizeBarcode(orderNumber);
  const bundleNum = bundleIndex.toString().padStart(3, "0");
  return `${normalized}${size}${bundleNum}`;
}

// Parse Barcode string untuk mendapatkan info
export function parseBarcode(barcodeString: string): {
  type: "order" | "bundle";
  orderNumber: string;
  size?: string;
  bundleNumber?: string;
} {
  const cleanCode = barcodeString.trim().toUpperCase();
  
  // ✅ FIX: Support both formats (with and without dashes)
  // Order Barcode: ORD-2025-00001 OR ORD202500001
  const orderPattern = /^ORD[-]?(\d{4})[-]?(\d{5})$/;
  const orderMatch = cleanCode.match(orderPattern);
  
  if (orderMatch) {
    const year = orderMatch[1];
    const num = orderMatch[2];
    return {
      type: "order",
      orderNumber: `ORD-${year}-${num}`,
    };
  }

  // Bundle Barcode: ORD-2025-00001-M-001 OR ORD202500001M001
  const bundlePattern = /^ORD[-]?(\d{4})[-]?(\d{5})[-]?([A-Z]+)[-]?(\d{3})$/;
  const bundleMatch = cleanCode.match(bundlePattern);
  
  if (bundleMatch) {
    const year = bundleMatch[1];
    const num = bundleMatch[2];
    const size = bundleMatch[3];
    const bundleNum = bundleMatch[4];

    return {
      type: "bundle",
      orderNumber: `ORD-${year}-${num}`,
      size,
      bundleNumber: bundleNum,
    };
  }

  throw new Error(`Invalid barcode format: ${barcodeString}. Expected: ORD-YYYY-NNNNN or ORD-YYYY-NNNNN-S-NNN`);
}

// Create Barcode Data object untuk simpan di database
export function createBarcodeData(
  type: "order" | "bundle",
  code: string,
  metadata?: Record<string, any>
): string {
  const barcodeData: BarcodeData = {
    type,
    code,
    url: `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/barcode/${type}/${code}`,
    metadata,
  };

  return JSON.stringify(barcodeData);
}

// Parse Barcode Data dari database
export function parseBarcodeData(barcodeDataString: string): BarcodeData {
  try {
    return JSON.parse(barcodeDataString);
  } catch (error) {
    throw new Error("Invalid barcode data format");
  }
}

// Generate printable Barcode label HTML using JsBarcode via CDN
export function generateBarcodeLabelHTML(
  barcodeValue: string,
  labelText: string,
  subtitle?: string
): string {
  return `
    <div style="
      width: 80mm;
      height: 60mm;
      border: 2px solid #000;
      padding: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
      page-break-after: always;
    ">
      <svg id="barcode-${barcodeValue}"></svg>
      <div style="font-size: 14px; font-weight: bold; text-align: center; margin-top: 10px;">
        ${labelText}
      </div>
      ${
        subtitle
          ? `<div style="font-size: 10px; text-align: center; color: #666; margin-top: 5px;">${subtitle}</div>`
          : ""
      }
    </div>
    <script>
      JsBarcode("#barcode-${barcodeValue}", "${barcodeValue}", {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14,
        margin: 5
      });
    </script>
  `;
}

// Generate multiple labels for printing
export function generateBulkBarcodeLabels(
  labels: Array<{ code: string; text: string; subtitle?: string }>
): string {
  const labelHTMLs = labels.map((label) =>
    generateBarcodeLabelHTML(label.code, label.text, label.subtitle)
  );

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Barcode Labels</title>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      <style>
        @media print {
          body { margin: 0; }
          @page { size: 80mm 60mm; margin: 0; }
        }
        body { margin: 0; padding: 0; }
      </style>
    </head>
    <body>
      ${labelHTMLs.join("\n")}
    </body>
    </html>
  `;
}
