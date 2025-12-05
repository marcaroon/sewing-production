// app/orders/page.tsx - FIXED VERSION

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Order, ProcessName } from "@/lib/types-new";
import { OrderCardNew as OrderCard } from "@/components/OrderCardNew";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PROCESS_LABELS } from "@/lib/constants-new";
import apiClient from "@/lib/api-client";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [processFilter, setProcessFilter] = useState<ProcessName | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "process" | "buyer">("date");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, searchTerm, processFilter, sortBy]);

  const loadOrders = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await apiClient.getOrders({
        search: searchTerm || undefined,
      });

      setOrders(data);
    } catch (err) {
      console.error("Error loading orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortOrders = () => {
    let filtered = [...orders];

    // Search filter (client-side)
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.style.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Process filter
    if (processFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.currentProcess === processFilter
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return (
            new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
          );
        case "process":
          return a.currentProcess.localeCompare(b.currentProcess);
        case "buyer":
          return a.buyer.name.localeCompare(b.buyer.name);
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  };

  const processOptions: (ProcessName | "all")[] = [
    "all",
    "draft",
    "material_request",
    "material_issued",
    "cutting",
    "numbering",
    "shiwake",
    "sewing",
    "qc_sewing",
    "ironing",
    "final_qc",
    "packing",
    "final_inspection",
    "loading",
    "shipping",
    "delivered",
  ];

  // ===== FIXED: Calculate stats from orders =====
  const totalOrders = orders.length;
  
  // Fixed: Check if any processStep has status "on_hold"
  const inProgress = orders.filter(
    (o) => o.currentProcess !== "delivered" && 
          !o.processSteps?.some(ps => ps.status === "on_hold")
  ).length;
  
  const completed = orders.filter((o) => o.currentProcess === "delivered").length;
  
  // Fixed: Count orders with any on_hold process step
  const onHold = orders.filter((o) =>
    o.processSteps?.some(ps => ps.status === "on_hold")
  ).length;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
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
                onClick={loadOrders}
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              All Orders
            </h1>
            <p className="text-gray-600">
              Kelola dan monitor semua order produksi
            </p>
          </div>
          <Link href="/orders/new">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              + Create New Order
            </button>
          </Link>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-orange-600">{inProgress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-gray-600">On Hold</p>
              <p className="text-2xl font-bold text-red-600">{onHold}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Order number, buyer, style..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Process Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Process
              </label>
              <select
                value={processFilter}
                onChange={(e) =>
                  setProcessFilter(e.target.value as ProcessName | "all")
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Processes</option>
                {processOptions.slice(1).map((process) => (
                  <option key={process} value={process}>
                    {PROCESS_LABELS[process as ProcessName]}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "date" | "process" | "buyer")
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Order Date (Newest)</option>
                <option value="process">Current Process</option>
                <option value="buyer">Buyer Name</option>
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {(searchTerm || processFilter !== "all") && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchTerm && (
                <Badge variant="info">
                  Search: {searchTerm}
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-2 hover:text-blue-900"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {processFilter !== "all" && (
                <Badge variant="info">
                  Process: {PROCESS_LABELS[processFilter as ProcessName]}
                  <button
                    onClick={() => setProcessFilter("all")}
                    className="ml-2 hover:text-blue-900"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setProcessFilter("all");
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg font-medium mb-2">No orders found</p>
            <p className="text-sm">
              {searchTerm || processFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first order to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}