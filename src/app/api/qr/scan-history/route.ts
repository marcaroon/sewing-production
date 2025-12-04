// app/api/qr/scan-history/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/qr/scan-history?qrCode=xxx&orderId=xxx&limit=50
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const qrCode = searchParams.get("qrCode");
    const orderId = searchParams.get("orderId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (qrCode) {
      where.qrCode = qrCode;
    }

    if (orderId) {
      where.OR = [
        { orderQR: { orderId } },
        { bundleQR: { bundle: { orderId } } },
      ];
    }

    const scans = await prisma.qRScan.findMany({
      where,
      include: {
        orderQR: {
          include: {
            order: {
              select: {
                orderNumber: true,
                buyer: { select: { name: true } },
                style: { select: { name: true } },
              },
            },
          },
        },
        bundleQR: {
          include: {
            bundle: {
              select: {
                bundleNumber: true,
                size: true,
                quantity: true,
                order: {
                  select: {
                    orderNumber: true,
                    buyer: { select: { name: true } },
                    style: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        scannedAt: "desc",
      },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: scans,
      count: scans.length,
    });
  } catch (error) {
    console.error("Error fetching scan history:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch scan history",
      },
      { status: 500 }
    );
  }
}
