// lib/transform-utils.ts
// Utility functions untuk transform data dari database ke frontend format

/**
 * Transform Buyer data from Prisma to Frontend format
 * Handles the flat database structure to nested leftoverPolicy
 */
export function transformBuyer(buyer: any) {
    return {
      id: buyer.id,
      name: buyer.name,
      type: buyer.type,
      code: buyer.code,
      contactPerson: buyer.contactPerson || undefined,
      phone: buyer.phone || undefined,
      leftoverPolicy: {
        canReuse: buyer.canReuse ?? false,
        returRequired: buyer.returRequired ?? false,
        storageLocation: buyer.storageLocation || undefined,
      },
    };
  }
  
  /**
   * Transform Order data from Prisma to Frontend format
   */
  export function transformOrder(order: any) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      buyer: transformBuyer(order.buyer),
      style: order.style,
      orderDate: order.orderDate,
      targetDate: order.targetDate,
      totalQuantity: order.totalQuantity,
      sizeBreakdown: order.sizeBreakdowns || order.sizeBreakdown,
      currentStatus: order.currentStatus,
      assignedLine: order.assignedLine || undefined,
      progress: {
        cutting: order.progressCutting ?? 0,
        numbering: order.progressNumbering ?? 0,
        shiwake: order.progressShiwake ?? 0,
        sewing: order.progressSewing ?? 0,
        qc: order.progressQc ?? 0,
        ironing: order.progressIroning ?? 0,
        finalQc: order.progressFinalQc ?? 0,
        packing: order.progressPacking ?? 0,
      },
      materialsIssued: order.materialsIssued ?? false,
      wip: {
        atCutting: order.wipAtCutting ?? 0,
        atNumbering: order.wipAtNumbering ?? 0,
        atShiwake: order.wipAtShiwake ?? 0,
        atSewing: order.wipAtSewing ?? 0,
        atQC: order.wipAtQC ?? 0,
        atIroning: order.wipAtIroning ?? 0,
        atPacking: order.wipAtPacking ?? 0,
      },
      leadTime: {
        cutting: order.leadTimeCutting ?? undefined,
        numbering: order.leadTimeNumbering ?? undefined,
        shiwake: order.leadTimeShiwake ?? undefined,
        sewing: order.leadTimeSewing ?? undefined,
        qc: order.leadTimeQc ?? undefined,
        ironing: order.leadTimeIroning ?? undefined,
        finalQc: order.leadTimeFinalQc ?? undefined,
        packing: order.leadTimePacking ?? undefined,
      },
      totalRejected: order.totalRejected ?? 0,
      totalRework: order.totalRework ?? 0,
      hasLeftover: order.hasLeftover ?? false,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      createdBy: order.createdBy,
      notes: order.notes || undefined,
      // Include additional fields if they exist
      ...(order.transferLogs && { transferLogs: order.transferLogs }),
      ...(order.processHistories && { processHistories: order.processHistories }),
      ...(order.rejectLogs && { rejectLogs: order.rejectLogs }),
      ...(order.bundles && { bundles: order.bundles }),
      ...(order.qrCode && { qrCode: order.qrCode }),
    };
  }
  
  /**
   * Transform Buyer for API request (Frontend to Database format)
   */
  export function transformBuyerForCreate(buyer: any) {
    return {
      name: buyer.name,
      type: buyer.type,
      code: buyer.code,
      contactPerson: buyer.contactPerson || null,
      phone: buyer.phone || null,
      canReuse: buyer.leftoverPolicy?.canReuse ?? false,
      returRequired: buyer.leftoverPolicy?.returRequired ?? false,
      storageLocation: buyer.leftoverPolicy?.storageLocation || null,
    };
  }