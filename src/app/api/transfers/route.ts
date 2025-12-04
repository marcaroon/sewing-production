// app/api/transfers/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/transfers?orderId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    const where: any = {};
    if (orderId) {
      where.orderId = orderId;
    }

    const transfers = await prisma.transferLog.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: {
        transferDate: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: transfers,
    });
  } catch (error) {
    console.error("Error fetching transfers:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch transfers",
      },
      { status: 500 }
    );
  }
}

// POST /api/transfers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      orderId,
      orderNumber,
      fromDepartment,
      toDepartment,
      handedOverBy,
      receivedBy,
      processStatus,
      items,
      notes,
    } = body;

    // Generate transfer number
    const today = new Date();
    const dateStr = `${today.getFullYear()}${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${today.getDate().toString().padStart(2, "0")}`;

    const transferCount = await prisma.transferLog.count({
      where: {
        transferNumber: {
          contains: dateStr,
        },
      },
    });

    const transferNumber = `TRF-${dateStr}-${(transferCount + 1)
      .toString()
      .padStart(4, "0")}`;

    const transfer = await prisma.transferLog.create({
      data: {
        transferNumber,
        orderId,
        orderNumber,
        fromDepartment,
        toDepartment,
        transferDate: new Date(),
        handedOverBy,
        receivedBy,
        processStatus,
        notes,
        isReceived: true,
        receivedDate: new Date(),
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            bundleNumber: item.bundleNumber,
            quantity: item.quantity,
            unit: item.unit,
            condition: item.condition,
            remarks: item.remarks,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: transfer,
    });
  } catch (error) {
    console.error("Error creating transfer:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create transfer",
      },
      { status: 500 }
    );
  }
}
