// app/api/dashboard/stats/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/dashboard/stats
export async function GET() {
  try {
    // Get all orders for calculations
    const orders = await prisma.order.findMany({
      include: {
        sizeBreakdowns: true,
      },
    });

    // Calculate stats
    const totalOrders = orders.length;

    const ordersInProgress = orders.filter(
      (o: { currentStatus: string }) =>
        o.currentStatus !== "completed" &&
        o.currentStatus !== "on_hold" &&
        o.currentStatus !== "rejected"
    ).length;

    const ordersCompleted = orders.filter(
      (o: { currentStatus: string }) => o.currentStatus === "completed"
    ).length;

    const ordersOnHold = orders.filter(
      (o: { currentStatus: string }) => o.currentStatus === "on_hold"
    ).length;

    // Calculate total WIP
    const totalWIP = orders.reduce(
      (
        sum: any,
        order: {
          wipAtCutting: any;
          wipAtNumbering: any;
          wipAtShiwake: any;
          wipAtSewing: any;
          wipAtQC: any;
          wipAtIroning: any;
          wipAtPacking: any;
        }
      ) => {
        return (
          sum +
          order.wipAtCutting +
          order.wipAtNumbering +
          order.wipAtShiwake +
          order.wipAtSewing +
          order.wipAtQC +
          order.wipAtIroning +
          order.wipAtPacking
        );
      },
      0
    );

    // Calculate average lead time (for completed orders)
    const completedOrders = orders.filter(
      (o: { currentStatus: string }) => o.currentStatus === "completed"
    );
    let avgLeadTime = 0;

    if (completedOrders.length > 0) {
      const totalLeadTime = completedOrders.reduce(
        (
          sum: number,
          order: {
            createdAt: string | number | Date;
            updatedAt: string | number | Date;
          }
        ) => {
          const created = new Date(order.createdAt);
          const updated = new Date(order.updatedAt);
          const days = Math.ceil(
            (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        },
        0
      );
      avgLeadTime = Math.round(totalLeadTime / completedOrders.length);
    }

    // Calculate reject rate
    const totalQuantity = orders.reduce(
      (sum: any, order: { totalQuantity: any }) => sum + order.totalQuantity,
      0
    );
    const totalRejected = orders.reduce(
      (sum: any, order: { totalRejected: any }) => sum + order.totalRejected,
      0
    );
    const rejectRate =
      totalQuantity > 0
        ? Math.round((totalRejected / totalQuantity) * 100 * 10) / 10
        : 0;

    const stats = {
      totalOrders,
      ordersInProgress,
      ordersCompleted,
      ordersOnHold,
      totalWIP,
      avgLeadTime,
      rejectRate,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard stats",
      },
      { status: 500 }
    );
  }
}
