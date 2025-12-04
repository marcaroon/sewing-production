// app/api/buyers/route.ts

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

    // Transform to match frontend format
    const transformedBuyers = buyers.map(
      (buyer: {
        id: any;
        name: any;
        type: any;
        code: any;
        contactPerson: any;
        phone: any;
        canReuse: any;
        returRequired: any;
        storageLocation: any;
      }) => ({
        id: buyer.id,
        name: buyer.name,
        type: buyer.type,
        code: buyer.code,
        contactPerson: buyer.contactPerson,
        phone: buyer.phone,
        leftoverPolicy: {
          canReuse: buyer.canReuse,
          returRequired: buyer.returRequired,
          storageLocation: buyer.storageLocation,
        },
      })
    );

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
        contactPerson,
        phone,
        canReuse: leftoverPolicy.canReuse,
        returRequired: leftoverPolicy.returRequired,
        storageLocation: leftoverPolicy.storageLocation,
      },
    });

    return NextResponse.json({
      success: true,
      data: buyer,
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
