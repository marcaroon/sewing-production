// lib/order-adapter.ts

// EXPLICIT imports dengan alias untuk avoid collision
import { 
    Order as NewOrder,
    ProcessStep as NewProcessStep,
    DashboardStats as NewDashboardStats
  } from "./types-new";
  
  import { 
    Order as OldOrder, 
    ProcessStatus as OldProcessStatus,
    DashboardStats as OldDashboardStats,
    SizeBreakdown as OldSizeBreakdown
  } from "./types";
  
  /**
   * Convert NEW Order format to OLD Order format
   * Input: NewOrder (from database/API)
   * Output: OldOrder (for frontend components)
   */
  export function adaptNewOrderToOld(newOrder: NewOrder): OldOrder {
    // Calculate progress from process steps
    const calculateProgress = () => {
      const defaultProgress = {
        cutting: 0,
        numbering: 0,
        shiwake: 0,
        sewing: 0,
        qc: 0,
        ironing: 0,
        finalQc: 0,
        packing: 0,
      };
  
      if (!newOrder.processSteps || newOrder.processSteps.length === 0) {
        return defaultProgress;
      }
  
      const progress: Record<string, number> = {};
      
      newOrder.processSteps.forEach((step: NewProcessStep) => {
        let percentage = 0;
        if (step.status === "completed") {
          percentage = 100;
        } else if (step.status === "in_progress") {
          percentage = step.quantityReceived > 0 
            ? Math.round((step.quantityCompleted / step.quantityReceived) * 100)
            : 0;
        }
  
        // Map process names to old format
        const processMap: Record<string, string> = {
          "cutting": "cutting",
          "numbering": "numbering",
          "shiwake": "shiwake",
          "sewing": "sewing",
          "qc_sewing": "qc",
          "ironing": "ironing",
          "final_qc": "finalQc",
          "packing": "packing",
        };
  
        const oldKey = processMap[step.processName];
        if (oldKey) {
          progress[oldKey] = percentage;
        }
      });
  
      return {
        cutting: progress.cutting || 0,
        numbering: progress.numbering || 0,
        shiwake: progress.shiwake || 0,
        sewing: progress.sewing || 0,
        qc: progress.qc || 0,
        ironing: progress.ironing || 0,
        finalQc: progress.finalQc || 0,
        packing: progress.packing || 0,
      };
    };
  
    // Calculate WIP from process steps
    const calculateWIP = () => {
      const defaultWIP = {
        atCutting: 0,
        atNumbering: 0,
        atShiwake: 0,
        atSewing: 0,
        atQC: 0,
        atIroning: 0,
        atPacking: 0,
      };
  
      if (!newOrder.processSteps || newOrder.processSteps.length === 0) {
        return defaultWIP;
      }
  
      const wip: Record<string, number> = {
        atCutting: 0,
        atNumbering: 0,
        atShiwake: 0,
        atSewing: 0,
        atQC: 0,
        atIroning: 0,
        atPacking: 0,
      };
  
      newOrder.processSteps.forEach((step: NewProcessStep) => {
        if (step.status === "in_progress" || step.status === "pending") {
          const inProgressQty = step.quantityReceived - step.quantityCompleted;
          
          const wipMap: Record<string, string> = {
            "cutting": "atCutting",
            "numbering": "atNumbering",
            "shiwake": "atShiwake",
            "sewing": "atSewing",
            "qc_sewing": "atQC",
            "ironing": "atIroning",
            "packing": "atPacking",
          };
  
          const wipKey = wipMap[step.processName];
          if (wipKey) {
            wip[wipKey] += inProgressQty;
          }
        }
      });
  
      return wip;
    };
  
    // Calculate lead time from process steps
    const calculateLeadTime = () => {
      const leadTime: Record<string, number | undefined> = {};
  
      if (newOrder.processSteps && newOrder.processSteps.length > 0) {
        newOrder.processSteps.forEach((step: NewProcessStep) => {
          if (step.totalDuration) {
            const leadTimeMap: Record<string, string> = {
              "cutting": "cutting",
              "numbering": "numbering",
              "shiwake": "shiwake",
              "sewing": "sewing",
              "qc_sewing": "qc",
              "ironing": "ironing",
              "final_qc": "finalQc",
              "packing": "packing",
            };
  
            const leadTimeKey = leadTimeMap[step.processName];
            if (leadTimeKey) {
              leadTime[leadTimeKey] = Math.round(step.totalDuration / 60); // Convert minutes to hours
            }
          }
        });
      }
  
      return leadTime;
    };
  
    // Map currentProcess to old currentStatus
    const mapToOldStatus = (): OldProcessStatus => {
      const processToStatusMap: Record<string, OldProcessStatus> = {
        "draft": "draft",
        "material_request": "material_request",
        "material_issued": "material_issued",
        "cutting": "cutting",
        "numbering": "numbering",
        "shiwake": "shiwake",
        "sewing": "sewing",
        "qc_sewing": "qc_sewing",
        "ironing": "ironing",
        "final_qc": "final_qc",
        "packing": "packing",
        "final_inspection": "final_qc",
        "loading": "packing",
        "shipping": "packing",
        "delivered": "completed",
      };
  
      return processToStatusMap[newOrder.currentProcess] || "draft";
    };
  
    // Build old order object
    const oldOrder: OldOrder = {
      id: newOrder.id,
      orderNumber: newOrder.orderNumber,
      buyer: newOrder.buyer,
      style: newOrder.style,
      orderDate: newOrder.orderDate,
      targetDate: newOrder.productionDeadline, // Map production deadline to target
      totalQuantity: newOrder.totalQuantity,
      sizeBreakdown: newOrder.sizeBreakdown as OldSizeBreakdown[],
      currentStatus: mapToOldStatus(),
      assignedLine: newOrder.assignedLine,
      progress: calculateProgress(),
      materialsIssued: newOrder.materialsIssued,
      wip: calculateWIP(),
      leadTime: calculateLeadTime(),
      totalRejected: newOrder.totalRejected,
      totalRework: newOrder.totalRework,
      hasLeftover: newOrder.hasLeftover,
      createdAt: newOrder.createdAt,
      updatedAt: newOrder.updatedAt,
      createdBy: newOrder.createdBy,
      notes: newOrder.notes,
    };
  
    return oldOrder;
  }
  
  /**
   * Adapt NEW dashboard stats to OLD format
   */
  export function adaptNewStatsToOld(newStats: NewDashboardStats): OldDashboardStats {
    return {
      totalOrders: newStats.totalOrders || 0,
      ordersInProgress: 
        (newStats.ordersInProduction || 0) + 
        (newStats.ordersInDelivery || 0),
      ordersCompleted: newStats.ordersCompleted || 0,
      ordersOnHold: newStats.ordersOnHold || 0,
      totalWIP: 
        (newStats.wipProduction || 0) + 
        (newStats.wipDelivery || 0),
      avgLeadTime: newStats.avgProductionTime || 0,
      rejectRate: newStats.totalRejectRate || 0,
    };
  }