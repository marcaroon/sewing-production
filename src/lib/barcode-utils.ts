// src/lib/barcode-utils.ts
// Utility functions for Barcode generation (replacing QR codes)

export interface BarcodeData {
  type: "order" | "bundle";
  code: string;
  url: string;
  metadata?: Record<string, any>;
}

function sanitizeString(str: string): string {
  if (!str) return "GEN"; // Default jika kosong
  return str.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/**
 * Normalize barcode string - remove dashes and spaces
 */
function normalizeBarcode(barcodeString: string): string {
  return barcodeString.trim().replace(/[-\s]/g, "").toUpperCase();
}

export function generateOrderBarcode(
  orderNumber: string,
  article: string
): string {
  const normOrder = normalizeBarcode(orderNumber);
  const normArticle = sanitizeString(article);
  return `${normOrder}-${normArticle}`;
}

export function generateBundleBarcode(
  orderNumber: string,
  article: string,
  size: string,
  bundleIndex: number
): string {
  const normOrder = normalizeBarcode(orderNumber);
  const normArticle = sanitizeString(article);
  const bundleNum = bundleIndex.toString().padStart(3, "0");
  const normSize = sanitizeString(size);

  // Format Bundle: ORD202500001-ARTICLE-SIZE-001
  return `${normOrder}-${normArticle}-${normSize}-${bundleNum}`;
}

export function parseBarcode(barcodeString: string): {
  type: "order" | "bundle";
  orderNumber: string;
  article?: string;
  size?: string;
  bundleNumber?: string;
} {
  const cleanCode = barcodeString.trim().toUpperCase();

  const baseOrderRegex = /(ORD[-]?\d{4}[-]?\d{5})/;

  const match = cleanCode.match(baseOrderRegex);
  if (!match) {
    throw new Error("Invalid barcode format: Order code not found");
  }

  const orderPart = match[0];
  const formattedOrderNumber = orderPart
    .replace(/(ORD)(\d{4})(\d{5})/, "$1-$2-$3")
    .replace(/--/g, "-");

  let remainder = cleanCode.replace(orderPart, "");

  if (remainder.startsWith("-")) remainder = remainder.substring(1);

  const bundleSuffixRegex = /[-]([A-Z0-9]+)[-](\d{3})$/;
  const bundleMatch = cleanCode.match(bundleSuffixRegex);

  if (bundleMatch) {
    const size = bundleMatch[1];
    const bundleNum = bundleMatch[2];

    const article = remainder.replace(bundleMatch[0], "").replace(/-$/, "");

    return {
      type: "bundle",
      orderNumber: formattedOrderNumber,
      article: article || undefined,
      size: size,
      bundleNumber: bundleNum,
    };
  } else {
    return {
      type: "order",
      orderNumber: formattedOrderNumber,
      article: remainder || undefined,
    };
  }
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
