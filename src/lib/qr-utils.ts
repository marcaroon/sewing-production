import QRCode from "qrcode";

export interface QRCodeData {
  type: "order" | "bundle";
  code: string;
  url: string;
  metadata?: Record<string, any>;
}

// Generate QR Code string untuk Order
export function generateOrderQRCode(orderNumber: string): string {
  return orderNumber;
}

// Generate QR Code string untuk Bundle
export function generateBundleQRCode(
  orderNumber: string,
  size: string,
  bundleIndex: number
): string {
  const bundleNum = bundleIndex.toString().padStart(3, "0");
  return `${orderNumber}-${size}-${bundleNum}`;
}

// Generate QR Code Data URL (untuk display)
export async function generateQRCodeDataURL(
  qrString: string,
  options?: QRCode.QRCodeToDataURLOptions
): Promise<string> {
  const defaultOptions: QRCode.QRCodeToDataURLOptions = {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    ...options,
  };

  try {
    const dataURL = await QRCode.toDataURL(qrString, defaultOptions);
    return dataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
}

// Generate QR Code as Buffer (untuk save ke file)
export async function generateQRCodeBuffer(
  qrString: string,
  options?: QRCode.QRCodeToBufferOptions
): Promise<Buffer> {
  const defaultOptions: QRCode.QRCodeToBufferOptions = {
    width: 300,
    margin: 2,
    ...options,
  };

  try {
    const buffer = await QRCode.toBuffer(qrString, defaultOptions);
    return buffer;
  } catch (error) {
    console.error("Error generating QR code buffer:", error);
    throw error;
  }
}

// Parse QR Code string untuk mendapatkan info
export function parseQRCode(qrString: string): {
  type: "order" | "bundle";
  orderNumber: string;
  size?: string;
  bundleNumber?: string;
} {
  // Check if it's order or bundle QR
  const parts = qrString.split("-");

  // Order QR: ORD-2024-00001
  if (parts.length === 3) {
    return {
      type: "order",
      orderNumber: qrString,
    };
  }

  // Bundle QR: ORD-2024-00001-M-001
  if (parts.length === 5) {
    const orderNumber = `${parts[0]}-${parts[1]}-${parts[2]}`;
    const size = parts[3];
    const bundleNumber = parts[4];

    return {
      type: "bundle",
      orderNumber,
      size,
      bundleNumber,
    };
  }

  throw new Error("Invalid QR code format");
}

// Create QR Data object untuk simpan di database
export function createQRData(
  type: "order" | "bundle",
  code: string,
  metadata?: Record<string, any>
): string {
  const qrData: QRCodeData = {
    type,
    code,
    url: `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/qr/${type}/${code}`,
    metadata,
  };

  return JSON.stringify(qrData);
}

// Parse QR Data dari database
export function parseQRData(qrDataString: string): QRCodeData {
  try {
    return JSON.parse(qrDataString);
  } catch (error) {
    throw new Error("Invalid QR data format");
  }
}

// Generate printable QR label HTML
export function generateQRLabelHTML(
  qrDataURL: string,
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
      <img src="${qrDataURL}" style="width: 120px; height: 120px; margin-bottom: 10px;" />
      <div style="font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 5px;">
        ${labelText}
      </div>
      ${
        subtitle
          ? `<div style="font-size: 10px; text-align: center; color: #666;">${subtitle}</div>`
          : ""
      }
    </div>
  `;
}

// Generate multiple labels for printing
export async function generateBulkQRLabels(
  labels: Array<{ code: string; text: string; subtitle?: string }>
): Promise<string> {
  const labelHTMLs = await Promise.all(
    labels.map(async (label) => {
      const dataURL = await generateQRCodeDataURL(label.code);
      return generateQRLabelHTML(dataURL, label.text, label.subtitle);
    })
  );

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>QR Code Labels</title>
      <style>
        @media print {
          body { margin: 0; }
          @page { size: 80mm 60mm; margin: 0; }
        }
      </style>
    </head>
    <body>
      ${labelHTMLs.join("\n")}
    </body>
    </html>
  `;
}
