// app/orders/page.tsx - ADVANCED FILTERING & SORTING VERSION WITH PROFESSIONAL STYLING

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
  Loader2,
  Users,
  Shirt,
  TrendingUp,
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
          const aCompletion =
            a.totalQuantity > 0
              ? (a.totalCompleted / a.totalQuantity) * 100
              : 0;
          const bCompletion =
            b.totalQuantity > 0
              ? (b.totalCompleted / b.totalQuantity) * 100
              : 0;
          comparison = aCompletion - bCompletion;
          break;
        case "quantity":
          comparison = a.totalQuantity - b.totalQuantity;
          break;
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    setFilteredOrders(filtered);
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
    setSortConfig({
      field: "date",
      direction: "desc",
    });
  };

  const exportData = () => {
    const csv = [
      [
        "Order Number",
        "Buyer",
        "Style",
        "Process",
        "Quantity",
        "Completed",
        "Deadline",
      ].join(","),
      ...filteredOrders.map((order) =>
        [
          order.orderNumber,
          order.buyer.name,
          order.style.name,
          order.currentProcess,
          order.totalQuantity,
          order.totalCompleted,
          new Date(order.productionDeadline).toLocaleDateString(),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Calculate active filter count
  const activeFilterCount = [
    filters.searchTerm !== "",
    filters.processFilter !== "all",
    filters.phaseFilter !== "all",
    filters.stateFilter !== "all",
    filters.buyerFilter !== "all",
    filters.dateRange.type !== "all",
    filters.deadlineStatus !== "all",
    filters.completionRange.min > 0 || filters.completionRange.max < 100,
  ].filter(Boolean).length;

  const isFiltered = activeFilterCount > 0;
  const totalOrders = orders.length;

  // Get unique buyers for filter dropdown
  const uniqueBuyers = Array.from(
    new Map(orders.map((order) => [order.buyer.id, order.buyer])).values()
  );

  // Get available processes
  const availableProcesses = Array.from(
    new Set(orders.map((order) => order.currentProcess))
  ).sort();

  // Sort options
  const sortOptions = [
    { value: "date", label: "Date" },
    { value: "process", label: "Process" },
    { value: "buyer", label: "Buyer" },
    { value: "deadline", label: "Deadline" },
    { value: "completion", label: "Completion" },
    { value: "quantity", label: "Quantity" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
            <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-red-900 mb-2">
              Error Loading Orders
            </h3>
            <p className="text-red-700 mb-6">{error}</p>
            <button
              onClick={loadOrders}
              className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all font-semibold"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 rounded-2xl p-6">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              All Orders
            </h1>
            <p className="text-gray-600">
              Manage and track all production orders
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportData}
              disabled={filteredOrders.length === 0}
              className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all font-semibold border-2 border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
            {canCreateOrder && (
              <Link
                href="/orders/new"
                className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-xl hover:bg-blue-50 transition-all font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create New Order
              </Link>
            )}
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order number, buyer, style, or style code..."
                value={filters.searchTerm}
                onChange={(e) =>
                  setFilters({ ...filters, searchTerm: e.target.value })
                }
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900 font-medium placeholder:text-gray-500"
              />
            </div>

            {/* Quick Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Phase Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
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
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none font-medium"
                >
                  <option value="all">All Phases</option>
                  <option value="production">Production</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              {/* Process Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Process
                </label>
                <select
                  value={filters.processFilter}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      processFilter: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none font-medium"
                >
                  <option value="all">All Processes</option>
                  {availableProcesses.map((process) => (
                    <option key={process} value={process}>
                      {PROCESS_LABELS[process as ProcessName] || process}
                    </option>
                  ))}
                </select>
              </div>

              {/* State Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
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
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none font-medium"
                >
                  <option value="all">All States</option>
                  <option value="at_ppic">At PPIC</option>
                  <option value="waiting">Waiting</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <div className="pt-4 border-t-2 border-gray-200">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
              >
                {/* <Filter className="w-4 h-4" /> */}
                {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showAdvancedFilters ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="pt-4 border-t-2 border-gray-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Buyer Filter */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Buyer
                    </label>
                    <select
                      value={filters.buyerFilter}
                      onChange={(e) =>
                        setFilters({ ...filters, buyerFilter: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none font-medium"
                    >
                      <option value="all">All Buyers</option>
                      {uniqueBuyers.map((buyer) => (
                        <option key={buyer.id} value={buyer.id}>
                          {buyer.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range Type */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Date Range
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
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none font-medium"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                      <option value="year">Last Year</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>
                </div>

                {/* Custom Date Range */}
                {filters.dateRange.type === "custom" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Start Date
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
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        End Date
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
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* Deadline Status */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
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
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none font-medium"
                  >
                    <option value="all">All Orders</option>
                    <option value="on-time">On Time</option>
                    <option value="delayed">Delayed</option>
                  </select>
                </div>

                {/* Completion Range */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Completion Range: {filters.completionRange.min}% -{" "}
                    {filters.completionRange.max}%
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-gray-600 mb-1 block">
                        Min
                      </label>
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
                        className="w-full"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-600 mb-1 block">
                        Max
                      </label>
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
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 items-center gap-2">
                {/* <ArrowUpDown className="w-4 h-4" /> */}
                Sort By
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {sortOptions.map((option) => {
                  const isActive = sortConfig.field === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() =>
                        setSortConfig({
                          field: option.value as any,
                          direction:
                            isActive && sortConfig.direction === "asc"
                              ? "desc"
                              : "asc",
                        })
                      }
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <span className="truncate">{option.label}</span>
                      {isActive && (
                        <span className="text-xs">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Filters Summary */}
            {activeFilterCount > 0 && (
              <div className="pt-4 border-t-2 border-gray-200">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-gray-700">
                    Active filters ({activeFilterCount}):
                  </span>

                  {filters.searchTerm && (
                    <Badge variant="info" className="flex items-center gap-1.5">
                      Search: {filters.searchTerm}
                      <button
                        onClick={() =>
                          setFilters({ ...filters, searchTerm: "" })
                        }
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
                    <Badge variant="info" className="flex items-center gap-1.5">
                      Phase: {filters.phaseFilter}
                      <button
                        onClick={() =>
                          setFilters({ ...filters, phaseFilter: "all" })
                        }
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}

                  {filters.stateFilter !== "all" && (
                    <Badge variant="info" className="flex items-center gap-1.5">
                      State: {filters.stateFilter}
                      <button
                        onClick={() =>
                          setFilters({ ...filters, stateFilter: "all" })
                        }
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}

                  {filters.buyerFilter !== "all" && (
                    <Badge variant="info" className="flex items-center gap-1.5">
                      Buyer:{" "}
                      {
                        uniqueBuyers.find((b) => b.id === filters.buyerFilter)
                          ?.name
                      }
                      <button
                        onClick={() =>
                          setFilters({ ...filters, buyerFilter: "all" })
                        }
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}

                  {filters.dateRange.type !== "all" && (
                    <Badge variant="info" className="flex items-center gap-1.5">
                      Date: {filters.dateRange.type}
                      <button
                        onClick={() =>
                          setFilters({
                            ...filters,
                            dateRange: { ...filters.dateRange, type: "all" },
                          })
                        }
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}

                  {filters.deadlineStatus !== "all" && (
                    <Badge variant="info" className="flex items-center gap-1.5">
                      Deadline: {filters.deadlineStatus}
                      <button
                        onClick={() =>
                          setFilters({ ...filters, deadlineStatus: "all" })
                        }
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}

                  {(filters.completionRange.min > 0 ||
                    filters.completionRange.max < 100) && (
                    <Badge variant="info" className="flex items-center gap-1.5">
                      Completion: {filters.completionRange.min}%-
                      {filters.completionRange.max}%
                      <button
                        onClick={() =>
                          setFilters({
                            ...filters,
                            completionRange: { min: 0, max: 100 },
                          })
                        }
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                </div>

                <button
                  onClick={clearAllFilters}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-red-50 text-red-700 px-6 py-3 rounded-lg hover:bg-red-100 transition-all font-semibold border-2 border-red-200"
                >
                  <X className="w-5 h-5" />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
          <div className="flex items-center gap-2">
            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <Package className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                Showing{" "}
                <span className="text-blue-600">{filteredOrders.length}</span>{" "}
                of <span className="text-blue-600">{totalOrders}</span> orders
              </p>
              <p className="text-xs text-gray-600">
                {isFiltered ? "Filtered results" : "All orders displayed"}
              </p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-3">
            {isFiltered && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold underline"
              >
                Clear all filters
              </button>
            )}
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 border-2 border-gray-200">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-16 text-center">
            <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Orders Found
            </h3>
            <p className="text-gray-600 mb-6">
              {isFiltered
                ? "No orders match your filter criteria. Try adjusting your filters."
                : "Start by creating your first order"}
            </p>
            {isFiltered ? (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all font-semibold"
              >
                <X className="w-5 h-5" />
                Clear All Filters
              </button>
            ) : canCreateOrder ? (
              <Link
                href="/orders/new"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all font-semibold"
              >
                <Plus className="w-5 h-5" />
                Create New Order
              </Link>
            ) : null}
          </div>
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
    </div>
  );
}
