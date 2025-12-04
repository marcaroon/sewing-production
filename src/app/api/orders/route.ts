// app/api/orders/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/orders - Get all orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const buyerId = searchParams.get("buyerId");
    const search = searchParams.get("search");

    const where: any = {};

    if (status && status !== "all") {
      where.currentStatus = status;
    }

    if (buyerId) {
      where.buyerId = buyerId;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { buyer: { name: { contains: search } } },
        { style: { name: { contains: search } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        buyer: true,
        style: true,
        sizeBreakdowns: true,
        _count: {
          select: {
            transferLogs: true,
            processHistories: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data to match frontend format
    const transformedOrders = orders.map(
      (order: {
        id: any;
        orderNumber: any;
        buyer: any;
        style: any;
        orderDate: any;
        targetDate: any;
        totalQuantity: any;
        sizeBreakdowns: any;
        currentStatus: any;
        assignedLine: any;
        progressCutting: any;
        progressNumbering: any;
        progressShiwake: any;
        progressSewing: any;
        progressQc: any;
        progressIroning: any;
        progressFinalQc: any;
        progressPacking: any;
        materialsIssued: any;
        wipAtCutting: any;
        wipAtNumbering: any;
        wipAtShiwake: any;
        wipAtSewing: any;
        wipAtQC: any;
        wipAtIroning: any;
        wipAtPacking: any;
        leadTimeCutting: any;
        leadTimeNumbering: any;
        leadTimeShiwake: any;
        leadTimeSewing: any;
        leadTimeQc: any;
        leadTimeIroning: any;
        leadTimeFinalQc: any;
        leadTimePacking: any;
        totalRejected: any;
        totalRework: any;
        hasLeftover: any;
        createdAt: any;
        updatedAt: any;
        createdBy: any;
        notes: any;
      }) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        buyer: order.buyer,
        style: order.style,
        orderDate: order.orderDate,
        targetDate: order.targetDate,
        totalQuantity: order.totalQuantity,
        sizeBreakdown: order.sizeBreakdowns,
        currentStatus: order.currentStatus,
        assignedLine: order.assignedLine,
        progress: {
          cutting: order.progressCutting,
          numbering: order.progressNumbering,
          shiwake: order.progressShiwake,
          sewing: order.progressSewing,
          qc: order.progressQc,
          ironing: order.progressIroning,
          finalQc: order.progressFinalQc,
          packing: order.progressPacking,
        },
        materialsIssued: order.materialsIssued,
        wip: {
          atCutting: order.wipAtCutting,
          atNumbering: order.wipAtNumbering,
          atShiwake: order.wipAtShiwake,
          atSewing: order.wipAtSewing,
          atQC: order.wipAtQC,
          atIroning: order.wipAtIroning,
          atPacking: order.wipAtPacking,
        },
        leadTime: {
          cutting: order.leadTimeCutting,
          numbering: order.leadTimeNumbering,
          shiwake: order.leadTimeShiwake,
          sewing: order.leadTimeSewing,
          qc: order.leadTimeQc,
          ironing: order.leadTimeIroning,
          finalQc: order.leadTimeFinalQc,
          packing: order.leadTimePacking,
        },
        totalRejected: order.totalRejected,
        totalRework: order.totalRework,
        hasLeftover: order.hasLeftover,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        createdBy: order.createdBy,
        notes: order.notes,
      })
    );

    return NextResponse.json({
      success: true,
      data: transformedOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch orders",
      },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      orderNumber,
      buyerId,
      styleId,
      orderDate,
      targetDate,
      totalQuantity,
      sizeBreakdown,
      createdBy,
      notes,
    } = body;

    // Create order with size breakdowns
    const order = await prisma.order.create({
      data: {
        orderNumber,
        buyerId,
        styleId,
        orderDate: new Date(orderDate),
        targetDate: new Date(targetDate),
        totalQuantity,
        currentStatus: "draft",
        createdBy,
        notes,
        sizeBreakdowns: {
          create: sizeBreakdown.map((sb: any) => ({
            size: sb.size,
            quantity: sb.quantity,
            completed: sb.completed || 0,
            rejected: sb.rejected || 0,
            bundleCount: sb.bundleCount || 0,
          })),
        },
      },
      include: {
        buyer: true,
        style: true,
        sizeBreakdowns: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create order",
      },
      { status: 500 }
    );
  }
}
