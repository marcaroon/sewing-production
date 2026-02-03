// src/app/api/qr/scan/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseBarcode } from "@/lib/barcode-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrCode, scannedBy, location, action, notes, deviceInfo } = body;

    console.log("📥 Scan request:", { qrCode, scannedBy, location, action });

    // Validate required fields
    if (!qrCode || !scannedBy || !location || !action) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: qrCode, scannedBy, location, action",
        },
        { status: 400 }
      );
    }

    // Normalisasi input QR Code untuk pencarian database
    const normalizedQrInput = qrCode.trim().toUpperCase();

    // Parse barcode to determine type
    let parsedBarcode;
    try {
      parsedBarcode = parseBarcode(normalizedQrInput);
      console.log("✅ Parsed barcode:", parsedBarcode);
    } catch (parseError: any) {
      console.error("❌ Parse error:", parseError.message);
      return NextResponse.json(
        {
          success: false,
          error: `Invalid barcode format: ${qrCode}`,
          details: parseError.message,
          hint: "Expected format: ORD-YYYY-NNNNN-[ART] or ORD-YYYY-NNNNN-[ART]-SIZE-NNN",
        },
        { status: 400 }
      );
    }

    // Initialize variables
    let qrData: any = null;
    let qrType: "order" | "bundle" = parsedBarcode.type;
    let qrId: string | null = null;

    // Get data based on barcode type
    if (parsedBarcode.type === "order") {
      console.log("🔍 Searching for order:", parsedBarcode.orderNumber);

      // ✅ IMPROVED QUERY: Cek QR Code exact match DULU, baru cek via relasi Order Number
      const orderQR = await prisma.orderQRCode.findFirst({
        where: {
          OR: [
            { qrCode: normalizedQrInput }, // Prioritas 1: Match string barcode persis
            { qrCode: qrCode }, // Match raw input
            { order: { orderNumber: parsedBarcode.orderNumber } }, // Prioritas 2: Match via Order Number
          ],
        },
        include: {
          order: {
            include: {
              buyer: true,
              style: true,
              sizeBreakdowns: true,
              bundles: {
                take: 5,
              },
              processSteps: {
                orderBy: { sequenceOrder: "asc" },
                take: 10,
              },
            },
          },
        },
      });

      if (!orderQR) {
        console.error("❌ Order barcode not found in DB");
        return NextResponse.json(
          {
            success: false,
            error: `Order barcode not found.`,
            details: `Code: ${qrCode}. Pastikan barcode sudah digenerate untuk order ${parsedBarcode.orderNumber}`,
          },
          { status: 404 }
        );
      }

      console.log("✅ Found order:", orderQR.order.orderNumber);

      qrId = orderQR.id;
      qrData = {
        type: "order",
        qrCode: orderQR.qrCode,
        order: orderQR.order,
      };
    } else if (parsedBarcode.type === "bundle") {
      console.log(
        "🔍 Searching for bundle:",
        parsedBarcode.orderNumber,
        parsedBarcode.size
      );

      // ✅ IMPROVED QUERY: Cek QR Code exact match DULU
      const bundleQR = await prisma.bundleQRCode.findFirst({
        where: {
          OR: [
            { qrCode: normalizedQrInput }, // Prioritas 1: Match string barcode persis
            { qrCode: qrCode }, // Match raw input
            {
              // Prioritas 2: Match via komponen (Order + Size + Bundle Sequence)
              bundle: {
                order: { orderNumber: parsedBarcode.orderNumber },
                size: parsedBarcode.size,
                bundleNumber: { endsWith: parsedBarcode.bundleNumber || "" },
              },
            },
          ],
        },
        include: {
          bundle: {
            include: {
              order: {
                include: {
                  buyer: true,
                  style: true,
                },
              },
            },
          },
        },
      });

      if (!bundleQR) {
        console.error("❌ Bundle barcode not found in DB");
        return NextResponse.json(
          {
            success: false,
            error: `Bundle barcode not found.`,
            details: `Code: ${qrCode}. Pastikan barcode sudah digenerate.`,
          },
          { status: 404 }
        );
      }

      console.log("✅ Found bundle:", bundleQR.bundle.bundleNumber);

      qrId = bundleQR.id;
      qrData = {
        type: "bundle",
        qrCode: bundleQR.qrCode,
        bundle: bundleQR.bundle,
        order: bundleQR.bundle.order,
      };
    }

    // Create scan log
    const scanLog = await prisma.qRScan.create({
      data: {
        qrCode: normalizedQrInput,
        qrType,
        orderQRId: qrType === "order" ? qrId : undefined,
        bundleQRId: qrType === "bundle" ? qrId : undefined,
        scannedBy,
        location,
        action,
        notes: notes || null,
        deviceInfo: deviceInfo || null,
      },
    });

    console.log("✅ Scan logged successfully:", scanLog.id);

    return NextResponse.json({
      success: true,
      message: "Barcode scanned successfully",
      data: qrData,
      scanLog: {
        id: scanLog.id,
        scannedAt: scanLog.scannedAt,
      },
    });
  } catch (error) {
    console.error("❌ Server error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while processing barcode",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
