// src/app/api/qr/scan/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseBarcode } from "@/lib/barcode-utils";

// POST /api/qr/scan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrCode, scannedBy, location, action, notes, deviceInfo } = body;

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
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid barcode format: ${qrCode}`,
        },
        { status: 400 }
      );
    }

    let qrData: any = null;
    let qrType: string;
    let qrId: string | null = null;

    // Get data based on barcode type
    if (parsedBarcode.type === "order") {
      qrType = "order";

      // Find order QR code
      const orderQR = await prisma.orderQRCode.findUnique({
        where: { qrCode },
        include: {
          order: {
            include: {
              buyer: true,
              style: true,
              sizeBreakdowns: true,
              bundles: {
                take: 5, // Limit bundles untuk performa
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
        return NextResponse.json(
          {
            success: false,
            error: `Order barcode not found: ${qrCode}`,
          },
          { status: 404 }
        );
      }

      qrId = orderQR.id;
      qrData = {
        type: "order",
        qrCode: orderQR.qrCode,
        order: orderQR.order,
      };
    } else if (parsedBarcode.type === "bundle") {
      qrType = "bundle";

      // Find bundle QR code
      const bundleQR = await prisma.bundleQRCode.findUnique({
        where: { qrCode },
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
        return NextResponse.json(
          {
            success: false,
            error: `Bundle barcode not found: ${qrCode}`,
          },
          { status: 404 }
        );
      }

      qrId = bundleQR.id;
      qrData = {
        type: "bundle",
        qrCode: bundleQR.qrCode,
        bundle: bundleQR.bundle,
        order: bundleQR.bundle.order,
      };
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid barcode type: ${qrCode}`,
        },
        { status: 400 }
      );
    }

    // Create scan log
    const scanLog = await prisma.qRScan.create({
      data: {
        qrCode,
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
    console.error("Error scanning barcode:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process barcode scan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}