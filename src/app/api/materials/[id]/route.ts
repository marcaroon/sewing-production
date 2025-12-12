// src/app/api/materials/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/materials/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const materialId = (await params).id;

    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        stockTransactions: {
          orderBy: { transactionDate: "desc" },
          take: 20,
        },
        orderMaterials: {
          include: {
            order: {
              select: {
                orderNumber: true,
                buyer: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!material) {
      return NextResponse.json(
        { success: false, error: "Material not found" },
        { status: 404 }
      );
    }

    // Calculate current stock
    const stockResult = await prisma.materialStockTransaction.aggregate({
      where: { materialId },
      _sum: { quantity: true },
    });

    const currentStock = stockResult._sum.quantity || 0;
    const isLowStock = currentStock <= material.minimumStock;

    return NextResponse.json({
      success: true,
      data: {
        ...material,
        currentStock,
        isLowStock,
      },
    });
  } catch (error) {
    console.error("Error fetching material:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch material" },
      { status: 500 }
    );
  }
}

// PUT /api/materials/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const materialId = (await params).id;
    const body = await request.json();

    const {
      name,
      category,
      unit,
      color,
      supplier,
      minimumStock,
      reorderPoint,
      unitPrice,
    } = body;

    const material = await prisma.material.update({
      where: { id: materialId },
      data: {
        name,
        category,
        unit,
        color: color || null,
        supplier: supplier || null,
        minimumStock: minimumStock || 0,
        reorderPoint: reorderPoint || 0,
        unitPrice: unitPrice || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: material,
      message: "Material updated successfully",
    });
  } catch (error) {
    console.error("Error updating material:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update material" },
      { status: 500 }
    );
  }
}

// DELETE /api/materials/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const materialId = (await params).id;

    // Check if material is used in any orders
    const orderMaterials = await prisma.orderMaterial.count({
      where: { materialId },
    });

    if (orderMaterials > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete material. It is used in ${orderMaterials} order(s).`,
        },
        { status: 400 }
      );
    }

    // Delete transactions first
    await prisma.materialStockTransaction.deleteMany({
      where: { materialId },
    });

    // Delete material
    await prisma.material.delete({
      where: { id: materialId },
    });

    return NextResponse.json({
      success: true,
      message: "Material deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting material:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete material" },
      { status: 500 }
    );
  }
}
