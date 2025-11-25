// app/orders/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Order, ProcessStatus } from "@/lib/types";
import { orderStorage } from "@/lib/storage";
import { OrderCard } from "@/components/OrderCard";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PROCESS_STATUS_LABELS } from "@/lib/constants";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProcessStatus | "all">(
    "all"
  );
  const [sortBy, setSortBy] = useState<"date" | "status" | "buyer">("date");

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, searchTerm, statusFilter, sortBy]);

  const loadOrders = () => {
    const allOrders = orderStorage.getAll();
    setOrders(allOrders);
  };

  const filterAndSortOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.style.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.currentStatus === statusFilter
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return (
            new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
          );
        case "status":
          return a.currentStatus.localeCompare(b.currentStatus);
        case "buyer":
          return a.buyer.name.localeCompare(b.buyer.name);
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  };

  const statusOptions: (ProcessStatus | "all")[] = [
    "all",
    "cutting",
    "numbering",
    "shiwake",
    "sewing",
    "qc_sewing",
    "ironing",
    "final_qc",
    "packing",
    "completed",
  ];

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
              <p className="text-2xl font-bold text-gray-900">
                {orders.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-orange-600">
                {
                  orders.filter(
                    (o) =>
                      o.currentStatus !== "completed" &&
                      o.currentStatus !== "on_hold"
                  ).length
                }
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {orders.filter((o) => o.currentStatus === "completed").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-gray-600">On Hold</p>
              <p className="text-2xl font-bold text-red-600">
                {orders.filter((o) => o.currentStatus === "on_hold").length}
              </p>
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

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as ProcessStatus | "all")
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                {statusOptions.slice(1).map((status) => (
                  <option key={status} value={status}>
                    {PROCESS_STATUS_LABELS[status as ProcessStatus]}
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
                  setSortBy(e.target.value as "date" | "status" | "buyer")
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Order Date (Newest)</option>
                <option value="status">Status</option>
                <option value="buyer">Buyer Name</option>
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {(searchTerm || statusFilter !== "all") && (
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
              {statusFilter !== "all" && (
                <Badge variant="info">
                  Status: {PROCESS_STATUS_LABELS[statusFilter as ProcessStatus]}
                  <button
                    onClick={() => setStatusFilter("all")}
                    className="ml-2 hover:text-blue-900"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
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
              {searchTerm || statusFilter !== "all"
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
