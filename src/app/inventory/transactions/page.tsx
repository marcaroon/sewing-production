// src/app/inventory/transactions/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime, formatNumber } from "@/lib/utils";
import {
  History,
  RefreshCw,
  ArrowDownToLine,
  ArrowUpFromLine,
  Filter,
  ArrowLeft, // Import ArrowLeft
} from "lucide-react";

export default function TransactionsPage() {
  const router = useRouter(); // Inisialisasi router
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: "all", // all, material, accessory
    transactionType: "all", // all, in, out, adjustment, return
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const [matsRes, accsRes] = await Promise.all([
        fetch("/api/materials"),
        fetch("/api/accessories"),
      ]);

      const matsData = await matsRes.json();
      const accsData = await accsRes.json();

      if (matsData.success && accsData.success) {
        // Fetch transactions for each material and accessory
        const allTransactions: any[] = [];

        // Get material transactions
        for (const mat of matsData.data) {
          const txRes = await fetch(`/api/materials/${mat.id}/transactions`);
          const txData = await txRes.json();
          if (txData.success) {
            allTransactions.push(
              ...txData.data.map((tx: any) => ({
                ...tx,
                itemType: "material",
                itemName: mat.name,
                itemCode: mat.materialCode,
              }))
            );
          }
        }

        // Get accessory transactions
        for (const acc of accsData.data) {
          const txRes = await fetch(`/api/accessories/${acc.id}/transactions`);
          const txData = await txRes.json();
          if (txData.success) {
            allTransactions.push(
              ...txData.data.map((tx: any) => ({
                ...tx,
                itemType: "accessory",
                itemName: acc.name,
                itemCode: acc.accessoryCode,
              }))
            );
          }
        }

        // Sort by date descending
        allTransactions.sort(
          (a, b) =>
            new Date(b.transactionDate).getTime() -
            new Date(a.transactionDate).getTime()
        );

        setTransactions(allTransactions);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter.type !== "all" && tx.itemType !== filter.type) return false;
    if (
      filter.transactionType !== "all" &&
      tx.transactionType !== filter.transactionType
    )
      return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4">
          {/* Tombol Back */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 pl-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Transaksi Stok
              </h1>
              <p className="text-gray-600">
                Riwayat pergerakan bahan dan aksesoris
              </p>
            </div>
            <Button onClick={loadTransactions} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Muat Ulang
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Item
                </label>
                <select
                  value={filter.type}
                  onChange={(e) =>
                    setFilter({ ...filter, type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Semua Jenis</option>
                  <option value="material">Hanya Bahan</option>
                  <option value="accessory">Hanya Aksesoris</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Transaksi
                </label>
                <select
                  value={filter.transactionType}
                  onChange={(e) =>
                    setFilter({ ...filter, transactionType: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Semua Transaksi</option>
                  <option value="in">Stok Masuk</option>
                  <option value="out">Stok Keluar</option>
                  <option value="adjustment">Penyesuaian</option>
                  <option value="return">Pengembalian</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card hover>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <History className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Total
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredTransactions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ArrowDownToLine className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Stok Masuk
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {
                    filteredTransactions.filter(
                      (tx) => tx.transactionType === "in"
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ArrowUpFromLine className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Stok Keluar
                </p>
                <p className="text-2xl font-bold text-red-900">
                  {
                    filteredTransactions.filter(
                      (tx) => tx.transactionType === "out"
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Filter className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Lain-lain
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {
                    filteredTransactions.filter(
                      (tx) =>
                        tx.transactionType !== "in" &&
                        tx.transactionType !== "out"
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              Tidak ditemukan transaksi
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Tanggal & Waktu
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Item
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Jenis
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Transaksi
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Jumlah
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Reference
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Oleh
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {formatDateTime(tx.transactionDate)}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900 text-sm">
                          {tx.itemName}
                        </p>
                        <p className="text-xs text-gray-600">{tx.itemCode}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            tx.itemType === "material" ? "info" : "success"
                          }
                          size="sm"
                        >
                          {tx.itemType === "material" ? "Bahan" : "Aksesoris"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
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
                          {tx.transactionType === "in"
                            ? "Masuk"
                            : tx.transactionType === "out"
                            ? "Keluar"
                            : tx.transactionType}
                        </Badge>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold ${
                          tx.quantity > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {tx.quantity > 0 ? "+" : ""}
                        {formatNumber(tx.quantity)} {tx.unit}
                      </td>

                      {/* MODIFIKASI: Kolom Reference */}
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {tx.referenceType === "order" ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-500">
                              {/* Ambil teks setelah 'order ' dari remarks */}
                              {tx.remarks?.includes("order ")
                                ? tx.remarks.split("order ")[1]
                                : tx.remarks || "Order"}
                            </span>
                          </div>
                        ) : (
                          <>
                            {tx.referenceType && (
                              <span className="font-medium">
                                {tx.referenceType}
                                {tx.referenceId && `: ${tx.referenceId}`}
                              </span>
                            )}
                            {tx.remarks && (
                              <p className="text-xs text-gray-500 mt-1">
                                {tx.remarks}
                              </p>
                            )}
                          </>
                        )}
                      </td>

                      <td className="py-3 px-4 text-sm text-gray-700">
                        {tx.performedBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
