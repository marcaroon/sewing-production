// src/app/api/orders/[id]/materials/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/orders/[id]/materials
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orderId = (await params).id;

    const orderMaterials = await prisma.orderMaterial.findMany({
      where: { orderId },
      include: {
        material: true,
      },
    });

    const orderAccessories = await prisma.orderAccessory.findMany({
      where: { orderId },
      include: {
        accessory: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        materials: orderMaterials,
        accessories: orderAccessories,
      },
    });
  } catch (error) {
    console.error("Error fetching order materials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order materials" },
      { status: 500 }
    );
  }
}

// POST /api/orders/[id]/materials/issue
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orderId = (await params).id;
    const body = await request.json();
    const { performedBy, notes } = body;

    // Issue all required materials for this order
    const result = await prisma.$transaction(async (tx) => {
      // Get order materials
      const orderMaterials = await tx.orderMaterial.findMany({
        where: { orderId },
        include: { material: true },
      });

      const orderAccessories = await tx.orderAccessory.findMany({
        where: { orderId },
        include: { accessory: true },
      });

      // Issue materials
      for (const om of orderMaterials) {
        const toIssue = om.quantityRequired - om.quantityIssued;
        if (toIssue > 0) {
          // Check stock
          const stockResult = await tx.materialStockTransaction.aggregate({
            where: { materialId: om.materialId },
            _sum: { quantity: true },
          });

          const currentStock = stockResult._sum.quantity || 0;

          if (currentStock < toIssue) {
            throw new Error(
              `Insufficient stock for ${om.material.name}. Available: ${currentStock}, Required: ${toIssue}`
            );
          }

          // Create stock transaction (OUT)
          await tx.materialStockTransaction.create({
            data: {
              materialId: om.materialId,
              transactionType: "out",
              quantity: -toIssue,
              unit: om.unit,
              referenceType: "order",
              referenceId: orderId,
              remarks: notes || `Issued for order`,
              performedBy,
            },
          });

          // Update order material
          await tx.orderMaterial.update({
            where: { id: om.id },
            data: {
              quantityIssued: om.quantityIssued + toIssue,
            },
          });
        }
      }

      // Issue accessories (same pattern)
      for (const oa of orderAccessories) {
        const toIssue = oa.quantityRequired - oa.quantityIssued;
        if (toIssue > 0) {
          const stockResult = await tx.accessoryStockTransaction.aggregate({
            where: { accessoryId: oa.accessoryId },
            _sum: { quantity: true },
          });

          const currentStock = stockResult._sum.quantity || 0;

          if (currentStock < toIssue) {
            throw new Error(
              `Insufficient stock for ${oa.accessory.name}. Available: ${currentStock}, Required: ${toIssue}`
            );
          }

          await tx.accessoryStockTransaction.create({
            data: {
              accessoryId: oa.accessoryId,
              transactionType: "out",
              quantity: -toIssue,
              unit: oa.unit,
              referenceType: "order",
              referenceId: orderId,
              remarks: notes || `Issued for order`,
              performedBy,
            },
          });

          await tx.orderAccessory.update({
            where: { id: oa.id },
            data: {
              quantityIssued: oa.quantityIssued + toIssue,
            },
          });
        }
      }

      // Update order
      await tx.order.update({
        where: { id: orderId },
        data: { materialsIssued: true },
      });

      return {
        materialsIssued: orderMaterials.length + orderAccessories.length,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Materials issued successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error issuing materials:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to issue materials",
      },
      { status: 500 }
    );
  }
}
