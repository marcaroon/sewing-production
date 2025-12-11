// src/app/api/materials/[id]/transactions/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/materials/[id]/transactions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const materialId = (await params).id;
    const body = await request.json();

    const {
      transactionType,
      quantity,
      referenceType,
      referenceId,
      remarks,
      performedBy,
    } = body;

    // Validate material exists
    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      return NextResponse.json(
        { success: false, error: "Material not found" },
        { status: 404 }
      );
    }

    // For "out" transactions, check if enough stock
    if (transactionType === "out") {
      const stockResult = await prisma.materialStockTransaction.aggregate({
        where: { materialId },
        _sum: { quantity: true },
      });

      const currentStock = stockResult._sum.quantity || 0;

      if (currentStock < quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock. Current: ${currentStock} ${material.unit}, Requested: ${quantity} ${material.unit}`,
          },
          { status: 400 }
        );
      }
    }

    // Adjust quantity for "out" transactions (negative)
    const adjustedQuantity =
      transactionType === "out" ? -Math.abs(quantity) : Math.abs(quantity);

    const transaction = await prisma.materialStockTransaction.create({
      data: {
        materialId,
        transactionType,
        quantity: adjustedQuantity,
        unit: material.unit,
        referenceType: referenceType || null,
        referenceId: referenceId || null,
        remarks: remarks || null,
        performedBy,
      },
    });

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

// GET /api/materials/[id]/transactions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const materialId = (await params).id;

    const transactions = await prisma.materialStockTransaction.findMany({
      where: { materialId },
      orderBy: { transactionDate: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
