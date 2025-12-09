// app/api/orders/route.ts - FIXED VERSION

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  PRODUCTION_PROCESSES,
  PROCESS_DEPARTMENT_MAP,
} from "@/lib/constants-new";

// GET /api/orders - Get all orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phase = searchParams.get("phase");
    const process = searchParams.get("process");
    const state = searchParams.get("state");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {};

    if (phase) {
      where.currentPhase = phase;
    }

    if (process) {
      where.currentProcess = process;
    }

    if (state) {
      where.currentState = state;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { buyer: { name: { contains: search, mode: "insensitive" } } },
        { style: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        buyer: true,
        style: true,
        sizeBreakdowns: true,
        processSteps: {
          orderBy: { sequenceOrder: "asc" },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
    });

    // Transform to match frontend format with proper null checks
    const transformedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      buyer: {
        id: order.buyer.id,
        name: order.buyer.name,
        type: order.buyer.type,
        code: order.buyer.code,
        contactPerson: order.buyer.contactPerson || undefined,
        phone: order.buyer.phone || undefined,
        leftoverPolicy: {
          canReuse: order.buyer.canReuse || false,
          returRequired: order.buyer.returRequired || false,
          storageLocation: order.buyer.storageLocation || undefined,
        },
      },
      style: order.style,
      orderDate: order.orderDate,
      productionDeadline: order.productionDeadline,
      deliveryDeadline: order.deliveryDeadline,
      totalQuantity: order.totalQuantity,
      totalCompleted: order.totalCompleted,
      sizeBreakdown: order.sizeBreakdowns,
      currentPhase: order.currentPhase,
      currentProcess: order.currentProcess,
      currentState: order.currentState,
      assignedLine: order.assignedLine || undefined,
      assignedTo: order.assignedTo || undefined,
      materialsIssued: order.materialsIssued,
      totalRejected: order.totalRejected,
      totalRework: order.totalRework,
      hasLeftover: order.hasLeftover,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      createdBy: order.createdBy,
      notes: order.notes || undefined,
      processSteps: order.processSteps,
    }));

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
        details: error instanceof Error ? error.message : "Unknown error",
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
      buyerId,
      styleId,
      orderDate,
      productionDeadline,
      deliveryDeadline,
      totalQuantity,
      sizeBreakdown,
      createdBy,
      notes,
    } = body;

    // Validate deadlines
    if (new Date(deliveryDeadline) <= new Date(productionDeadline)) {
      return NextResponse.json(
        {
          success: false,
          error: "Delivery deadline must be after production deadline",
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Generate order number
      const year = new Date().getFullYear();
      const count = await tx.order.count({
        where: {
          orderNumber: { startsWith: `ORD-${year}` },
        },
      });
      const orderNumber = `ORD-${year}-${String(count + 1).padStart(5, "0")}`;

      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          buyerId,
          styleId,
          orderDate: new Date(orderDate),
          productionDeadline: new Date(productionDeadline),
          deliveryDeadline: new Date(deliveryDeadline),
          totalQuantity,
          currentPhase: "production",
          currentProcess: "draft",
          currentState: "at_ppic",
          createdBy,
          notes: notes || null,
          sizeBreakdowns: {
            create: sizeBreakdown.map((sb: any) => ({
              size: sb.size,
              quantity: sb.quantity,
              completed: 0,
              rejected: 0,
              bundleCount: Math.ceil(sb.quantity / 10),
            })),
          },
        },
        include: {
          buyer: true,
          style: true,
          sizeBreakdowns: true,
        },
      });

      // Create first process step (draft)
      const firstProcessStep = await tx.processStep.create({
        data: {
          orderId: order.id,
          processName: "draft",
          processPhase: "production",
          sequenceOrder: 1,
          department: PROCESS_DEPARTMENT_MAP["draft"],
          status: "pending",
          quantityReceived: totalQuantity,
          arrivedAtPpicTime: new Date(),
        },
      });

      // Create initial transition
      await tx.processTransition.create({
        data: {
          orderId: order.id,
          processStepId: firstProcessStep.id,
          fromState: "at_ppic",
          toState: "at_ppic",
          transitionTime: new Date(),
          performedBy: createdBy,
          processName: "draft",
          department: PROCESS_DEPARTMENT_MAP["draft"],
          notes: "Order created",
        },
      });

      return order;
    });

    // Transform response
    const transformedOrder = {
      id: result.id,
      orderNumber: result.orderNumber,
      buyer: {
        id: result.buyer.id,
        name: result.buyer.name,
        type: result.buyer.type,
        code: result.buyer.code,
        contactPerson: result.buyer.contactPerson || undefined,
        phone: result.buyer.phone || undefined,
        leftoverPolicy: {
          canReuse: result.buyer.canReuse || false,
          returRequired: result.buyer.returRequired || false,
          storageLocation: result.buyer.storageLocation || undefined,
        },
      },
      style: result.style,
      orderDate: result.orderDate,
      productionDeadline: result.productionDeadline,
      deliveryDeadline: result.deliveryDeadline,
      totalQuantity: result.totalQuantity,
      totalCompleted: 0,
      sizeBreakdown: result.sizeBreakdowns,
      currentPhase: "production",
      currentProcess: "draft",
      currentState: "at_ppic",
      materialsIssued: false,
      totalRejected: 0,
      totalRework: 0,
      hasLeftover: false,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      createdBy: result.createdBy,
      notes: result.notes || undefined,
    };

    return NextResponse.json({
      success: true,
      data: transformedOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
