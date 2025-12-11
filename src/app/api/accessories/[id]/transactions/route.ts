// src/app/api/accessories/[id]/transactions/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/accessories/[id]/transactions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessoryId = (await params).id;
    const body = await request.json();

    const {
      transactionType,
      quantity,
      referenceType,
      referenceId,
      remarks,
      performedBy,
    } = body;

    // Validate accessory exists
    const accessory = await prisma.accessory.findUnique({
      where: { id: accessoryId },
    });

    if (!accessory) {
      return NextResponse.json(
        { success: false, error: "Accessory not found" },
        { status: 404 }
      );
    }

    // For "out" transactions, check if enough stock
    if (transactionType === "out") {
      const stockResult = await prisma.accessoryStockTransaction.aggregate({
        where: { accessoryId },
        _sum: { quantity: true },
      });

      const currentStock = stockResult._sum.quantity || 0;

      if (currentStock < quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock. Current: ${currentStock} ${accessory.unit}, Requested: ${quantity} ${accessory.unit}`,
          },
          { status: 400 }
        );
      }
    }

    // Adjust quantity for "out" transactions (negative)
    const adjustedQuantity =
      transactionType === "out" ? -Math.abs(quantity) : Math.abs(quantity);

    const transaction = await prisma.accessoryStockTransaction.create({
      data: {
        accessoryId,
        transactionType,
        quantity: adjustedQuantity,
        unit: accessory.unit,
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

// GET /api/accessories/[id]/transactions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessoryId = (await params).id;

    const transactions = await prisma.accessoryStockTransaction.findMany({
      where: { accessoryId },
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
