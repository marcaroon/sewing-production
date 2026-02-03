// src/app/api/orders/[id]/generate-barcode/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  generateOrderBarcode,
  generateBundleBarcode,
  createBarcodeData,
} from "@/lib/barcode-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const results = await prisma.$transaction(async (tx: any) => {
      const articleCode = order.article || "GEN";
      // 1. Generate Order Level Barcode
      const orderBarcode = generateOrderBarcode(order.orderNumber, articleCode);

      const orderBarcodeData = createBarcodeData("order", orderBarcode, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        article: order.article,
        buyer: order.buyer.name,
        style: order.style.name,
        totalQuantity: order.totalQuantity,
      });

      const existingOrderBarcode = await tx.orderQRCode.findUnique({
        where: { orderId: id },
      });

      let orderBC;
      if (existingOrderBarcode) {
        orderBC = await tx.orderQRCode.update({
          where: { orderId: id },
          data: {
            qrCode: orderBarcode,
            qrData: orderBarcodeData,
          },
        });
      } else {
        orderBC = await tx.orderQRCode.create({
          data: {
            orderId: id,
            qrCode: orderBarcode,
            qrData: orderBarcodeData,
          },
        });
      }

      // 2. Generate Bundle Level Barcodes
      const bundleBarcodes = [];

      for (const bundle of order.bundles) {
        const bundleBarcode = generateBundleBarcode(
          order.orderNumber,
          articleCode,
          bundle.size,
          parseInt(bundle.bundleNumber.split("-").pop() || "0")
        );

        const bundleBarcodeData = createBarcodeData("bundle", bundleBarcode, {
          bundleId: bundle.id,
          bundleNumber: bundle.bundleNumber,
          orderId: order.id,
          orderNumber: order.orderNumber,
          article: articleCode,
          size: bundle.size,
          quantity: bundle.quantity,
          style: order.style.name,
        });

        const existingBundleBarcode = await tx.bundleQRCode.findUnique({
          where: { bundleId: bundle.id },
        });

        let bundleBC;
        if (existingBundleBarcode) {
          bundleBC = await tx.bundleQRCode.update({
            where: { bundleId: bundle.id },
            data: {
              qrCode: bundleBarcode,
              qrData: bundleBarcodeData,
            },
          });
        } else {
          bundleBC = await tx.bundleQRCode.create({
            data: {
              bundleId: bundle.id,
              qrCode: bundleBarcode,
              qrData: bundleBarcodeData,
            },
          });
        }

        bundleBarcodes.push(bundleBC);
      }

      return {
        orderBarcode: orderBC,
        bundleBarcodes,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Barcodes generated successfully",
      data: {
        orderBarcode: results.orderBarcode.qrCode,
        bundleBarcodes: results.bundleBarcodes.map((bc: any) => bc.qrCode),
        totalGenerated: results.bundleBarcodes.length + 1,
      },
    });
  } catch (error) {
    console.error("Error generating barcodes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate barcodes" },
      { status: 500 }
    );
  }
}
