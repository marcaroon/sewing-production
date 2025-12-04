// app/api/sewing-lines/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/sewing-lines
export async function GET() {
  try {
    const sewingLines = await prisma.sewingLine.findMany({
      orderBy: {
        lineCode: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: sewingLines,
    });
  } catch (error) {
    console.error("Error fetching sewing lines:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch sewing lines",
      },
      { status: 500 }
    );
  }
}

// POST /api/sewing-lines
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      lineName,
      lineCode,
      capacity,
      currentLoad,
      operators,
      supervisor,
      status,
    } = body;

    const sewingLine = await prisma.sewingLine.create({
      data: {
        lineName,
        lineCode,
        capacity,
        currentLoad: currentLoad || 0,
        operators,
        supervisor,
        status: status || "active",
      },
    });

    return NextResponse.json({
      success: true,
      data: sewingLine,
    });
  } catch (error) {
    console.error("Error creating sewing line:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create sewing line",
      },
      { status: 500 }
    );
  }
}
