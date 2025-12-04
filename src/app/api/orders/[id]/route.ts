// app/api/orders/[id]/route.ts

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
        sizeBreakdowns: true,
        transferLogs: {
          include: {
            items: true,
          },
          orderBy: {
            transferDate: "desc",
          },
        },
        processHistories: {
          orderBy: {
            timestamp: "desc",
          },
        },
        rejectLogs: {
          orderBy: {
            date: "desc",
          },
        },
        bundles: true,
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

    // Transform to match frontend format
    const transformedOrder = {
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
      transferLogs: order.transferLogs,
      processHistories: order.processHistories,
      rejectLogs: order.rejectLogs,
      bundles: order.bundles,
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

    const {
      currentStatus,
      assignedLine,
      progress,
      wip,
      leadTime,
      totalRejected,
      totalRework,
      materialsIssued,
      hasLeftover,
      notes,
    } = body;

    const updateData: any = {};

    if (currentStatus !== undefined) updateData.currentStatus = currentStatus;
    if (assignedLine !== undefined) updateData.assignedLine = assignedLine;
    if (totalRejected !== undefined) updateData.totalRejected = totalRejected;
    if (totalRework !== undefined) updateData.totalRework = totalRework;
    if (materialsIssued !== undefined)
      updateData.materialsIssued = materialsIssued;
    if (hasLeftover !== undefined) updateData.hasLeftover = hasLeftover;
    if (notes !== undefined) updateData.notes = notes;

    // Progress
    if (progress) {
      if (progress.cutting !== undefined)
        updateData.progressCutting = progress.cutting;
      if (progress.numbering !== undefined)
        updateData.progressNumbering = progress.numbering;
      if (progress.shiwake !== undefined)
        updateData.progressShiwake = progress.shiwake;
      if (progress.sewing !== undefined)
        updateData.progressSewing = progress.sewing;
      if (progress.qc !== undefined) updateData.progressQc = progress.qc;
      if (progress.ironing !== undefined)
        updateData.progressIroning = progress.ironing;
      if (progress.finalQc !== undefined)
        updateData.progressFinalQc = progress.finalQc;
      if (progress.packing !== undefined)
        updateData.progressPacking = progress.packing;
    }

    // WIP
    if (wip) {
      if (wip.atCutting !== undefined) updateData.wipAtCutting = wip.atCutting;
      if (wip.atNumbering !== undefined)
        updateData.wipAtNumbering = wip.atNumbering;
      if (wip.atShiwake !== undefined) updateData.wipAtShiwake = wip.atShiwake;
      if (wip.atSewing !== undefined) updateData.wipAtSewing = wip.atSewing;
      if (wip.atQC !== undefined) updateData.wipAtQC = wip.atQC;
      if (wip.atIroning !== undefined) updateData.wipAtIroning = wip.atIroning;
      if (wip.atPacking !== undefined) updateData.wipAtPacking = wip.atPacking;
    }

    // Lead Time
    if (leadTime) {
      if (leadTime.cutting !== undefined)
        updateData.leadTimeCutting = leadTime.cutting;
      if (leadTime.numbering !== undefined)
        updateData.leadTimeNumbering = leadTime.numbering;
      if (leadTime.shiwake !== undefined)
        updateData.leadTimeShiwake = leadTime.shiwake;
      if (leadTime.sewing !== undefined)
        updateData.leadTimeSewing = leadTime.sewing;
      if (leadTime.qc !== undefined) updateData.leadTimeQc = leadTime.qc;
      if (leadTime.ironing !== undefined)
        updateData.leadTimeIroning = leadTime.ironing;
      if (leadTime.finalQc !== undefined)
        updateData.leadTimeFinalQc = leadTime.finalQc;
      if (leadTime.packing !== undefined)
        updateData.leadTimePacking = leadTime.packing;
    }

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
