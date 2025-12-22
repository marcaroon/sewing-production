// app/orders/page.tsx - ADVANCED FILTERING & SORTING VERSION

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
  Calendar,
  ArrowUpDown,
  Download,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface FilterState {
  searchTerm: string;
  processFilter: ProcessName | "all";
  phaseFilter: "all" | "production" | "delivery";
  stateFilter:
    | "all"
    | "at_ppic"
    | "waiting"
    | "assigned"
    | "in_progress"
    | "completed";
  buyerFilter: string;
  dateRange: {
    type: "all" | "custom" | "today" | "week" | "month" | "year";
    startDate: string;
    endDate: string;
  };
  deadlineStatus: "all" | "on-time" | "delayed";
  completionRange: {
    min: number;
    max: number;
  };
}

export default function AdvancedOrdersPage() {
  const { user } = useAuth();
  const canCreateOrder = ["admin", "ppic"].includes(user?.role || "");
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    processFilter: "all",
    phaseFilter: "all",
    stateFilter: "all",
    buyerFilter: "all",
    dateRange: {
      type: "all",
      startDate: "",
      endDate: "",
    },
    deadlineStatus: "all",
    completionRange: {
      min: 0,
      max: 100,
    },
  });

  // Sort State
  const [sortConfig, setSortConfig] = useState<{
    field:
      | "date"
      | "process"
      | "buyer"
      | "deadline"
      | "completion"
      | "quantity";
    direction: "asc" | "desc";
  }>({
    field: "date",
    direction: "desc",
  });

  // View Mode
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [orders, filters, sortConfig]);

  const loadOrders = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await apiClient.getOrders();
      setOrders(data);
    } catch (err) {
      console.error("Error loading orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...orders];

    // Search Filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.buyer.name.toLowerCase().includes(searchLower) ||
          order.style.name.toLowerCase().includes(searchLower) ||
          order.style.styleCode.toLowerCase().includes(searchLower)
      );
    }

    // Process Filter
    if (filters.processFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.currentProcess === filters.processFilter
      );
    }

    // Phase Filter
    if (filters.phaseFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.currentPhase === filters.phaseFilter
      );
    }

    // State Filter
    if (filters.stateFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.currentState === filters.stateFilter
      );
    }

    // Buyer Filter
    if (filters.buyerFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.buyer.id === filters.buyerFilter
      );
    }

    // Date Range Filter
    if (filters.dateRange.type !== "all") {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      switch (filters.dateRange.type) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "year":
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        case "custom":
          startDate = filters.dateRange.startDate
            ? new Date(filters.dateRange.startDate)
            : new Date(0);
          endDate = filters.dateRange.endDate
            ? new Date(filters.dateRange.endDate)
            : new Date();
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    // Deadline Status Filter
    if (filters.deadlineStatus !== "all") {
      const now = new Date();
      filtered = filtered.filter((order) => {
        if (order.currentProcess === "delivered") return false;
        const deadline = new Date(order.productionDeadline);
        const isDelayed = now > deadline;

        return filters.deadlineStatus === "delayed" ? isDelayed : !isDelayed;
      });
    }

    // Completion Range Filter
    if (filters.completionRange.min > 0 || filters.completionRange.max < 100) {
      filtered = filtered.filter((order) => {
        const completion =
          order.totalQuantity > 0
            ? (order.totalCompleted / order.totalQuantity) * 100
            : 0;
        return (
          completion >= filters.completionRange.min &&
          completion <= filters.completionRange.max
        );
      });
    }

    // Apply Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.field) {
        case "date":
          comparison =
            new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
          break;
        case "process":
          comparison = a.currentProcess.localeCompare(b.currentProcess);
          break;
        case "buyer":
          comparison = a.buyer.name.localeCompare(b.buyer.name);
          break;
        case "deadline":
          comparison =
            new Date(a.productionDeadline).getTime() -
            new Date(b.productionDeadline).getTime();
          break;
        case "completion":
          const compA =
            a.totalQuantity > 0
              ? (a.totalCompleted / a.totalQuantity) * 100
              : 0;
          const compB =
            b.totalQuantity > 0
              ? (b.totalCompleted / b.totalQuantity) * 100
              : 0;
          comparison = compA - compB;
          break;
        case "quantity":
          comparison = a.totalQuantity - b.totalQuantity;
          break;
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    setFilteredOrders(filtered);
  };

  const handleSort = (field: typeof sortConfig.field) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      searchTerm: "",
      processFilter: "all",
      phaseFilter: "all",
      stateFilter: "all",
      buyerFilter: "all",
      dateRange: {
        type: "all",
        startDate: "",
        endDate: "",
      },
      deadlineStatus: "all",
      completionRange: {
        min: 0,
        max: 100,
      },
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.processFilter !== "all") count++;
    if (filters.phaseFilter !== "all") count++;
    if (filters.stateFilter !== "all") count++;
    if (filters.buyerFilter !== "all") count++;
    if (filters.dateRange.type !== "all") count++;
    if (filters.deadlineStatus !== "all") count++;
    if (filters.completionRange.min > 0 || filters.completionRange.max < 100)
      count++;
    return count;
  };

  const exportToCSV = () => {
    const headers = [
      "Order Number",
      "Buyer",
      "Style",
      "Order Date",
      "Status",
      "Quantity",
      "Completed",
    ];
    const rows = filteredOrders.map((order) => [
      order.orderNumber,
      order.buyer.name,
      order.style.name,
      new Date(order.orderDate).toLocaleDateString(),
      order.currentProcess,
      order.totalQuantity,
      order.totalCompleted,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ORDERS-EXPORT-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const uniqueBuyers = Array.from(
    new Set(
      orders.map((o) => JSON.stringify({ id: o.buyer.id, name: o.buyer.name }))
    )
  ).map((s) => JSON.parse(s));

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

  const activeFilterCount = getActiveFilterCount();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Memuat semua order...</p>
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
                Coba lagi
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
              Semua Order
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-all font-semibold shadow-sm hover:shadow-md flex items-center gap-2"
            >
              Ekspor CSV
            </button>
            {canCreateOrder && (
              <Link href="/orders/new">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-sm hover:shadow-md flex items-center gap-2">
                  Order Baru
                </button>
              </Link>
            )}
          </div>
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
                    Sedang Berjalan
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
                    Selesai
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
                    Ditahan
                  </p>
                  <p className="text-2xl font-bold text-red-600">{onHold}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          {/* Basic Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                Pencarian
              </label>
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) =>
                  setFilters({ ...filters, searchTerm: e.target.value })
                }
                placeholder="Order, buyer, style..."
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
              />
            </div>

            {/* Process Filter */}
            <div>
              <label className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                Proses
              </label>
              <select
                value={filters.processFilter}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    processFilter: e.target.value as ProcessName | "all",
                  })
                }
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
              >
                <option value="all">Semua Proses</option>
                {processOptions.slice(1).map((process) => (
                  <option key={process} value={process}>
                    {PROCESS_LABELS[process as ProcessName]}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Type */}
            <div>
              <label className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                Rentan Tanggal
              </label>
              <select
                value={filters.dateRange.type}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    dateRange: {
                      ...filters.dateRange,
                      type: e.target.value as any,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
              >
                <option value="all">Semua Waktu </option>
                <option value="today">Hari ini</option>
                <option value="week">7 Hari Terakhir</option>
                <option value="month">Sebulan Terakhir</option>
                <option value="year">Setahun Terakhir</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                Urutkan Berdasarkan
              </label>
              <div className="flex gap-2">
                <select
                  value={sortConfig.field}
                  onChange={(e) => handleSort(e.target.value as any)}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                >
                  <option value="date">Tanggal Order</option>
                  <option value="deadline">Batas Waktu</option>
                  <option value="process">Proses</option>
                  <option value="buyer">Buyer</option>
                  <option value="completion">Penyelesaian</option>
                  <option value="quantity">Jumlah</option>
                </select>
                <button
                  onClick={() =>
                    setSortConfig((prev) => ({
                      ...prev,
                      direction: prev.direction === "asc" ? "desc" : "asc",
                    }))
                  }
                  className="px-3 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title={
                    sortConfig.direction === "asc" ? "Ascending" : "Descending"
                  }
                >
                  <ChevronDown
                    className={`w-5 h-5 transition-transform text-gray-600 ${
                      sortConfig.direction === "asc" ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Custom Date Range (shown when custom selected) */}
          {filters.dateRange.type === "custom" && (
            <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={filters.dateRange.startDate}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      dateRange: {
                        ...filters.dateRange,
                        startDate: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={filters.dateRange.endDate}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      dateRange: {
                        ...filters.dateRange,
                        endDate: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                />
              </div>
            </div>
          )}

          {/* Advanced Filters Toggle */}
          <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold text-sm"
            >
              {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
              {activeFilterCount > 0 && (
                <Badge variant="info" size="sm">
                  {activeFilterCount} active
                </Badge>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-red-600 hover:text-red-800 font-semibold text-sm flex items-center gap-1"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* Advanced Filters Section */}
          {showAdvancedFilters && (
            <div className="mt-4 p-4 bg-linear-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg space-y-4">
              <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                Advanced Filters
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Phase Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Phase
                  </label>
                  <select
                    value={filters.phaseFilter}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        phaseFilter: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 font-medium"
                  >
                    <option value="all">All Phases</option>
                    <option value="production">Production</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>

                {/* State Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    State
                  </label>
                  <select
                    value={filters.stateFilter}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        stateFilter: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 font-medium"
                  >
                    <option value="all">All States</option>
                    <option value="at_ppic">At PPIC</option>
                    <option value="waiting">Waiting</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Buyer Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Buyer
                  </label>
                  <select
                    value={filters.buyerFilter}
                    onChange={(e) =>
                      setFilters({ ...filters, buyerFilter: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 font-medium"
                  >
                    <option value="all">All Buyers</option>
                    {uniqueBuyers.map((buyer: any) => (
                      <option key={buyer.id} value={buyer.id}>
                        {buyer.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Deadline Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Deadline Status
                  </label>
                  <select
                    value={filters.deadlineStatus}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        deadlineStatus: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 font-medium"
                  >
                    <option value="all">All Orders</option>
                    <option value="on-time">On Time</option>
                    <option value="delayed">Delayed</option>
                  </select>
                </div>

                {/* Completion Range */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Completion Range: {filters.completionRange.min}% -{" "}
                    {filters.completionRange.max}%
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.completionRange.min}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          completionRange: {
                            ...filters.completionRange,
                            min: parseInt(e.target.value),
                          },
                        })
                      }
                      className="flex-1"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.completionRange.max}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          completionRange: {
                            ...filters.completionRange,
                            max: parseInt(e.target.value),
                          },
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <div className="mt-4 pt-4 border-t-2 border-gray-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">
                  Active filters:
                </span>

                {filters.searchTerm && (
                  <Badge variant="info" className="flex items-center gap-1.5">
                    Search: {filters.searchTerm}
                    <button
                      onClick={() => setFilters({ ...filters, searchTerm: "" })}
                      className="hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                {filters.processFilter !== "all" && (
                  <Badge variant="info" className="flex items-center gap-1.5">
                    Process:{" "}
                    {PROCESS_LABELS[filters.processFilter as ProcessName]}
                    <button
                      onClick={() =>
                        setFilters({ ...filters, processFilter: "all" })
                      }
                      className="hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                {filters.phaseFilter !== "all" && (
                  <Badge variant="purple" className="flex items-center gap-1.5">
                    Phase: {filters.phaseFilter}
                    <button
                      onClick={() =>
                        setFilters({ ...filters, phaseFilter: "all" })
                      }
                      className="hover:text-purple-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                {filters.dateRange.type !== "all" && (
                  <Badge
                    variant="success"
                    className="flex items-center gap-1.5"
                  >
                    Date: {filters.dateRange.type}
                    <button
                      onClick={() =>
                        setFilters({
                          ...filters,
                          dateRange: { ...filters.dateRange, type: "all" },
                        })
                      }
                      className="hover:text-green-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                {filters.deadlineStatus !== "all" && (
                  <Badge
                    variant="warning"
                    className="flex items-center gap-1.5"
                  >
                    Deadline: {filters.deadlineStatus}
                    <button
                      onClick={() =>
                        setFilters({ ...filters, deadlineStatus: "all" })
                      }
                      className="hover:text-yellow-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Info */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm font-semibold text-gray-700">
            Showing{" "}
            <span className="text-blue-600">{filteredOrders.length}</span> of{" "}
            <span className="text-gray-900">{totalOrders}</span> orders
          </p>

          {sortConfig.field && (
            <p className="text-xs text-gray-600">
              Sorted by:{" "}
              <span className="font-semibold">{sortConfig.field}</span> (
              {sortConfig.direction === "asc" ? "↑" : "↓"})
            </p>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              viewMode === "grid"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              viewMode === "list"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Orders Display */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-semibold text-gray-900 mb-2">
              No orders found
            </p>
            <p className="text-sm text-gray-600 mb-4">
              {activeFilterCount > 0
                ? "Try adjusting your filters"
                : "Create your first order to get started"}
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-blue-600 hover:text-blue-800 font-semibold text-sm underline"
              >
                Clear all filters
              </button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
