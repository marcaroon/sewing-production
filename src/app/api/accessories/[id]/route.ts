// src/app/api/accessories/[id]/route.ts - ADD GET, PUT, DELETE

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/accessories/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessoryId = (await params).id;

    const accessory = await prisma.accessory.findUnique({
      where: { id: accessoryId },
      include: {
        stockTransactions: {
          orderBy: { transactionDate: "desc" },
          take: 20,
        },
      },
    });

    if (!accessory) {
      return NextResponse.json(
        { success: false, error: "Accessory not found" },
        { status: 404 }
      );
    }

    // Calculate current stock
    const stockResult = await prisma.accessoryStockTransaction.aggregate({
      where: { accessoryId },
      _sum: { quantity: true },
    });

    const currentStock = stockResult._sum.quantity || 0;
    const isLowStock = currentStock <= accessory.minimumStock;

    return NextResponse.json({
      success: true,
      data: {
        ...accessory,
        currentStock,
        isLowStock,
      },
    });
  } catch (error) {
    console.error("Error fetching accessory:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch accessory" },
      { status: 500 }
    );
  }
}

// PUT /api/accessories/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessoryId = (await params).id;
    const body = await request.json();

    const {
      name,
      category,
      unit,
      color,
      size,
      supplier,
      minimumStock,
      reorderPoint,
      unitPrice,
    } = body;

    const accessory = await prisma.accessory.update({
      where: { id: accessoryId },
      data: {
        name,
        category,
        unit,
        color: color || null,
        size: size || null,
        supplier: supplier || null,
        minimumStock: minimumStock || 0,
        reorderPoint: reorderPoint || 0,
        unitPrice: unitPrice || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: accessory,
      message: "Accessory updated successfully",
    });
  } catch (error) {
    console.error("Error updating accessory:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update accessory" },
      { status: 500 }
    );
  }
}

// DELETE /api/accessories/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessoryId = (await params).id;

    // Check if accessory is used in any orders
    const orderAccessories = await prisma.orderAccessory.count({
      where: { accessoryId },
    });

    if (orderAccessories > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete accessory. It is used in ${orderAccessories} order(s).`,
        },
        { status: 400 }
      );
    }

    // Delete transactions first
    await prisma.accessoryStockTransaction.deleteMany({
      where: { accessoryId },
    });

    // Delete accessory
    await prisma.accessory.delete({
      where: { id: accessoryId },
    });

    return NextResponse.json({
      success: true,
      message: "Accessory deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting accessory:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete accessory" },
      { status: 500 }
    );
  }
}
