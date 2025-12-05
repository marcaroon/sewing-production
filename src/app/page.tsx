// app/page.tsx (Updated with API)

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Order, DashboardStats } from "@/lib/types-new";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { OrderCardNew as OrderCard } from "@/components/OrderCardNew";
import { formatNumber } from "@/lib/utils";
import apiClient from "@/lib/api-client";

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

  // Get active orders (not completed)
  const activeOrders = orders
    .filter((o) => o.currentProcess !== "delivered")
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 6);

  // Get recently completed orders
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
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg
              className="w-6 h-6 text-red-600 mr-3 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={loadData}
                className="mt-3 text-sm text-red-800 underline hover:text-red-900"
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
        <p className="text-gray-600">
          Overview sistem produksi garment dan status order terkini
        </p>
      </div>
      {/* Stats Grid */}
      // GANTI bagian stats display:
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Orders
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalOrders}
                </p>
              </div>
              {/* icon */}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  In Production
                </p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {stats.ordersInProduction}
                </p>
              </div>
              {/* icon */}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Delivery</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {stats.ordersInDelivery}
                </p>
              </div>
              {/* icon */}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.ordersCompleted}
                </p>
              </div>
              {/* icon */}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg Production Time</span>
              <span className="text-xl font-bold text-gray-900">
                {stats.avgProductionTime} days
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Reject Rate</span>
              <span
                className={`text-xl font-bold ${
                  stats.totalRejectRate > 5 ? "text-red-600" : "text-green-600"
                }`}
              >
                {stats.totalRejectRate}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">WIP (Production)</span>
              <span className="text-xl font-bold text-gray-900">
                {formatNumber(stats.wipProduction)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">WIP (Delivery)</span>
              <span className="text-xl font-bold text-gray-900">
                {formatNumber(stats.wipDelivery)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Active Orders</h2>
          <Link
            href="/orders"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            View All →
          </Link>
        </div>
        {activeOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <p>Tidak ada order aktif</p>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Recently Completed
          </h2>
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
