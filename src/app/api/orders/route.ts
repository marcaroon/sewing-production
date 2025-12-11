// src/app/api/orders/route.ts - COMPLETE VERSION with Materials & Accessories

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PROCESS_DEPARTMENT_MAP } from "@/lib/constants-new";
import { getTemplateById, PROCESS_TEMPLATES } from "@/lib/process-templates";
import { ProcessName } from "@/lib/types-new";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      buyerId,
      styleId,
      orderDate,
      productionDeadline,
      deliveryDeadline,
      totalQuantity,
      sizeBreakdown,
      createdBy,
      notes,
      processTemplateId,
      customProcessFlow,
      selectedMaterials,    // NEW: Array of { materialId, quantityRequired }
      selectedAccessories,  // NEW: Array of { accessoryId, quantityRequired }
    } = body;

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

    // ==================== VALIDATE MATERIALS (if provided) ====================
    if (selectedMaterials && selectedMaterials.length > 0) {
      // Check if all materials exist
      const materialIds = selectedMaterials.map((m: any) => m.materialId);
      const materialsExist = await prisma.material.findMany({
        where: { id: { in: materialIds } },
      });

      if (materialsExist.length !== materialIds.length) {
        return NextResponse.json(
          { success: false, error: "Some materials do not exist" },
          { status: 400 }
        );
      }

      // Validate quantities
      for (const sm of selectedMaterials) {
        if (!sm.quantityRequired || sm.quantityRequired <= 0) {
          return NextResponse.json(
            { success: false, error: "Material quantities must be greater than 0" },
            { status: 400 }
          );
        }
      }
    }

    // ==================== VALIDATE ACCESSORIES (if provided) ====================
    if (selectedAccessories && selectedAccessories.length > 0) {
      const accessoryIds = selectedAccessories.map((a: any) => a.accessoryId);
      const accessoriesExist = await prisma.accessory.findMany({
        where: { id: { in: accessoryIds } },
      });

      if (accessoriesExist.length !== accessoryIds.length) {
        return NextResponse.json(
          { success: false, error: "Some accessories do not exist" },
          { status: 400 }
        );
      }

      for (const sa of selectedAccessories) {
        if (!sa.quantityRequired || sa.quantityRequired <= 0) {
          return NextResponse.json(
            { success: false, error: "Accessory quantities must be greater than 0" },
            { status: 400 }
          );
        }
      }
    }

    // ==================== CREATE ORDER WITH PROCESS STEPS ====================
    const result = await prisma.$transaction(async (tx) => {
      // Generate order number
      const year = new Date().getFullYear();
      const count = await tx.order.count({
        where: { orderNumber: { startsWith: `ORD-${year}` } },
      });
      const orderNumber = `ORD-${year}-${String(count + 1).padStart(5, "0")}`;

      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          buyerId,
          styleId,
          orderDate: new Date(orderDate),
          productionDeadline: new Date(productionDeadline),
          deliveryDeadline: new Date(deliveryDeadline),
          totalQuantity,

          // Process Template Fields
          processTemplate: templateId,
          processFlow: JSON.stringify(processFlow),
          totalProcessSteps,

          // Current state
          currentPhase: "production",
          currentProcess: processFlow[0],
          currentState: "at_ppic",

          createdBy,
          notes: notes || null,

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

      // ==================== CREATE PROCESS STEPS ====================
      const now = new Date();
      const processSteps = [];

      for (let i = 0; i < processFlow.length; i++) {
        const processName = processFlow[i];
        const isFirstProcess = i === 0;

        const isDeliveryProcess = [
          "packing",
          "final_inspection",
          "loading",
          "shipping",
          "delivered",
        ].includes(processName);
        const processPhase = isDeliveryProcess ? "delivery" : "production";

        const department = PROCESS_DEPARTMENT_MAP[processName] || "PPIC";

        const processStep = await tx.processStep.create({
          data: {
            orderId: order.id,
            processName,
            processPhase,
            sequenceOrder: i + 1,
            department,
            status: "pending",
            quantityReceived: isFirstProcess ? totalQuantity : 0,
            arrivedAtPpicTime: isFirstProcess ? now : null,
            notes: isFirstProcess
              ? `Order created with template: ${templateId}`
              : null,
          },
        });

        processSteps.push(processStep);

        // Create initial transition for first process
        if (isFirstProcess) {
          await tx.processTransition.create({
            data: {
              orderId: order.id,
              processStepId: processStep.id,
              fromState: "at_ppic",
              toState: "at_ppic",
              transitionTime: now,
              performedBy: createdBy,
              processName,
              department,
              notes: `Order created with ${processFlow.length} process steps`,
            },
          });
        }
      }

      // ==================== CREATE ORDER MATERIALS ====================
      const createdMaterials = [];
      if (selectedMaterials && selectedMaterials.length > 0) {
        // Get material details for unit info
        const materialDetails = await tx.material.findMany({
          where: { id: { in: selectedMaterials.map((m: any) => m.materialId) } },
        });

        for (const sm of selectedMaterials) {
          const material = materialDetails.find((m) => m.id === sm.materialId);
          if (!material) continue;

          const orderMaterial = await tx.orderMaterial.create({
            data: {
              orderId: order.id,
              materialId: sm.materialId,
              quantityRequired: sm.quantityRequired,
              quantityIssued: 0,
              quantityUsed: 0,
              quantityReturned: 0,
              quantityWasted: 0,
              unit: material.unit,
              notes: sm.notes || null,
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
        // Get accessory details for unit info
        const accessoryDetails = await tx.accessory.findMany({
          where: { id: { in: selectedAccessories.map((a: any) => a.accessoryId) } },
        });

        for (const sa of selectedAccessories) {
          const accessory = accessoryDetails.find((a) => a.id === sa.accessoryId);
          if (!accessory) continue;

          const orderAccessory = await tx.orderAccessory.create({
            data: {
              orderId: order.id,
              accessoryId: sa.accessoryId,
              quantityRequired: sa.quantityRequired,
              quantityIssued: 0,
              quantityUsed: 0,
              quantityReturned: 0,
              quantityWasted: 0,
              unit: accessory.unit,
              notes: sa.notes || null,
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
        processSteps, 
        materials: createdMaterials, 
        accessories: createdAccessories 
      };
    });

    // Transform response
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
      currentProcess: processFlow[0],
      currentState: "at_ppic",
      processTemplate: templateId,
      processFlow: processFlow,
      totalProcessSteps,
      materialsIssued: false,
      totalRejected: 0,
      totalRework: 0,
      hasLeftover: false,
      createdAt: result.order.createdAt,
      updatedAt: result.order.updatedAt,
      createdBy: result.order.createdBy,
      notes: result.order.notes || undefined,
      processSteps: result.processSteps,
      materials: result.materials,
      accessories: result.accessories,
    };

    return NextResponse.json({
      success: true,
      data: transformedOrder,
      message: `Order created with ${processFlow.length} process steps, ${result.materials.length} materials, ${result.accessories.length} accessories`,
    });
  } catch (error) {
    console.error("Error creating order:", error);
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

// GET /api/orders - Get all orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phase = searchParams.get("phase");
    const process = searchParams.get("process");
    const state = searchParams.get("state");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {};

    if (phase) {
      where.currentPhase = phase;
    }

    if (process) {
      where.currentProcess = process;
    }

    if (state) {
      where.currentState = state;
    }

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
        processSteps: {
          orderBy: { sequenceOrder: "asc" },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
    });

    // Transform to match frontend format with proper null checks
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
      orderDate: order.orderDate,
      productionDeadline: order.productionDeadline,
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