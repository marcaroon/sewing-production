// lib/api-client.ts
// API Client untuk komunikasi dengan backend

import { Order, Buyer, Style, TransferLog, ProcessHistoryLog } from './types';

const API_BASE = '/api';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Orders
  async getOrders(params?: {
    status?: string;
    buyerId?: string;
    search?: string;
  }): Promise<Order[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.buyerId) queryParams.append('buyerId', params.buyerId);
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    const endpoint = query ? `/orders?${query}` : '/orders';
    
    const response = await this.request<{ success: boolean; data: Order[] }>(
      endpoint
    );
    return response.data;
  }

  async getOrderById(id: string): Promise<Order> {
    const response = await this.request<{ success: boolean; data: Order }>(
      `/orders/${id}`
    );
    return response.data;
  }

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    const response = await this.request<{ success: boolean; data: Order }>(
      '/orders',
      {
        method: 'POST',
        body: JSON.stringify(orderData),
      }
    );
    return response.data;
  }

  async updateOrder(id: string, orderData: Partial<Order>): Promise<Order> {
    const response = await this.request<{ success: boolean; data: Order }>(
      `/orders/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(orderData),
      }
    );
    return response.data;
  }

  async deleteOrder(id: string): Promise<void> {
    await this.request(`/orders/${id}`, {
      method: 'DELETE',
    });
  }

  // Buyers
  async getBuyers(): Promise<Buyer[]> {
    const response = await this.request<{ success: boolean; data: Buyer[] }>(
      '/buyers'
    );
    return response.data;
  }

  async createBuyer(buyerData: Partial<Buyer>): Promise<Buyer> {
    const response = await this.request<{ success: boolean; data: Buyer }>(
      '/buyers',
      {
        method: 'POST',
        body: JSON.stringify(buyerData),
      }
    );
    return response.data;
  }

  // Styles
  async getStyles(): Promise<Style[]> {
    const response = await this.request<{ success: boolean; data: Style[] }>(
      '/styles'
    );
    return response.data;
  }

  async createStyle(styleData: Partial<Style>): Promise<Style> {
    const response = await this.request<{ success: boolean; data: Style }>(
      '/styles',
      {
        method: 'POST',
        body: JSON.stringify(styleData),
      }
    );
    return response.data;
  }

  // Transfer Logs
  async getTransferLogsByOrderId(orderId: string): Promise<TransferLog[]> {
    const response = await this.request<{ success: boolean; data: TransferLog[] }>(
      `/orders/${orderId}/transfers`
    );
    return response.data;
  }

  async createTransferLog(transferData: Partial<TransferLog>): Promise<TransferLog> {
    const response = await this.request<{ success: boolean; data: TransferLog }>(
      '/transfers',
      {
        method: 'POST',
        body: JSON.stringify(transferData),
      }
    );
    return response.data;
  }

  // Process History
  async getProcessHistoryByOrderId(orderId: string): Promise<ProcessHistoryLog[]> {
    const response = await this.request<{ success: boolean; data: ProcessHistoryLog[] }>(
      `/orders/${orderId}/history`
    );
    return response.data;
  }

  async createProcessHistory(historyData: Partial<ProcessHistoryLog>): Promise<ProcessHistoryLog> {
    const response = await this.request<{ success: boolean; data: ProcessHistoryLog }>(
      '/process-history',
      {
        method: 'POST',
        body: JSON.stringify(historyData),
      }
    );
    return response.data;
  }

  // Update Order Status (combined operation)
  async updateOrderStatus(
    orderId: string,
    statusData: {
      newStatus: string;
      performedBy: string;
      notes?: string;
      transferData?: any;
    }
  ): Promise<Order> {
    const response = await this.request<{ success: boolean; data: Order }>(
      `/orders/${orderId}/update-status`,
      {
        method: 'POST',
        body: JSON.stringify(statusData),
      }
    );
    return response.data;
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<any> {
    const response = await this.request<{ success: boolean; data: any }>(
      '/dashboard/stats'
    );
    return response.data;
  }

  // QR Code operations
  async generateOrderQR(orderId: string): Promise<any> {
    const response = await this.request<{ success: boolean; data: any }>(
      `/orders/${orderId}/generate-qr`,
      { method: 'POST' }
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
      '/qr/scan',
      {
        method: 'POST',
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
    if (params?.qrCode) queryParams.append('qrCode', params.qrCode);
    if (params?.orderId) queryParams.append('orderId', params.orderId);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const endpoint = query ? `/qr/scan-history?${query}` : '/qr/scan-history';
    
    const response = await this.request<{ success: boolean; data: any[] }>(
      endpoint
    );
    return response.data;
  }

  // Sewing Lines
  async getSewingLines(): Promise<any[]> {
    const response = await this.request<{ success: boolean; data: any[] }>(
      '/sewing-lines'
    );
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;