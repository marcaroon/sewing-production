// src/app/monitoring/page.tsx
// Large Screen Dashboard untuk Monitoring di Ruang Produksi

"use client";

import React, { useEffect, useState } from "react";
import { Order } from "@/lib/types-new";
import { PROCESS_LABELS, PHASE_LABELS } from "@/lib/constants-new";
import apiClient from "@/lib/api-client";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";

/**
 * Calculate Process Progress
 */
function calculateProcessProgress(order: Order) {
  const processSteps = order.processSteps || [];
  const totalSteps = order.totalProcessSteps || processSteps.length;
  const completedSteps = processSteps.filter(
    (step) => step.status === "completed"
  ).length;
  const percentage =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return { percentage, completed: completedSteps, total: totalSteps };
}

/**
 * Calculate Quantity Progress
 */
function calculateQuantityProgress(order: Order) {
  const percentage =
    order.totalQuantity > 0
      ? Math.round((order.totalCompleted / order.totalQuantity) * 100)
      : 0;
  return {
    percentage,
    completed: order.totalCompleted,
    total: order.totalQuantity,
  };
}

/**
 * Order Card untuk Large Screen
 */
function MonitoringOrderCard({ order }: { order: Order }) {
  const processProgress = calculateProcessProgress(order);
  const quantityProgress = calculateQuantityProgress(order);
  const isDelayed = new Date() > new Date(order.productionDeadline);

  return (
    <div className="bg-gray-800 rounded-xl border-2 border-gray-700 p-6 shadow-2xl hover:border-blue-500 transition-all">
      {/* Header */}
      <div className="mb-4 pb-4 border-b-2 border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-white">{order.orderNumber}</h3>
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              order.currentPhase === "production"
                ? "bg-blue-500 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            {PHASE_LABELS[order.currentPhase]}
          </div>
        </div>
        <p className="text-gray-300 text-sm font-semibold">
          {order.buyer.name}
        </p>
        <p className="text-gray-400 text-xs">{order.style.name}</p>
      </div>

      {/* Current Process */}
      <div className="mb-4 bg-gray-900 rounded-lg p-3 border border-blue-500">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <p className="text-xs font-bold text-blue-400 uppercase">
            Current Process
          </p>
        </div>
        <p className="text-lg font-bold text-white">
          {PROCESS_LABELS[order.currentProcess]}
        </p>
      </div>

      {/* Process Steps Progress */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <p className="text-xs font-bold text-gray-300 uppercase">
            Process Steps
          </p>
        </div>

        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>
            {processProgress.completed} / {processProgress.total} Steps
          </span>
          <span className="text-blue-400 font-bold">
            {processProgress.percentage}%
          </span>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
          <div
            className="bg-linear-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${processProgress.percentage}%` }}
          />
        </div>

        <p className="text-xs text-blue-400 font-semibold">
          Step {processProgress.completed + 1} of {processProgress.total}
        </p>
      </div>

      {/* Quantity Progress */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-green-400" />
          <p className="text-xs font-bold text-gray-300 uppercase">
            Production Output
          </p>
        </div>

        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>
            {quantityProgress.completed.toLocaleString()} /{" "}
            {quantityProgress.total.toLocaleString()} pcs
          </span>
          <span className="text-green-400 font-bold">
            {quantityProgress.percentage}%
          </span>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-linear-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${quantityProgress.percentage}%` }}
          />
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-2 gap-2">
        {/* Deadline */}
        <div
          className={`rounded p-2 border ${
            isDelayed
              ? "bg-red-900/30 border-red-700"
              : "bg-gray-900 border-gray-700"
          }`}
        >
          <div className="flex items-center gap-1 mb-1">
            <Clock
              className={`w-3 h-3 ${
                isDelayed ? "text-red-400" : "text-gray-400"
              }`}
            />
            <p
              className={`text-xs font-bold ${
                isDelayed ? "text-red-300" : "text-gray-400"
              }`}
            >
              Deadline
            </p>
          </div>
          <p
            className={`text-xs font-bold ${
              isDelayed ? "text-red-400" : "text-gray-300"
            }`}
          >
            {new Date(order.productionDeadline).toLocaleDateString()}
          </p>
        </div>

        {/* Reject */}
        {order.totalRejected > 0 ? (
          <div className="bg-red-900/30 border border-red-700 rounded p-2">
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <p className="text-xs font-bold text-red-300">Rejected</p>
            </div>
            <p className="text-xs font-bold text-red-400">
              {order.totalRejected} pcs
            </p>
          </div>
        ) : (
          <div className="bg-green-900/30 border border-green-700 rounded p-2">
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              <p className="text-xs font-bold text-green-300">Quality</p>
            </div>
            <p className="text-xs font-bold text-green-400">No Rejects</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main Monitoring Dashboard
 */
export default function MonitoringDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrders();

    // Auto-refresh setiap 30 detik
    const interval = setInterval(() => {
      loadOrders();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const data = await apiClient.getOrders();
      // Filter hanya order yang sedang berjalan
      const activeOrders = data.filter((o) => o.currentProcess !== "delivered");
      setOrders(activeOrders);
      setLastUpdate(new Date());
      setError("");
    } catch (err) {
      console.error("Error loading orders:", err);
      setError("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-xl font-bold">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 to-gray-800 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <span className="bg-blue-600 rounded-lg p-2">
                <Package className="w-8 h-8 text-white" />
              </span>
              Production Monitoring Dashboard
            </h1>
            <p className="text-gray-300 text-lg">
              Real-time Order Progress Tracking
            </p>
          </div>

          {/* Stats Summary */}
          <div className="flex gap-4">
            <div className="bg-gray-800 rounded-lg border-2 border-blue-500 p-4 text-center">
              <p className="text-blue-400 text-sm font-bold uppercase mb-1">
                Active Orders
              </p>
              <p className="text-4xl font-bold text-white">{orders.length}</p>
            </div>

            <div className="bg-gray-800 rounded-lg border-2 border-green-500 p-4 text-center">
              <p className="text-green-400 text-sm font-bold uppercase mb-1">
                Total WIP
              </p>
              <p className="text-4xl font-bold text-white">
                {orders
                  .reduce(
                    (sum, o) => sum + (o.totalQuantity - o.totalCompleted),
                    0
                  )
                  .toLocaleString()}
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg border-2 border-red-500 p-4 text-center">
              <p className="text-red-400 text-sm font-bold uppercase mb-1">
                Delayed
              </p>
              <p className="text-4xl font-bold text-white">
                {
                  orders.filter(
                    (o) => new Date() > new Date(o.productionDeadline)
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        {/* Last Update */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Last Updated: {lastUpdate.toLocaleTimeString()}
          </p>
          <button
            onClick={loadOrders}
            className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh Now
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-900/50 border-2 border-red-500 rounded-lg p-4">
          <p className="text-red-300 font-semibold">{error}</p>
        </div>
      )}

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border-2 border-gray-700 p-12 text-center">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-xl font-bold text-gray-400">No Active Orders</p>
          <p className="text-gray-500 mt-2">
            All orders have been completed or no orders in production
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map((order) => (
            <MonitoringOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
