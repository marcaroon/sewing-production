// src/app/api/materials/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/materials
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const lowStock = searchParams.get("lowStock");

    const where: any = {};
    if (category) where.category = category;

    const materials = await prisma.material.findMany({
      where,
      include: {
        stockTransactions: {
          orderBy: { transactionDate: "desc" },
          take: 10,
        },
      },
      orderBy: { materialCode: "asc" },
    });

    // Calculate current stock for each material
    const materialsWithStock = await Promise.all(
      materials.map(async (material) => {
        const stockResult = await prisma.materialStockTransaction.aggregate({
          where: { materialId: material.id },
          _sum: {
            quantity: true,
          },
        });

        const currentStock = stockResult._sum.quantity || 0;
        const isLowStock = currentStock <= material.minimumStock;

        return {
          ...material,
          currentStock,
          isLowStock,
        };
      })
    );

    // Filter low stock if requested
    const filtered =
      lowStock === "true"
        ? materialsWithStock.filter((m) => m.isLowStock)
        : materialsWithStock;

    return NextResponse.json({
      success: true,
      data: filtered,
    });
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}

// POST /api/materials
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      materialCode,
      name,
      category,
      unit,
      color,
      supplier,
      minimumStock,
      reorderPoint,
      unitPrice,
      initialStock,
      performedBy,
    } = body;

    const material = await prisma.material.create({
      data: {
        materialCode,
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

    // Create initial stock transaction if provided
    if (initialStock && initialStock > 0) {
      await prisma.materialStockTransaction.create({
        data: {
          materialId: material.id,
          transactionType: "in",
          quantity: initialStock,
          unit: material.unit,
          referenceType: "initial",
          remarks: "Initial stock",
          performedBy: performedBy || "SYSTEM",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: material,
    });
  } catch (error) {
    console.error("Error creating material:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create material" },
      { status: 500 }
    );
  }
}
