// src/app/inventory/dashboard/page.tsx - REFACTORED & IMPROVED

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatNumber, formatDateTime } from "@/lib/utils";
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  Plus,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Clock,
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError("");

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboard();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Memuat dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">
                {error || "Failed to load data"}
              </p>
              <button
                onClick={loadDashboard}
                className="mt-3 text-sm text-red-800 font-semibold underline hover:text-red-900"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalLowStock = stats.lowStockMaterials + stats.lowStockAccessories;
  const totalValue = stats.totalMaterialValue + stats.totalAccessoryValue;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory</h1>
            <p className="text-gray-600">
              Monitor stock levels, usage, and transactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Muat Ulang
            </Button>
            <Link href="/inventory/materials">
              <Button variant="primary">
                <Plus className="w-4 h-4" />
                Tambah Bahan
              </Button>
            </Link>
            <Link href="/inventory/accessories">
              <Button variant="success">
                <Plus className="w-4 h-4" />
                Tambah Aksesoris
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Materials */}
        <Card hover>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-full p-3">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <Badge variant="info" size="sm">
                Bahan
              </Badge>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase mb-1">
                Total Bahan
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalMaterials}
              </p>
            </div>
            <Link href="/inventory/materials">
              <button className="mt-4 text-sm text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1 group">
                Lihat Semua
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </CardContent>
        </Card>

        {/* Total Accessories */}
        <Card hover>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <ShoppingCart className="w-8 h-8 text-green-600" />
              </div>
              <Badge variant="success" size="sm">
                Aksesoris
              </Badge>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase mb-1">
                Total Aksesoris
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalAccessories}
              </p>
            </div>
            <Link href="/inventory/accessories">
              <button className="mt-4 text-sm text-green-600 font-semibold hover:text-green-800 flex items-center gap-1 group">
                Lihat Semua
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card
          hover
          className={totalLowStock > 0 ? "border-2 border-red-400" : ""}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div
                className={`rounded-full p-3 ${
                  totalLowStock > 0
                    ? "bg-red-100 animate-pulse"
                    : "bg-orange-100"
                }`}
              >
                <AlertTriangle
                  className={`w-8 h-8 ${
                    totalLowStock > 0 ? "text-red-600" : "text-orange-600"
                  }`}
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase mb-1">
                Low Stock Items
              </p>
              <p
                className={`text-3xl font-bold ${
                  totalLowStock > 0 ? "text-red-600" : "text-gray-900"
                }`}
              >
                {totalLowStock}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {stats.lowStockMaterials} bahan · {stats.lowStockAccessories}{" "}
                aksesoris
              </p>
            </div>
            {totalLowStock > 0 && (
              <div className="mt-4 flex gap-2">
                <Link
                  href="/inventory/materials?lowStock=true"
                  className="flex-1"
                >
                  <button className="w-full text-xs text-red-600 font-semibold hover:text-red-800 border-2 border-red-200 rounded-lg py-1.5 hover:bg-red-50 transition-colors">
                    Bahan
                  </button>
                </Link>
                <Link
                  href="/inventory/accessories?lowStock=true"
                  className="flex-1"
                >
                  <button className="w-full text-xs text-red-600 font-semibold hover:text-red-800 border-2 border-red-200 rounded-lg py-1.5 hover:bg-red-50 transition-colors">
                    Aksesoris
                  </button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Link href="/inventory/materials?lowStock=true">
            <Card
              hover
              className="cursor-pointer border-2 border-transparent hover:border-orange-300 transition-all"
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 rounded-lg p-3">
                    <AlertTriangle className="w-8 h-8 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-1">
                      Bahan Low Stock
                    </p>
                    <p className="text-sm text-gray-600">
                      {stats.lowStockMaterials} item dibawah minimum
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/inventory/accessories?lowStock=true">
            <Card
              hover
              className="cursor-pointer border-2 border-transparent hover:border-red-300 transition-all"
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="bg-red-100 rounded-lg p-3">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-1">
                      Aksesoris Low Stock
                    </p>
                    <p className="text-sm text-gray-600">
                      {stats.lowStockAccessories} item dibawah minimum
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/inventory/transactions">
            <Card
              hover
              className="cursor-pointer border-2 border-transparent hover:border-blue-300 transition-all"
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 rounded-lg p-3">
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-1">
                      Stok Transaksi
                    </p>
                    <p className="text-sm text-gray-600">Lihat semua</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Used Materials */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pengunaan Bahan Teratas</CardTitle>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {stats.topUsedMaterials && stats.topUsedMaterials.length > 0 ? (
              <div className="space-y-3">
                {stats.topUsedMaterials
                  .slice(0, 5)
                  .map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {item.materialCode}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-900">
                          {formatNumber(item.totalUsed)}
                        </p>
                        <p className="text-xs text-gray-600">{item.unit}</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  Belum ada data penggunaan
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Penggunaan bahan akan ditampilkan setelah pesanan diproses
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Used Accessories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Penggunaan Aksesoris Terbanyak</CardTitle>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            {stats.topUsedAccessories && stats.topUsedAccessories.length > 0 ? (
              <div className="space-y-3">
                {stats.topUsedAccessories
                  .slice(0, 5)
                  .map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {item.accessoryCode}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-900">
                          {formatNumber(item.totalUsed)}
                        </p>
                        <p className="text-xs text-gray-600">{item.unit}</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  Belum ada data penggunaan
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Penggunaan aksesoris akan ditampilkan setelah pesanan diproses
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      {stats.recentTransactions && stats.recentTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transaksi Terbaru</CardTitle>
              <Link href="/inventory/transactions">
                <button className="text-sm text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1">
                  Lihat Semua
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentTransactions
                .slice(0, 10)
                .map((tx: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`rounded-full p-2 ${
                          tx.transactionType === "in"
                            ? "bg-green-100"
                            : tx.transactionType === "out"
                            ? "bg-red-100"
                            : "bg-yellow-100"
                        }`}
                      >
                        {tx.transactionType === "in" ? (
                          <Package className="w-4 h-4 text-green-600" />
                        ) : (
                          <ShoppingCart className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">
                          {tx.type === "material"
                            ? tx.material?.name
                            : tx.accessory?.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDateTime(tx.transactionDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={
                          tx.transactionType === "in"
                            ? "success"
                            : tx.transactionType === "out"
                            ? "danger"
                            : "warning"
                        }
                        size="sm"
                      >
                        {tx.transactionType}
                      </Badge>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            tx.quantity > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {tx.quantity > 0 ? "+" : ""}
                          {formatNumber(tx.quantity)}
                        </p>
                        <p className="text-xs text-gray-600">{tx.unit}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
