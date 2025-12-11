// src/app/api/inventory/dashboard/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get all materials with stock calculation
    const materials = await prisma.material.findMany();
    const materialsWithStock = await Promise.all(
      materials.map(async (material) => {
        const stockResult = await prisma.materialStockTransaction.aggregate({
          where: { materialId: material.id },
          _sum: { quantity: true },
        });
        const currentStock = stockResult._sum.quantity || 0;
        const isLowStock = currentStock <= material.minimumStock;
        return {
          ...material,
          currentStock,
          isLowStock,
        };
      })
    );

    // Get all accessories with stock calculation
    const accessories = await prisma.accessory.findMany();
    const accessoriesWithStock = await Promise.all(
      accessories.map(async (accessory) => {
        const stockResult = await prisma.accessoryStockTransaction.aggregate({
          where: { accessoryId: accessory.id },
          _sum: { quantity: true },
        });
        const currentStock = stockResult._sum.quantity || 0;
        const isLowStock = currentStock <= accessory.minimumStock;
        return {
          ...accessory,
          currentStock,
          isLowStock,
        };
      })
    );

    // Calculate totals
    const totalMaterials = materials.length;
    const totalAccessories = accessories.length;
    const lowStockMaterials = materialsWithStock.filter(
      (m) => m.isLowStock
    ).length;
    const lowStockAccessories = accessoriesWithStock.filter(
      (a) => a.isLowStock
    ).length;

    // Calculate total value
    const totalMaterialValue = materialsWithStock.reduce((sum, m) => {
      return sum + m.currentStock * (m.unitPrice || 0);
    }, 0);

    const totalAccessoryValue = accessoriesWithStock.reduce((sum, a) => {
      return sum + a.currentStock * (a.unitPrice || 0);
    }, 0);

    // Get top used materials (from material_usages)
    const topMaterialUsages = await prisma.materialUsage.groupBy({
      by: ["materialId"],
      _sum: {
        quantityUsed: true,
      },
      orderBy: {
        _sum: {
          quantityUsed: "desc",
        },
      },
      take: 10,
    });

    const topUsedMaterials = await Promise.all(
      topMaterialUsages.map(async (usage) => {
        const material = await prisma.material.findUnique({
          where: { id: usage.materialId },
        });
        return {
          ...material,
          totalUsed: usage._sum.quantityUsed || 0,
        };
      })
    );

    // Get top used accessories
    const topAccessoryUsages = await prisma.accessoryUsage.groupBy({
      by: ["accessoryId"],
      _sum: {
        quantityUsed: true,
      },
      orderBy: {
        _sum: {
          quantityUsed: "desc",
        },
      },
      take: 10,
    });

    const topUsedAccessories = await Promise.all(
      topAccessoryUsages.map(async (usage) => {
        const accessory = await prisma.accessory.findUnique({
          where: { id: usage.accessoryId },
        });
        return {
          ...accessory,
          totalUsed: usage._sum.quantityUsed || 0,
        };
      })
    );

    // Get recent transactions (last 10)
    const recentMaterialTransactions =
      await prisma.materialStockTransaction.findMany({
        take: 5,
        orderBy: { transactionDate: "desc" },
        include: {
          material: {
            select: { name: true, materialCode: true },
          },
        },
      });

    const recentAccessoryTransactions =
      await prisma.accessoryStockTransaction.findMany({
        take: 5,
        orderBy: { transactionDate: "desc" },
        include: {
          accessory: {
            select: { name: true, accessoryCode: true },
          },
        },
      });

    return NextResponse.json({
      success: true,
      data: {
        totalMaterials,
        totalAccessories,
        lowStockMaterials,
        lowStockAccessories,
        totalMaterialValue,
        totalAccessoryValue,
        topUsedMaterials,
        topUsedAccessories,
        recentTransactions: [
          ...recentMaterialTransactions.map((t) => ({
            ...t,
            type: "material",
          })),
          ...recentAccessoryTransactions.map((t) => ({
            ...t,
            type: "accessory",
          })),
        ]
          .sort(
            (a, b) =>
              new Date(b.transactionDate).getTime() -
              new Date(a.transactionDate).getTime()
          )
          .slice(0, 10),
      },
    });
  } catch (error) {
    console.error("Error fetching inventory dashboard:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
