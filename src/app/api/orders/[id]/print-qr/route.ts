// app/api/orders/[id]/print-qr/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateBulkQRLabels } from "@/lib/qr-utils";

// GET /api/orders/[id]/print-qr?type=order|bundle|all
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";

    const order = await prisma.order.findUnique({
      where: { id: (await params).id },
      include: {
        buyer: true,
        style: true,
        qrCode: true,
        bundles: {
          include: {
            qrCode: true,
          },
        },
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

    const labels: Array<{ code: string; text: string; subtitle?: string }> = [];

    // Add order QR if requested
    if ((type === "order" || type === "all") && order.qrCode) {
      labels.push({
        code: order.qrCode.qrCode,
        text: order.orderNumber,
        subtitle: `${order.buyer.name} - ${order.style.name}`,
      });
    }

    // Add bundle QRs if requested
    if (type === "bundle" || type === "all") {
      for (const bundle of order.bundles) {
        if (bundle.qrCode) {
          labels.push({
            code: bundle.qrCode.qrCode,
            text: bundle.bundleNumber,
            subtitle: `Size ${bundle.size} - ${bundle.quantity} pcs`,
          });
        }
      }
    }

    if (labels.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No QR codes found. Please generate QR codes first.",
        },
        { status: 404 }
      );
    }

    // Generate HTML for printing
    const html = await generateBulkQRLabels(labels);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="qr-labels-${order.orderNumber}.html"`,
      },
    });
  } catch (error) {
    console.error("Error generating print labels:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate print labels",
      },
      { status: 500 }
    );
  }
}
