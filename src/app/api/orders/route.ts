// src/app/api/orders/route.ts - COMPLETELY FIXED (Remove material_request & draft)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PROCESS_DEPARTMENT_MAP } from "@/lib/constants-new";
import { getTemplateById, PROCESS_TEMPLATES } from "@/lib/process-templates";
import { ProcessName } from "@/lib/types-new";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderNumber,
      buyerId,
      styleId,
      article,
      orderDate,
      productionDeadline,
      deliveryDeadline,
      totalQuantity,
      sizeBreakdown,
      createdBy,
      notes,
      processTemplateId,
      customProcessFlow,
      selectedMaterials,
      selectedAccessories,
      assignedLine,
    } = body;

    // Validate order number
    if (!orderNumber || orderNumber.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Order number is required" },
        { status: 400 }
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber: orderNumber.trim().toUpperCase() },
    });

    if (existingOrder) {
      return NextResponse.json(
        {
          success: false,
          error: `Order number "${orderNumber}" already exists`,
        },
        { status: 409 }
      );
    }

    // Validate deadlines
    if (new Date(deliveryDeadline) <= new Date(productionDeadline)) {
      return NextResponse.json(
        {
          success: false,
          error: "Delivery deadline must be after production deadline",
        },
        { status: 400 }
      );
    }

    // ==================== GET PROCESS FLOW ====================
    let processFlow: ProcessName[];
    let templateId: string | null = null;
    let totalProcessSteps: number;

    if (customProcessFlow && customProcessFlow.length > 0) {
      processFlow = customProcessFlow;
      templateId = "custom";
      totalProcessSteps = processFlow.length;
    } else if (processTemplateId) {
      const template = getTemplateById(processTemplateId);
      if (!template) {
        return NextResponse.json(
          { success: false, error: "Invalid process template" },
          { status: 400 }
        );
      }
      processFlow = template.processes;
      templateId = template.id;
      totalProcessSteps = processFlow.length;
    } else {
      const defaultTemplate = PROCESS_TEMPLATES.full_process;
      processFlow = defaultTemplate.processes;
      templateId = defaultTemplate.id;
      totalProcessSteps = processFlow.length;
    }

    // ✅ CRITICAL FIX: Remove 'draft' and 'material_request' dari flow
    const invalidProcesses = ["draft", "material_request"];
    processFlow = processFlow.filter((p) => !invalidProcesses.includes(p));
    totalProcessSteps = processFlow.length;

    console.log("[CREATE ORDER] Final process flow:", processFlow);

    if (processFlow.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid processes in template" },
        { status: 400 }
      );
    }

    // ✅ Get first REAL process (tidak ada draft/material_request lagi)
    const firstProcess = processFlow[0];
    const firstDepartment = PROCESS_DEPARTMENT_MAP[firstProcess] || "Unknown";

    console.log("[CREATE ORDER] First process:", firstProcess);
    console.log("[CREATE ORDER] First department:", firstDepartment);

    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();

      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber: orderNumber.trim().toUpperCase(),
          buyerId,
          styleId,
          article,
          orderDate: new Date(orderDate),
          productionDeadline: new Date(productionDeadline),
          deliveryDeadline: new Date(deliveryDeadline),
          totalQuantity,
          processTemplate: templateId,
          processFlow: JSON.stringify(processFlow),
          totalProcessSteps,
          currentPhase: "production",
          currentProcess: firstProcess,
          currentState: "waiting",
          materialsIssued: true,
          createdBy,
          notes: notes || null,
          assignedLine: assignedLine || null,
          sizeBreakdowns: {
            create: sizeBreakdown.map((sb: any) => ({
              size: sb.size,
              quantity: sb.quantity,
              completed: 0,
              rejected: 0,
              bundleCount: Math.ceil(sb.quantity / 10),
            })),
          },
        },
        include: {
          buyer: true,
          style: true,
          sizeBreakdowns: true,
        },
      });

      console.log("[CREATE ORDER] Order created with ID:", order.id);

      // ✅ Create FIRST process step in WAITING status
      const firstProcessStep = await tx.processStep.create({
        data: {
          orderId: order.id,
          processName: firstProcess,
          processPhase: "production",
          sequenceOrder: 1,
          department: firstDepartment,
          status: "pending",
          quantityReceived: totalQuantity,
          quantityCompleted: 0,
          quantityRejected: 0,
          quantityRework: 0,
          addedToWaitingTime: now, // ✅ Langsung masuk waiting list
          notes: `Order created - Ready for ${firstProcess}`,
        },
      });

      console.log(
        "[CREATE ORDER] First process step created:",
        firstProcessStep.id
      );

      // Create initial transition
      await tx.processTransition.create({
        data: {
          orderId: order.id,
          processStepId: firstProcessStep.id,
          fromState: "at_ppic",
          toState: "waiting",
          transitionTime: now,
          performedBy: createdBy,
          processName: firstProcess,
          department: firstDepartment,
          notes: `Order created - Added to waiting list for ${firstProcess}`,
        },
      });

      // ==================== CREATE ORDER MATERIALS ====================
      const createdMaterials = [];
      if (selectedMaterials && selectedMaterials.length > 0) {
        const materialDetails = await tx.material.findMany({
          where: {
            id: { in: selectedMaterials.map((m: any) => m.materialId) },
          },
        });

        for (const sm of selectedMaterials) {
          const material = materialDetails.find((m) => m.id === sm.materialId);
          if (!material) continue;

          // ✅ Auto-issue materials when creating order
          const orderMaterial = await tx.orderMaterial.create({
            data: {
              orderId: order.id,
              materialId: sm.materialId,
              quantityRequired: sm.quantityRequired,
              quantityIssued: sm.quantityRequired, // ✅ Already issued
              quantityUsed: 0,
              quantityReturned: 0,
              quantityWasted: 0,
              unit: material.unit,
              notes: sm.notes || null,
            },
          });

          // Create stock transaction
          await tx.materialStockTransaction.create({
            data: {
              materialId: sm.materialId,
              transactionType: "out",
              quantity: -sm.quantityRequired,
              unit: material.unit,
              referenceType: "order",
              referenceId: order.id,
              remarks: `Issued for order ${order.orderNumber}`,
              performedBy: createdBy,
            },
          });

          createdMaterials.push({
            ...orderMaterial,
            material: {
              id: material.id,
              name: material.name,
              materialCode: material.materialCode,
              unit: material.unit,
            },
          });
        }
      }

      // ==================== CREATE ORDER ACCESSORIES ====================
      const createdAccessories = [];
      if (selectedAccessories && selectedAccessories.length > 0) {
        const accessoryDetails = await tx.accessory.findMany({
          where: {
            id: { in: selectedAccessories.map((a: any) => a.accessoryId) },
          },
        });

        for (const sa of selectedAccessories) {
          const accessory = accessoryDetails.find(
            (a) => a.id === sa.accessoryId
          );
          if (!accessory) continue;

          // ✅ Auto-issue accessories
          const orderAccessory = await tx.orderAccessory.create({
            data: {
              orderId: order.id,
              accessoryId: sa.accessoryId,
              quantityRequired: sa.quantityRequired,
              quantityIssued: sa.quantityRequired, // ✅ Already issued
              quantityUsed: 0,
              quantityReturned: 0,
              quantityWasted: 0,
              unit: accessory.unit,
              notes: sa.notes || null,
            },
          });

          await tx.accessoryStockTransaction.create({
            data: {
              accessoryId: sa.accessoryId,
              transactionType: "out",
              quantity: -sa.quantityRequired,
              unit: accessory.unit,
              referenceType: "order",
              referenceId: order.id,
              remarks: `Issued for order ${order.orderNumber}`,
              performedBy: createdBy,
            },
          });

          createdAccessories.push({
            ...orderAccessory,
            accessory: {
              id: accessory.id,
              name: accessory.name,
              accessoryCode: accessory.accessoryCode,
              unit: accessory.unit,
            },
          });
        }
      }

      return {
        order,
        firstProcessStep,
        materials: createdMaterials,
        accessories: createdAccessories,
      };
    });

    const transformedOrder = {
      id: result.order.id,
      orderNumber: result.order.orderNumber,
      buyer: {
        id: result.order.buyer.id,
        name: result.order.buyer.name,
        type: result.order.buyer.type,
        code: result.order.buyer.code,
        contactPerson: result.order.buyer.contactPerson || undefined,
        phone: result.order.buyer.phone || undefined,
        leftoverPolicy: {
          canReuse: result.order.buyer.canReuse || false,
          returRequired: result.order.buyer.returRequired || false,
          storageLocation: result.order.buyer.storageLocation || undefined,
        },
      },
      style: result.order.style,
      orderDate: result.order.orderDate,
      productionDeadline: result.order.productionDeadline,
      deliveryDeadline: result.order.deliveryDeadline,
      totalQuantity: result.order.totalQuantity,
      totalCompleted: 0,
      sizeBreakdown: result.order.sizeBreakdowns,
      currentPhase: "production",
      currentProcess: firstProcess,
      currentState: "waiting",
      processTemplate: templateId,
      processFlow: processFlow,
      totalProcessSteps,
      materialsIssued: true,
      totalRejected: 0,
      totalRework: 0,
      hasLeftover: false,
      createdAt: result.order.createdAt,
      updatedAt: result.order.updatedAt,
      createdBy: result.order.createdBy,
      notes: result.order.notes || undefined,
      processSteps: [result.firstProcessStep],
      materials: result.materials,
      accessories: result.accessories,
    };

    console.log("[CREATE ORDER] Success! Order:", result.order.orderNumber);
    console.log("[CREATE ORDER] First process in waiting list:", firstProcess);

    return NextResponse.json({
      success: true,
      data: transformedOrder,
      message: `Order ${result.order.orderNumber} created and added to waiting list for ${firstProcess}`,
    });
  } catch (error) {
    console.error("[CREATE ORDER] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint - keep as is
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phase = searchParams.get("phase");
    const process = searchParams.get("process");
    const state = searchParams.get("state");
    const search = searchParams.get("search");

    const where: any = {};

    if (phase) where.currentPhase = phase;
    if (process) where.currentProcess = process;
    if (state) where.currentState = state;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { buyer: { name: { contains: search, mode: "insensitive" } } },
        { style: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        buyer: true,
        style: true,
        sizeBreakdowns: true,
        processSteps: { orderBy: { sequenceOrder: "asc" } },
      },
      orderBy: { orderDate: "desc" },
    });

    const transformedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      buyer: {
        id: order.buyer.id,
        name: order.buyer.name,
        type: order.buyer.type,
        code: order.buyer.code,
        contactPerson: order.buyer.contactPerson || undefined,
        phone: order.buyer.phone || undefined,
        leftoverPolicy: {
          canReuse: order.buyer.canReuse || false,
          returRequired: order.buyer.returRequired || false,
          storageLocation: order.buyer.storageLocation || undefined,
        },
      },
      style: order.style,
      article: order.article,
      orderDate: order.orderDate,
      productionDeadline: order.productionDeadline,
      productionStartedAt: order.productionStartedAt,
      deliveryDeadline: order.deliveryDeadline,
      totalQuantity: order.totalQuantity,
      totalCompleted: order.totalCompleted,
      sizeBreakdown: order.sizeBreakdowns,
      currentPhase: order.currentPhase,
      currentProcess: order.currentProcess,
      currentState: order.currentState,
      assignedLine: order.assignedLine || undefined,
      assignedTo: order.assignedTo || undefined,
      materialsIssued: order.materialsIssued,
      totalRejected: order.totalRejected,
      totalRework: order.totalRework,
      hasLeftover: order.hasLeftover,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      createdBy: order.createdBy,
      notes: order.notes || undefined,
      processSteps: order.processSteps,
    }));

    return NextResponse.json({
      success: true,
      data: transformedOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch orders",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
