import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PRODUCTION_PROCESSES, PROCESS_DEPARTMENT_MAP } from "@/lib/constants-new";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phase = searchParams.get("phase");
    const process = searchParams.get("process");
    const state = searchParams.get("state");
    const search = searchParams.get("search");

    const where: any = {};

    if (phase) where.currentPhase = phase;
    if (process) where.currentProcess = process;
    if (state) where.currentState = state;

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
        processSteps: {
          orderBy: { sequenceOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

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
          notes,
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

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}