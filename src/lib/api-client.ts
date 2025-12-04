// lib/api-client-new.ts
// Updated API Client for New Flow

import {
  Order as NewOrder,
  ProcessStep,
  ProcessTransition,
  RejectLog,
  ProcessState,
  Buyer,
  Style,
  DashboardStats as NewDashboardStats,
} from "./types-new";

import {
  Order as OldOrder,
  DashboardStats as OldDashboardStats,
  ProcessHistoryLog,
  TransferLog,
  Order,
} from "./types";

import { adaptNewOrderToOld, adaptNewStatsToOld } from "./order-adapter";

const API_BASE = "/api";

class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "API request failed");
    }

    return data;
  }

  // ==================== ORDERS ====================

  /**
   * Get all orders - returns OLD format for frontend compatibility
   */
  async getOrders(params?: {
    phase?: string;
    process?: string;
    state?: string;
    search?: string;
  }): Promise<OldOrder[]> {
    // ← EXPLICIT OLD ORDER TYPE
    const queryParams = new URLSearchParams();
    if (params?.phase) queryParams.append("phase", params.phase);
    if (params?.process) queryParams.append("process", params.process);
    if (params?.state) queryParams.append("state", params.state);
    if (params?.search) queryParams.append("search", params.search);

    const query = queryParams.toString();
    const endpoint = query ? `/orders?${query}` : "/orders";

    const response = await this.request<{ success: boolean; data: NewOrder[] }>(
      endpoint
    );

    // Adapt NEW orders to OLD format
    return response.data.map((newOrder: NewOrder) =>
      adaptNewOrderToOld(newOrder)
    );
  }

  /**
   * Get order by ID - returns OLD format
   */
  async getOrderById(id: string): Promise<OldOrder> {
    // ← EXPLICIT OLD ORDER TYPE
    const response = await this.request<{ success: boolean; data: NewOrder }>(
      `/orders/${id}`
    );

    return adaptNewOrderToOld(response.data);
  }

  async createOrder(orderData: {
    buyerId: string;
    styleId: string;
    orderDate: string;
    productionDeadline: string;
    deliveryDeadline: string;
    totalQuantity: number;
    sizeBreakdown: any[];
    createdBy: string;
    notes?: string;
  }): Promise<Order> {
    const response = await this.request<{ success: boolean; data: Order }>(
      "/orders",
      {
        method: "POST",
        body: JSON.stringify(orderData),
      }
    );
    return response.data;
  }

  // ==================== PROCESS STEPS ====================

  async getProcessStepsByOrderId(orderId: string): Promise<ProcessStep[]> {
    const response = await this.request<{
      success: boolean;
      data: ProcessStep[];
    }>(`/orders/${orderId}/process-steps`);
    return response.data;
  }

  async getProcessStepById(id: string): Promise<ProcessStep> {
    const response = await this.request<{
      success: boolean;
      data: ProcessStep;
    }>(`/process-steps/${id}`);
    return response.data;
  }

  async transitionProcessStep(
    processStepId: string,
    data: {
      newState: ProcessState;
      performedBy: string;
      assignedTo?: string;
      assignedLine?: string;
      quantity?: number;
      notes?: string;
    }
  ): Promise<{
    processStep: ProcessStep;
    transition: ProcessTransition;
    nextProcessStep?: ProcessStep;
  }> {
    const response = await this.request<{
      success: boolean;
      data: {
        processStep: ProcessStep;
        transition: ProcessTransition;
        nextProcessStep?: ProcessStep;
      };
    }>(`/process-steps/${processStepId}/transition`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // ==================== PROCESS TRANSITIONS ====================

  async getTransitionsByOrderId(orderId: string): Promise<ProcessTransition[]> {
    const response = await this.request<{
      success: boolean;
      data: ProcessTransition[];
    }>(`/orders/${orderId}/transitions`);
    return response.data;
  }

  async getTransitionsByProcessStepId(
    processStepId: string
  ): Promise<ProcessTransition[]> {
    const response = await this.request<{
      success: boolean;
      data: ProcessTransition[];
    }>(`/process-steps/${processStepId}/transitions`);
    return response.data;
  }

  // ==================== REJECT LOGS ====================

  async recordReject(
    processStepId: string,
    data: {
      rejectType: string;
      rejectCategory: string;
      quantity: number;
      size?: string;
      bundleNumber?: string;
      description: string;
      rootCause?: string;
      action: string;
      reportedBy: string;
      images?: string[];
    }
  ): Promise<RejectLog> {
    const response = await this.request<{ success: boolean; data: RejectLog }>(
      `/process-steps/${processStepId}/reject`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response.data;
  }

  async getRejectsByOrderId(orderId: string): Promise<RejectLog[]> {
    const response = await this.request<{
      success: boolean;
      data: RejectLog[];
    }>(`/orders/${orderId}/rejects`);
    return response.data;
  }

  async getRejectsByProcessStepId(processStepId: string): Promise<RejectLog[]> {
    const response = await this.request<{
      success: boolean;
      data: RejectLog[];
    }>(`/process-steps/${processStepId}/rejects`);
    return response.data;
  }

  async completeRework(
    rejectLogId: string,
    data: {
      completedBy: string;
      finalDisposition: "passed" | "scrapped";
      notes?: string;
    }
  ): Promise<RejectLog> {
    const response = await this.request<{ success: boolean; data: RejectLog }>(
      `/reject-logs/${rejectLogId}/complete-rework`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
    return response.data;
  }

  // ==================== BUYERS & STYLES ====================

  async getBuyers(): Promise<Buyer[]> {
    const response = await this.request<{ success: boolean; data: Buyer[] }>(
      "/buyers"
    );
    return response.data;
  }

  async getStyles(): Promise<Style[]> {
    const response = await this.request<{ success: boolean; data: Style[] }>(
      "/styles"
    );
    return response.data;
  }

  // ==================== DASHBOARD ====================

  /**
   * Get dashboard stats - returns OLD format
   */
  async getDashboardStats(): Promise<OldDashboardStats> {
    // ← EXPLICIT OLD STATS TYPE
    const response = await this.request<{
      success: boolean;
      data: NewDashboardStats;
    }>("/dashboard/stats");

    return adaptNewStatsToOld(response.data);
  }

  async getProcessPerformance(): Promise<any> {
    const response = await this.request<{ success: boolean; data: any }>(
      "/reports/process-performance"
    );
    return response.data;
  }

  async getRejectAnalysis(params?: {
    startDate?: string;
    endDate?: string;
    processName?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.processName)
      queryParams.append("processName", params.processName);

    const query = queryParams.toString();
    const endpoint = query
      ? `/reports/reject-analysis?${query}`
      : "/reports/reject-analysis";

    const response = await this.request<{ success: boolean; data: any }>(
      endpoint
    );
    return response.data;
  }

  // ==================== WAITING LIST ====================

  async getWaitingList(department?: string): Promise<ProcessStep[]> {
    const query = department ? `?department=${department}` : "";
    const response = await this.request<{
      success: boolean;
      data: ProcessStep[];
    }>(`/waiting-list${query}`);
    return response.data;
  }

  async getMyAssignedTasks(userId: string): Promise<ProcessStep[]> {
    const response = await this.request<{
      success: boolean;
      data: ProcessStep[];
    }>(`/tasks/assigned?userId=${userId}`);
    return response.data;
  }

  async generateOrderQR(orderId: string): Promise<any> {
    const response = await this.request<{ success: boolean; data: any }>(
      `/orders/${orderId}/generate-qr`,
      { method: "POST" }
    );
    return response.data;
  }

  async scanQRCode(data: {
    qrCode: string;
    scannedBy: string;
    location: string;
    action: string;
    notes?: string;
    deviceInfo?: string;
  }): Promise<any> {
    const response = await this.request<{ success: boolean; data: any }>(
      "/qr/scan",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response.data;
  }

  async getScanHistory(params?: {
    qrCode?: string;
    orderId?: string;
    limit?: number;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.qrCode) queryParams.append("qrCode", params.qrCode);
    if (params?.orderId) queryParams.append("orderId", params.orderId);
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const query = queryParams.toString();
    const endpoint = query ? `/qr/scan-history?${query}` : "/qr/scan-history";

    const response = await this.request<{ success: boolean; data: any[] }>(
      endpoint
    );
    return response.data;
  }

  // Sewing Lines
  async getSewingLines(): Promise<any[]> {
    const response = await this.request<{ success: boolean; data: any[] }>(
      "/sewing-lines"
    );
    return response.data;
  }

  // IDKKK
  async getProcessHistoryByOrderId(
    orderId: string
  ): Promise<ProcessHistoryLog[]> {
    const response = await this.request<{
      success: boolean;
      data: ProcessHistoryLog[];
    }>(`/orders/${orderId}/history`);
    return response.data;
  }

  // Transfer Logs
  async getTransferLogsByOrderId(orderId: string): Promise<TransferLog[]> {
    const response = await this.request<{
      success: boolean;
      data: TransferLog[];
    }>(`/orders/${orderId}/transfers`);
    return response.data;
  }

  async createTransferLog(
    transferData: Partial<TransferLog>
  ): Promise<TransferLog> {
    const response = await this.request<{
      success: boolean;
      data: TransferLog;
    }>("/transfers", {
      method: "POST",
      body: JSON.stringify(transferData),
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
