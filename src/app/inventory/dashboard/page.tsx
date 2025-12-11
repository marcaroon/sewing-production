// src/app/inventory/dashboard/page.tsx - COMPLETE Inventory Dashboard

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatNumber } from "@/lib/utils";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Wrench,
  DollarSign,
  ArrowRight,
  Plus,
} from "lucide-react";

interface InventoryStats {
  totalMaterials: number;
  totalAccessories: number;
  lowStockMaterials: number;
  lowStockAccessories: number;
  totalMaterialValue: number;
  totalAccessoryValue: number;
  recentTransactions: any[];
  topUsedMaterials: any[];
  topUsedAccessories: any[];
}

export default function InventoryDashboardPage() {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/inventory/dashboard");
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        setError("Failed to load dashboard");
      }
    } catch (err) {
      setError("Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">{error || "Failed to load data"}</p>
          <button
            onClick={loadDashboard}
            className="mt-3 text-sm text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Inventory Dashboard
            </h1>
            <p className="text-gray-600">
              Monitor stock levels, usage, and transactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/inventory/materials/new">
              <Button variant="primary">
                <Plus className="w-4 h-4" />
                Add Material
              </Button>
            </Link>
            <Link href="/inventory/accessories/new">
              <Button variant="success">
                <Plus className="w-4 h-4" />
                Add Accessory
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Materials */}
        <Card hover>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600 uppercase">
                  Materials
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalMaterials}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <Link href="/inventory/materials">
              <button className="mt-4 text-sm text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </CardContent>
        </Card>

        {/* Total Accessories */}
        <Card hover>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600 uppercase">
                  Accessories
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalAccessories}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Wrench className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <Link href="/inventory/accessories">
              <button className="mt-4 text-sm text-green-600 font-semibold hover:text-green-800 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card hover className="border-2 border-red-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-600 uppercase">
                  Low Stock
                </p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats.lowStockMaterials + stats.lowStockAccessories}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {stats.lowStockMaterials} materials,{" "}
                  {stats.lowStockAccessories} accessories
                </p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Value */}
        <Card hover>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600 uppercase">
                  Total Value
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  Rp{" "}
                  {formatNumber(
                    stats.totalMaterialValue + stats.totalAccessoryValue
                  )}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Materials + Accessories
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Link href="/inventory/materials?lowStock=true">
          <Card hover className="cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-10 h-10 text-orange-600" />
                <div>
                  <p className="font-bold text-gray-900">Low Stock Materials</p>
                  <p className="text-sm text-gray-600">
                    View items below minimum
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/inventory/accessories?lowStock=true">
          <Card hover className="cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-10 h-10 text-red-600" />
                <div>
                  <p className="font-bold text-gray-900">
                    Low Stock Accessories
                  </p>
                  <p className="text-sm text-gray-600">
                    View items below minimum
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/inventory/transactions">
          <Card hover className="cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="font-bold text-gray-900">Stock Transactions</p>
                  <p className="text-sm text-gray-600">
                    View all in/out movements
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Used Materials */}
        <Card>
          <CardHeader>
            <CardTitle>Top Used Materials</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topUsedMaterials && stats.topUsedMaterials.length > 0 ? (
              <div className="space-y-3">
                {stats.topUsedMaterials
                  .slice(0, 5)
                  .map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {item.materialCode}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {formatNumber(item.totalUsed)}
                        </p>
                        <p className="text-xs text-gray-600">{item.unit}</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">
                No usage data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Used Accessories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Used Accessories</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topUsedAccessories && stats.topUsedAccessories.length > 0 ? (
              <div className="space-y-3">
                {stats.topUsedAccessories
                  .slice(0, 5)
                  .map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {item.accessoryCode}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {formatNumber(item.totalUsed)}
                        </p>
                        <p className="text-xs text-gray-600">{item.unit}</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">
                No usage data yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
