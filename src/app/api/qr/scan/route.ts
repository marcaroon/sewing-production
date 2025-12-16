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

    // Parse barcode to determine type
    let parsedBarcode;
    try {
      parsedBarcode = parseBarcode(qrCode);
      console.log("✅ Parsed barcode:", parsedBarcode);
    } catch (parseError: any) {
      console.error("❌ Parse error:", parseError.message);
      return NextResponse.json(
        {
          success: false,
          error: `Invalid barcode format: ${qrCode}`,
          details: parseError.message,
          hint: "Expected formats: ORD-2025-00001 (Order) or ORD-2025-00001-M-001 (Bundle)",
        },
        { status: 400 }
      );
    }

    // ✅ FIX: Initialize variables properly
    let qrData: any = null;
    let qrType: "order" | "bundle" = parsedBarcode.type; // ✅ Get from parsed result
    let qrId: string | null = null;

    // Get data based on barcode type
    if (parsedBarcode.type === "order") {
      // Find by order number (reconstructed with dashes)
      console.log("🔍 Searching for order:", parsedBarcode.orderNumber);

      const orderQR = await prisma.orderQRCode.findFirst({
        where: { 
          order: {
            orderNumber: parsedBarcode.orderNumber
          }
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
        console.error("❌ Order barcode not found:", parsedBarcode.orderNumber);
        return NextResponse.json(
          {
            success: false,
            error: `Order not found: ${parsedBarcode.orderNumber}`,
            details: `Barcode scanned: ${qrCode}. Please ensure barcodes are generated for this order.`,
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
      console.log("🔍 Searching for bundle:", parsedBarcode.orderNumber, parsedBarcode.size);

      const bundleQR = await prisma.bundleQRCode.findFirst({
        where: { 
          bundle: {
            order: {
              orderNumber: parsedBarcode.orderNumber
            },
            size: parsedBarcode.size,
            bundleNumber: {
              endsWith: parsedBarcode.bundleNumber || ""
            }
          }
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
        console.error("❌ Bundle barcode not found");
        return NextResponse.json(
          {
            success: false,
            error: `Bundle not found for ${parsedBarcode.orderNumber} - Size ${parsedBarcode.size}`,
            details: `Barcode scanned: ${qrCode}. Please ensure barcodes are generated.`,
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
        qrCode: qrCode.trim().toUpperCase(),
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