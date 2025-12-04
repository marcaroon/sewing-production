// app/api/qr/scan/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseQRCode } from "@/lib/qr-utils";

// POST /api/qr/scan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrCode, scannedBy, location, action, notes, deviceInfo } = body;

    if (!qrCode || !scannedBy || !location || !action) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Parse QR code to determine type
    const parsedQR = parseQRCode(qrCode);

    let qrData: any = null;
    let qrType: string;
    let qrId: string | null = null;

    // Get data based on QR type
    if (parsedQR.type === "order") {
      qrType = "order";

      const orderQR = await prisma.orderQRCode.findUnique({
        where: { qrCode },
        include: {
          order: {
            include: {
              buyer: true,
              style: true,
              sizeBreakdowns: true,
              bundles: true,
            },
          },
        },
      });

      if (!orderQR) {
        return NextResponse.json(
          {
            success: false,
            error: "QR code not found",
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
    } else if (parsedQR.type === "bundle") {
      qrType = "bundle";

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
            error: "QR code not found",
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
          error: "Invalid QR code type",
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
        notes,
        deviceInfo,
      },
    });

    return NextResponse.json({
      success: true,
      message: "QR code scanned successfully",
      data: qrData,
      scanLog: {
        id: scanLog.id,
        scannedAt: scanLog.scannedAt,
      },
    });
  } catch (error) {
    console.error("Error scanning QR code:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to scan QR code",
      },
      { status: 500 }
    );
  }
}
