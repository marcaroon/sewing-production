// app/api/orders/[id]/route.ts (FIXED)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/orders/[id] - Get order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: (await params).id },
      include: {
        buyer: true,
        style: true,
        // article: true,
        sizeBreakdowns: true,
        processSteps: {
          include: {
            transitions: true,
            rejects: true,
          },
          orderBy: { sequenceOrder: "asc" },
        },
        processTransitions: {
          orderBy: { transitionTime: "desc" },
        },
        rejectLogs: {
          orderBy: { detectedTime: "desc" },
        },
        bundles: {
          include: { qrCode: true },
        },
        qrCode: true,
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

    // Transform to match frontend format with proper null checks
    const transformedOrder = {
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
      article: order.article,
      orderDate: order.orderDate,
      productionStartedAt: order.productionStartedAt,
      productionDeadline: order.productionDeadline,
      deliveryDeadline: order.deliveryDeadline,
      totalQuantity: order.totalQuantity,
      totalCompleted: order.totalCompleted,
      sizeBreakdown: order.sizeBreakdowns,
      currentPhase: order.currentPhase,
      currentProcess: order.currentProcess,
      currentState: order.currentState,
      assignedLine: order.assignedLine,
      assignedTo: order.assignedTo,
      materialsIssued: order.materialsIssued,
      totalRejected: order.totalRejected,
      totalRework: order.totalRework,
      hasLeftover: order.hasLeftover,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      createdBy: order.createdBy,
      notes: order.notes || undefined,
      processSteps: order.processSteps,
      processTransitions: order.processTransitions,
      rejectLogs: order.rejectLogs,
      bundles: order.bundles,
      qrCode: order.qrCode,
    };

    return NextResponse.json({
      success: true,
      data: transformedOrder,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch order",
      },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - Update order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;

    // Hanya allow update field-field yang masih relevan di NEW flow
    const {
      assignedLine,
      assignedTo,
      totalCompleted,
      totalRejected,
      totalRework,
      materialsIssued,
      hasLeftover,
      notes,
    } = body;

    const updateData: any = {};

    if (assignedLine !== undefined) updateData.assignedLine = assignedLine;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (totalCompleted !== undefined)
      updateData.totalCompleted = totalCompleted;
    if (totalRejected !== undefined) updateData.totalRejected = totalRejected;
    if (totalRework !== undefined) updateData.totalRework = totalRework;
    if (materialsIssued !== undefined)
      updateData.materialsIssued = materialsIssued;
    if (hasLeftover !== undefined) updateData.hasLeftover = hasLeftover;
    if (notes !== undefined) updateData.notes = notes;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        buyer: true,
        style: true,
        sizeBreakdowns: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update order",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - Delete order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await prisma.order.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete order",
      },
      { status: 500 }
    );
  }
}
