// app/dashboard/page.tsx - PROFESSIONAL DASHBOARD

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
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Activity,
  BarChart3,
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <Activity className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-700 font-semibold">Loading dashboard...</p>
          <p className="text-sm text-gray-500 mt-1">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-50 border-2 border-red-200 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="bg-red-100 rounded-full p-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-2">
                Error Loading Dashboard
              </h3>
              <p className="text-sm text-red-700 mb-4">{error}</p>
              <button
                onClick={loadData}
                className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-all font-semibold text-sm"
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
    <div className="space-y-8">
      {/* Page Header - Professional */}
      <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Production Dashboard
            </h1>
            <p className="text-blue-100">
              Real-time overview production system
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Stats Grid - Professional Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Orders */}
        <Card className="border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-blue-100 rounded-xl p-3">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Total Orders
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalOrders}
              </p>
              <p className="text-sm text-gray-600">All production orders</p>
            </div>
          </CardContent>
        </Card>

        {/* In Production */}
        <Card className="border-2 border-gray-200 hover:border-orange-300 hover:shadow-xl transition-all">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-orange-100 rounded-xl p-3">
                <Factory className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                In Production
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-orange-600">
                {stats.ordersInProduction}
              </p>
              <p className="text-sm text-gray-600">Currently manufacturing</p>
            </div>
          </CardContent>
        </Card>

        {/* In Delivery */}
        <Card className="border-2 border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-indigo-100 rounded-xl p-3">
                <Truck className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                In Delivery
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-indigo-600">
                {stats.ordersInDelivery}
              </p>
              <p className="text-sm text-gray-600">Being delivered</p>
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card className="border-2 border-gray-200 hover:border-green-300 hover:shadow-xl transition-all">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-green-100 rounded-xl p-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Completed
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-green-600">
                {stats.ordersCompleted}
              </p>
              <p className="text-sm text-gray-600">Successfully finished</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics & WIP - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics Card */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 rounded-lg p-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Performance Metrics</CardTitle>
              </div>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Average Production Time */}
              <div className="bg-linear-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">
                      Avg. Production Time
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-blue-700">
                    {stats.avgProductionTime}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-700">
                  <span>days per order</span>
                </div>
              </div>

              {/* Total Reject Rate */}
              <div
                className={`rounded-xl p-4 border ${
                  stats.totalRejectRate > 5
                    ? "bg-linear-to-r from-red-50 to-red-100 border-red-200"
                    : "bg-linear-to-r from-green-50 to-green-100 border-green-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`w-4 h-4 ${
                        stats.totalRejectRate > 5
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        stats.totalRejectRate > 5
                          ? "text-red-900"
                          : "text-green-900"
                      }`}
                    >
                      Total Reject Rate
                    </span>
                  </div>
                  <span
                    className={`text-2xl font-bold ${
                      stats.totalRejectRate > 5
                        ? "text-red-700"
                        : "text-green-700"
                    }`}
                  >
                    {stats.totalRejectRate}%
                  </span>
                </div>
                <div
                  className={`flex items-center gap-1 text-xs ${
                    stats.totalRejectRate > 5
                      ? "text-red-700"
                      : "text-green-700"
                  }`}
                >
                  <span>
                    {stats.totalRejectRate > 5
                      ? "Needs attention"
                      : "Within acceptable range"}
                  </span>
                </div>
              </div>

              {/* Average Delivery Time */}
              <div className="bg-linear-to-r from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-semibold text-indigo-900">
                      Avg. Delivery Time
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-indigo-700">
                    {stats.avgDeliveryTime}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-indigo-700">
                  <span>days to complete delivery</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work In Progress Card */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 rounded-lg p-2">
                  <Factory className="w-5 h-5 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Work In Progress</CardTitle>
              </div>
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* WIP Production */}
              <div className="bg-linear-to-r from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-orange-900 mb-1">
                      Production WIP
                    </p>
                    <p className="text-xs text-orange-700">
                      Units in manufacturing
                    </p>
                  </div>
                  <Factory className="w-8 h-8 text-orange-600" />
                </div>
                <p className="text-4xl font-bold text-orange-700">
                  {formatNumber(stats.wipProduction)}
                </p>
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <p className="text-xs text-orange-700">
                    Total units currently in production phase
                  </p>
                </div>
              </div>

              {/* WIP Delivery */}
              <div className="bg-linear-to-r from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-indigo-900 mb-1">
                      Delivery WIP
                    </p>
                    <p className="text-xs text-indigo-700">
                      Units in delivery process
                    </p>
                  </div>
                  <Truck className="w-8 h-8 text-indigo-600" />
                </div>
                <p className="text-4xl font-bold text-indigo-700">
                  {formatNumber(stats.wipDelivery)}
                </p>
                <div className="mt-3 pt-3 border-t border-indigo-200">
                  <p className="text-xs text-indigo-700">
                    Total units currently in delivery phase
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Orders Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-7 h-7 text-blue-600" />
              Active Orders
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Currently in production or delivery
            </p>
          </div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg"
          >
            View All Orders
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {activeOrders.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="py-16 text-center">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-semibold text-lg mb-2">
                No Active Orders
              </p>
              <p className="text-sm text-gray-500">
                All orders have been completed or none in progress
              </p>
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

      {/* Recently Completed Section */}
      {completedOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
                Recently Completed
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Latest successfully finished orders
              </p>
            </div>
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
