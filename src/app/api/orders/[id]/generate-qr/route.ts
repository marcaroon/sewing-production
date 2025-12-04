// app/api/orders/[id]/generate-qr/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  generateOrderQRCode,
  generateBundleQRCode,
  createQRData,
} from "@/lib/qr-utils";

// POST /api/orders/[id]/generate-qr
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get order with bundles
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        bundles: true,
        buyer: true,
        style: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 }
      );
    }

    const results = await prisma.$transaction(
      async (tx: {
        orderQRCode: {
          findUnique: (arg0: { where: { orderId: string } }) => any;
          update: (arg0: {
            where: { orderId: string };
            data: { qrCode: string; qrData: string };
          }) => any;
          create: (arg0: {
            data: { orderId: string; qrCode: string; qrData: string };
          }) => any;
        };
        bundleQRCode: {
          findUnique: (arg0: { where: { bundleId: any } }) => any;
          update: (arg0: {
            where: { bundleId: any };
            data: { qrCode: string; qrData: string };
          }) => any;
          create: (arg0: {
            data: { bundleId: any; qrCode: string; qrData: string };
          }) => any;
        };
      }) => {
        // 1. Generate Order Level QR Code
        const orderQRCode = generateOrderQRCode(order.orderNumber);
        const orderQRData = createQRData("order", orderQRCode, {
          orderId: order.id,
          orderNumber: order.orderNumber,
          buyer: order.buyer.name,
          style: order.style.name,
          totalQuantity: order.totalQuantity,
        });

        // Check if order QR already exists
        const existingOrderQR = await tx.orderQRCode.findUnique({
          where: { orderId: id },
        });

        let orderQR;
        if (existingOrderQR) {
          orderQR = await tx.orderQRCode.update({
            where: { orderId: id },
            data: {
              qrCode: orderQRCode,
              qrData: orderQRData,
            },
          });
        } else {
          orderQR = await tx.orderQRCode.create({
            data: {
              orderId: id,
              qrCode: orderQRCode,
              qrData: orderQRData,
            },
          });
        }

        // 2. Generate Bundle Level QR Codes
        const bundleQRs = [];

        for (const bundle of order.bundles) {
          const bundleQRCode = generateBundleQRCode(
            order.orderNumber,
            bundle.size,
            parseInt(bundle.bundleNumber.split("-").pop() || "0")
          );

          const bundleQRData = createQRData("bundle", bundleQRCode, {
            bundleId: bundle.id,
            bundleNumber: bundle.bundleNumber,
            orderId: order.id,
            orderNumber: order.orderNumber,
            size: bundle.size,
            quantity: bundle.quantity,
            style: order.style.name,
          });

          const existingBundleQR = await tx.bundleQRCode.findUnique({
            where: { bundleId: bundle.id },
          });

          let bundleQR;
          if (existingBundleQR) {
            bundleQR = await tx.bundleQRCode.update({
              where: { bundleId: bundle.id },
              data: {
                qrCode: bundleQRCode,
                qrData: bundleQRData,
              },
            });
          } else {
            bundleQR = await tx.bundleQRCode.create({
              data: {
                bundleId: bundle.id,
                qrCode: bundleQRCode,
                qrData: bundleQRData,
              },
            });
          }

          bundleQRs.push(bundleQR);
        }

        return {
          orderQR,
          bundleQRs,
        };
      }
    );

    return NextResponse.json({
      success: true,
      message: "QR codes generated successfully",
      data: {
        orderQRCode: results.orderQR.qrCode,
        bundleQRCodes: results.bundleQRs.map(
          (qr: { qrCode: any }) => qr.qrCode
        ),
        totalGenerated: results.bundleQRs.length + 1,
      },
    });
  } catch (error) {
    console.error("Error generating QR codes:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate QR codes",
      },
      { status: 500 }
    );
  }
}
