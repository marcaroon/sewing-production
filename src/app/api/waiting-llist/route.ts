import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET_WaitingList(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const department = searchParams.get("department");
  
      const where: any = {
        status: "pending",
        addedToWaitingTime: { not: null },
        assignedTime: null, // not yet assigned
      };
  
      if (department) {
        where.department = department;
      }
  
      const waitingItems = await prisma.processStep.findMany({
        where,
        include: {
          order: {
            include: {
              buyer: true,
              style: true,
            },
          },
        },
        orderBy: [
          { order: { productionDeadline: "asc" } }, // prioritize by deadline
          { addedToWaitingTime: "asc" }, // then by FIFO
        ],
      });
  
      return NextResponse.json({
        success: true,
        data: waitingItems,
      });
    } catch (error) {
      console.error("Error fetching waiting list:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch waiting list" },
        { status: 500 }
      );
    }
  }