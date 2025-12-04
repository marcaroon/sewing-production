// app/api/dashboard/stats/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get all orders with processSteps
    const orders = await prisma.order.findMany({
      include: {
        sizeBreakdowns: true,
        processSteps: true,
      },
    });

    const totalOrders = orders.length;

    // Use NEW fields: currentPhase, currentProcess, currentState
    const ordersInProduction = orders.filter(
      (o) => o.currentPhase === "production" && o.currentProcess !== "delivered"
    ).length;

    const ordersInDelivery = orders.filter(
      (o) => o.currentPhase === "delivery" && o.currentProcess !== "delivered"
    ).length;

    const ordersCompleted = orders.filter(
      (o) => o.currentProcess === "delivered"
    ).length;

    const ordersOnHold = orders.filter(
      (o) => o.currentState === "on_hold"
    ).length;

    // Calculate WIP from totalQuantity - totalCompleted
    const wipProduction = orders
      .filter(o => o.currentPhase === "production")
      .reduce((sum, order) => sum + (order.totalQuantity - order.totalCompleted), 0);

    const wipDelivery = orders
      .filter(o => o.currentPhase === "delivery")
      .reduce((sum, order) => sum + (order.totalQuantity - order.totalCompleted), 0);

    // Calculate average production time (completed orders only)
    const completedOrders = orders.filter(
      (o) => o.currentProcess === "delivered"
    );
    
    let avgProductionTime = 0;
    if (completedOrders.length > 0) {
      const totalDays = completedOrders.reduce((sum, order) => {
        const created = new Date(order.createdAt);
        const completed = new Date(order.updatedAt);
        const days = Math.ceil(
          (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      avgProductionTime = Math.round(totalDays / completedOrders.length);
    }

    // Calculate reject rate
    const totalQuantity = orders.reduce(
      (sum, order) => sum + order.totalQuantity,
      0
    );
    const totalRejected = orders.reduce(
      (sum, order) => sum + order.totalRejected,
      0
    );
    const totalRejectRate =
      totalQuantity > 0
        ? Math.round((totalRejected / totalQuantity) * 100 * 10) / 10
        : 0;

    // Return NEW format (will be adapted by api-client)
    const stats = {
      totalOrders,
      ordersInProduction,
      ordersInDelivery,
      ordersCompleted,
      ordersOnHold,
      wipProduction,
      wipDelivery,
      avgProductionTime,
      avgDeliveryTime: 0, // TODO: Calculate if needed
      totalRejectRate,
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