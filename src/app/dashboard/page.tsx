// app/dashboard/page.tsx - IMPROVED DASHBOARD

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Order, DashboardStats } from "@/lib/types-new";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { OrderCardNew as OrderCard } from "@/components/OrderCardNew";
import { formatNumber } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import {
  Package,
  Factory,
  Truck,
  CheckCircle2,
  PauseCircle,
  TrendingUp,
  AlertTriangle,
  Clock,
  Plus,
} from "lucide-react";

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    ordersInProduction: 0,
    ordersInDelivery: 0,
    ordersCompleted: 0,
    ordersOnHold: 0,
    wipProduction: 0,
    wipDelivery: 0,
    avgProductionTime: 0,
    avgDeliveryTime: 0,
    totalRejectRate: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [ordersData, statsData] = await Promise.all([
        apiClient.getOrders(),
        apiClient.getDashboardStats(),
      ]);

      setOrders(ordersData);
      setStats(statsData);
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const activeOrders = orders
    .filter((o) => o.currentProcess !== "delivered")
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 6);

  const completedOrders = orders
    .filter((o) => o.currentProcess === "delivered")
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={loadData}
                className="mt-3 text-sm text-red-800 font-semibold underline hover:text-red-900"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-base text-gray-700">
          Overview sistem produksi garment dan status order terkini
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Orders */}
        <Card hover>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Total Orders
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalOrders}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* In Production */}
        <Card hover>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  In Production
                </p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {stats.ordersInProduction}
                </p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <Factory className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* In Delivery */}
        <Card hover>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  In Delivery
                </p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {stats.ordersInDelivery}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Truck className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card hover>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Completed
                </p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.ordersCompleted}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <CardTitle>Performance Metrics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    Avg Production Time
                  </span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {stats.avgProductionTime} days
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    Total Reject Rate
                  </span>
                </div>
                <span
                  className={`text-xl font-bold ${
                    stats.totalRejectRate > 5
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {stats.totalRejectRate}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Factory className="w-5 h-5 text-purple-600" />
              <CardTitle>Work In Progress</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <span className="text-sm font-semibold text-purple-700">
                  WIP (Production)
                </span>
                <span className="text-xl font-bold text-purple-900">
                  {formatNumber(stats.wipProduction)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-semibold text-blue-700">
                  WIP (Delivery)
                </span>
                <span className="text-xl font-bold text-blue-900">
                  {formatNumber(stats.wipDelivery)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Orders */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Active Orders</h2>
          </div>
          <Link
            href="/orders"
            className="text-blue-600 hover:text-blue-800 font-semibold text-sm flex items-center gap-1"
          >
            View All
            <Plus className="w-4 h-4" />
          </Link>
        </div>
        {activeOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <PauseCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Tidak ada order aktif</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      {/* Recently Completed */}
      {completedOrders.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Recently Completed
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {completedOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
