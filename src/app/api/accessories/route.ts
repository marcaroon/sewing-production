// src/app/api/accessories/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/accessories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const lowStock = searchParams.get("lowStock");

    const where: any = {};
    if (category) where.category = category;

    const accessories = await prisma.accessory.findMany({
      where,
      include: {
        stockTransactions: {
          orderBy: { transactionDate: "desc" },
          take: 10,
        },
      },
      orderBy: { accessoryCode: "asc" },
    });

    // Calculate current stock for each accessory
    const accessoriesWithStock = await Promise.all(
      accessories.map(async (accessory) => {
        const stockResult = await prisma.accessoryStockTransaction.aggregate({
          where: { accessoryId: accessory.id },
          _sum: {
            quantity: true,
          },
        });

        const currentStock = stockResult._sum.quantity || 0;
        const isLowStock = currentStock <= accessory.minimumStock;

        return {
          ...accessory,
          currentStock,
          isLowStock,
        };
      })
    );

    // Filter low stock if requested
    const filtered =
      lowStock === "true"
        ? accessoriesWithStock.filter((a) => a.isLowStock)
        : accessoriesWithStock;

    return NextResponse.json({
      success: true,
      data: filtered,
    });
  } catch (error) {
    console.error("Error fetching accessories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch accessories" },
      { status: 500 }
    );
  }
}

// POST /api/accessories
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      accessoryCode,
      name,
      category,
      unit,
      color,
      size,
      supplier,
      minimumStock,
      reorderPoint,
      unitPrice,
      initialStock,
      performedBy,
    } = body;

    const accessory = await prisma.accessory.create({
      data: {
        accessoryCode,
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

    // Create initial stock transaction if provided
    if (initialStock && initialStock > 0) {
      await prisma.accessoryStockTransaction.create({
        data: {
          accessoryId: accessory.id,
          transactionType: "in",
          quantity: initialStock,
          unit: accessory.unit,
          referenceType: "initial",
          remarks: "Initial stock",
          performedBy: performedBy || "SYSTEM",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: accessory,
    });
  } catch (error) {
    console.error("Error creating accessory:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create accessory" },
      { status: 500 }
    );
  }
}
