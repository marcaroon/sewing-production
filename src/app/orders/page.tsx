// app/orders/page.tsx - IMPROVED VERSION

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Order, ProcessName } from "@/lib/types-new";
import { OrderCardNew as OrderCard } from "@/components/OrderCardNew";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PROCESS_LABELS } from "@/lib/constants-new";
import apiClient from "@/lib/api-client";
import {
  Package,
  Factory,
  CheckCircle2,
  PauseCircle,
  Plus,
  Search,
  Filter,
  X,
  AlertTriangle,
} from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [processFilter, setProcessFilter] = useState<ProcessName | "all">(
    "all"
  );
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

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.style.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (processFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.currentProcess === processFilter
      );
    }

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

  const totalOrders = orders.length;
  const inProgress = orders.filter(
    (o) =>
      o.currentProcess !== "delivered" &&
      !o.processSteps?.some((ps) => ps.status === "on_hold")
  ).length;
  const completed = orders.filter(
    (o) => o.currentProcess === "delivered"
  ).length;
  const onHold = orders.filter((o) =>
    o.processSteps?.some((ps) => ps.status === "on_hold")
  ).length;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Loading orders...</p>
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
                onClick={loadOrders}
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              All Orders
            </h1>
            <p className="text-base text-gray-700">
              Kelola dan monitor semua order produksi
            </p>
          </div>
          <Link href="/orders/new">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-sm hover:shadow-md flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Order
            </button>
          </Link>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card hover>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card hover>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Factory className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">
                    In Progress
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {inProgress}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card hover>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">
                    Completed
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {completed}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card hover>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <PauseCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">
                    On Hold
                  </p>
                  <p className="text-2xl font-bold text-red-600">{onHold}</p>
                </div>
              </div>
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
              <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-600" />
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Order number, buyer, style..."
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
              />
            </div>

            {/* Process Filter */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                Filter by Process
              </label>
              <select
                value={processFilter}
                onChange={(e) =>
                  setProcessFilter(e.target.value as ProcessName | "all")
                }
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
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
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "date" | "process" | "buyer")
                }
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
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
              <span className="text-sm font-semibold text-gray-700">
                Active filters:
              </span>
              {searchTerm && (
                <Badge variant="info" className="flex items-center gap-1.5">
                  Search: {searchTerm}
                  <button
                    onClick={() => setSearchTerm("")}
                    className="hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {processFilter !== "all" && (
                <Badge variant="info" className="flex items-center gap-1.5">
                  Process: {PROCESS_LABELS[processFilter as ProcessName]}
                  <button
                    onClick={() => setProcessFilter("all")}
                    className="hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setProcessFilter("all");
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold ml-2"
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
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-semibold text-gray-900 mb-2">
              No orders found
            </p>
            <p className="text-sm text-gray-600">
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
