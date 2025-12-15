// src/lib/barcode-utils.ts
// Utility functions for Barcode generation (replacing QR codes)

export interface BarcodeData {
  type: "order" | "bundle";
  code: string;
  url: string;
  metadata?: Record<string, any>;
}

// Generate Barcode string untuk Order
export function generateOrderBarcode(orderNumber: string): string {
  return orderNumber.replace(/-/g, ''); // Remove dashes for barcode
}

// Generate Barcode string untuk Bundle
export function generateBundleBarcode(
  orderNumber: string,
  size: string,
  bundleIndex: number
): string {
  const bundleNum = bundleIndex.toString().padStart(3, "0");
  return `${orderNumber.replace(/-/g, '')}${size}${bundleNum}`;
}

// Parse Barcode string untuk mendapatkan info
export function parseBarcode(barcodeString: string): {
  type: "order" | "bundle";
  orderNumber: string;
  size?: string;
  bundleNumber?: string;
} {
  const cleanCode = barcodeString.trim().toUpperCase();
  
  // Order Barcode: ORD202400001 (13 chars tanpa dash)
  if (cleanCode.length === 13 && cleanCode.startsWith("ORD")) {
    // Reconstruct order number with dashes
    const year = cleanCode.substring(3, 7);
    const num = cleanCode.substring(7, 13);
    return {
      type: "order",
      orderNumber: `ORD-${year}-${num}`,
    };
  }

  // Bundle Barcode: ORD202400001M001 (14+ chars)
  if (cleanCode.length >= 14 && cleanCode.startsWith("ORD")) {
    const year = cleanCode.substring(3, 7);
    const num = cleanCode.substring(7, 13);
    const size = cleanCode.substring(13, cleanCode.length - 3);
    const bundleNum = cleanCode.substring(cleanCode.length - 3);

    return {
      type: "bundle",
      orderNumber: `ORD-${year}-${num}`,
      size,
      bundleNumber: bundleNum,
    };
  }

  throw new Error(`Invalid barcode format: ${barcodeString}`);
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
      ${subtitle ? `<div style="font-size: 10px; text-align: center; color: #666; margin-top: 5px;">${subtitle}</div>` : ""}
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