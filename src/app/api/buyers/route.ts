// app/api/buyers/route.ts (FIXED)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/buyers - Get all buyers
export async function GET() {
  try {
    const buyers = await prisma.buyer.findMany({
      orderBy: {
        name: "asc",
      },
    });

    // Transform to match frontend format with proper null checks
    const transformedBuyers = buyers.map((buyer) => ({
      id: buyer.id,
      name: buyer.name,
      type: buyer.type,
      code: buyer.code,
      contactPerson: buyer.contactPerson || undefined,
      phone: buyer.phone || undefined,
      leftoverPolicy: {
        canReuse: buyer.canReuse || false,
        returRequired: buyer.returRequired || false,
        storageLocation: buyer.storageLocation || undefined,
      },
    }));

    return NextResponse.json({
      success: true,
      data: transformedBuyers,
    });
  } catch (error) {
    console.error("Error fetching buyers:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch buyers",
      },
      { status: 500 }
    );
  }
}

// POST /api/buyers - Create new buyer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, type, code, contactPerson, phone, leftoverPolicy } = body;

    const buyer = await prisma.buyer.create({
      data: {
        name,
        type,
        code,
        contactPerson: contactPerson || null,
        phone: phone || null,
        canReuse: leftoverPolicy?.canReuse || false,
        returRequired: leftoverPolicy?.returRequired || false,
        storageLocation: leftoverPolicy?.storageLocation || null,
      },
    });

    // Transform response to match frontend format
    const transformedBuyer = {
      id: buyer.id,
      name: buyer.name,
      type: buyer.type,
      code: buyer.code,
      contactPerson: buyer.contactPerson || undefined,
      phone: buyer.phone || undefined,
      leftoverPolicy: {
        canReuse: buyer.canReuse,
        returRequired: buyer.returRequired,
        storageLocation: buyer.storageLocation || undefined,
      },
    };

    return NextResponse.json({
      success: true,
      data: transformedBuyer,
    });
  } catch (error) {
    console.error("Error creating buyer:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create buyer",
      },
      { status: 500 }
    );
  }
}