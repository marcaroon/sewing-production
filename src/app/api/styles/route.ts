// app/api/styles/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/styles - Get all styles
export async function GET() {
  try {
    const styles = await prisma.style.findMany({
      orderBy: {
        styleCode: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: styles,
    });
  } catch (error) {
    console.error("Error fetching styles:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch styles",
      },
      { status: 500 }
    );
  }
}

// POST /api/styles - Create new style
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      styleCode,
      name,
      category,
      description,
      imageUrl,
      estimatedCuttingTime,
      estimatedSewingTime,
    } = body;

    const style = await prisma.style.create({
      data: {
        styleCode,
        name,
        category,
        description,
        imageUrl,
        estimatedCuttingTime,
        estimatedSewingTime,
      },
    });

    return NextResponse.json({
      success: true,
      data: style,
    });
  } catch (error) {
    console.error("Error creating style:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create style",
      },
      { status: 500 }
    );
  }
}
