// app/api/orders/[id]/update-status/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/orders/[id]/update-status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Tambahkan error handling untuk empty body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or empty request body. Please provide valid JSON.",
        },
        { status: 400 }
      );
    }

    const { id } = await params;
    const { newStatus, performedBy, notes, transferData } = body;

    // ✅ Validasi required fields
    if (!newStatus || !performedBy) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: newStatus and performedBy are required.",
        },
        { status: 400 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(
      async (tx: {
        order: {
          update: (arg0: {
            where: { id: string };
            data: { currentStatus: any };
            include: {
              buyer: boolean;
              style: boolean;
              sizeBreakdowns: boolean;
            };
          }) => any;
        };
        processHistory: {
          create: (arg0: {
            data: {
              orderId: string;
              timestamp: Date;
              processStatus: any;
              action: string;
              performedBy: any;
              department: any;
              notes: any;
            };
          }) => any;
          update: (arg0: {
            where: { id: any };
            data: { transferLogId: any };
          }) => any;
        };
        transferLog: {
          count: (arg0: {
            where: { transferNumber: { contains: string } };
          }) => any;
          create: (arg0: {
            data: {
              transferNumber: string;
              orderId: string;
              orderNumber: any;
              fromDepartment: any;
              toDepartment: any;
              transferDate: Date;
              handedOverBy: any;
              receivedBy: any;
              processStatus: any;
              notes: any;
              isReceived: boolean;
              receivedDate: Date;
              items: { create: any };
            };
            include: { items: boolean };
          }) => any;
        };
      }) => {
        // 1. Update order status
        const updatedOrder = await tx.order.update({
          where: { id },
          data: {
            currentStatus: newStatus,
          },
          include: {
            buyer: true,
            style: true,
            sizeBreakdowns: true,
          },
        });

        // 2. Create process history log
        const historyLog = await tx.processHistory.create({
          data: {
            orderId: id,
            timestamp: new Date(),
            processStatus: newStatus,
            action: `Status diubah ke ${newStatus}`,
            performedBy,
            department: transferData?.fromDepartment || "",
            notes: notes || "",
          },
        });

        // 3. Create transfer log if transfer data provided
        let transferLog = null;
        if (transferData) {
          // Generate transfer number
          const today = new Date();
          const dateStr = `${today.getFullYear()}${(today.getMonth() + 1)
            .toString()
            .padStart(2, "0")}${today.getDate().toString().padStart(2, "0")}`;

          const transferCount = await tx.transferLog.count({
            where: {
              transferNumber: {
                contains: dateStr,
              },
            },
          });

          const transferNumber = `TRF-${dateStr}-${(transferCount + 1)
            .toString()
            .padStart(4, "0")}`;

          transferLog = await tx.transferLog.create({
            data: {
              transferNumber,
              orderId: id,
              orderNumber: updatedOrder.orderNumber,
              fromDepartment: transferData.fromDepartment,
              toDepartment: transferData.toDepartment,
              transferDate: new Date(),
              handedOverBy: performedBy,
              receivedBy: transferData.receivedBy,
              processStatus: newStatus,
              notes: notes || "",
              isReceived: true,
              receivedDate: new Date(),
              items: {
                create: transferData.items.map((item: any) => ({
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

          // Update history log with transfer reference
          await tx.processHistory.update({
            where: { id: historyLog.id },
            data: {
              transferLogId: transferLog.id,
            },
          });
        }

        return {
          order: updatedOrder,
          historyLog,
          transferLog,
        };
      }
    );

    return NextResponse.json({
      success: true,
      data: result.order,
      historyLog: result.historyLog,
      transferLog: result.transferLog,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update order status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}