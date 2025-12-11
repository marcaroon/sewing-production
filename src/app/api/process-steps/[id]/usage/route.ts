import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/process-steps/[id]/usage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const processStepId = (await params).id;
    const body = await request.json();

    const { materials, accessories, usedBy, notes } = body;

    // materials: [{ materialId, quantityUsed, quantityWasted }]
    // accessories: [{ accessoryId, quantityUsed, quantityWasted }]

    const result = await prisma.$transaction(async (tx) => {
      const usages = [];

      // Record material usages
      for (const mat of materials || []) {
        const material = await tx.material.findUnique({
          where: { id: mat.materialId },
        });

        if (!material) continue;

        const usage = await tx.materialUsage.create({
          data: {
            processStepId,
            materialId: mat.materialId,
            quantityUsed: mat.quantityUsed,
            quantityWasted: mat.quantityWasted || 0,
            unit: material.unit,
            usedBy,
            notes: notes || null,
          },
        });

        usages.push(usage);

        // Update order material usage
        const orderMaterial = await tx.orderMaterial.findFirst({
          where: {
            orderId: (await tx.processStep.findUnique({
              where: { id: processStepId },
            }))!.orderId,
            materialId: mat.materialId,
          },
        });

        if (orderMaterial) {
          await tx.orderMaterial.update({
            where: { id: orderMaterial.id },
            data: {
              quantityUsed: orderMaterial.quantityUsed + mat.quantityUsed,
              quantityWasted:
                orderMaterial.quantityWasted + (mat.quantityWasted || 0),
            },
          });
        }
      }

      // Record accessory usages (similar pattern)
      for (const acc of accessories || []) {
        const accessory = await tx.accessory.findUnique({
          where: { id: acc.accessoryId },
        });

        if (!accessory) continue;

        const usage = await tx.accessoryUsage.create({
          data: {
            processStepId,
            accessoryId: acc.accessoryId,
            quantityUsed: acc.quantityUsed,
            quantityWasted: acc.quantityWasted || 0,
            unit: accessory.unit,
            usedBy,
            notes: notes || null,
          },
        });

        usages.push(usage);

        const orderAccessory = await tx.orderAccessory.findFirst({
          where: {
            orderId: (await tx.processStep.findUnique({
              where: { id: processStepId },
            }))!.orderId,
            accessoryId: acc.accessoryId,
          },
        });

        if (orderAccessory) {
          await tx.orderAccessory.update({
            where: { id: orderAccessory.id },
            data: {
              quantityUsed: orderAccessory.quantityUsed + acc.quantityUsed,
              quantityWasted:
                orderAccessory.quantityWasted + (acc.quantityWasted || 0),
            },
          });
        }
      }

      return usages;
    });

    return NextResponse.json({
      success: true,
      message: "Material usage recorded",
      data: result,
    });
  } catch (error) {
    console.error("Error recording usage:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record usage" },
      { status: 500 }
    );
  }
}
