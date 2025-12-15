// src/app/inventory/materials/[id]/page.tsx - MATERIAL DETAIL PAGE

"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MaterialForm } from "@/components/MaterialForm";
import { StockTransactionModal } from "@/components/StockTransactionModal";
import { formatNumber, formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  Edit,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  TrendingUp,
  AlertTriangle,
  Package,
} from "lucide-react";

export default function MaterialDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [material, setMaterial] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);

  useEffect(() => {
    loadMaterialData();
  }, [id]);

  const loadMaterialData = async () => {
    try {
      const [materialRes, transactionsRes] = await Promise.all([
        fetch(`/api/materials/${id}`),
        fetch(`/api/materials/${id}/transactions`),
      ]);

      const materialData = await materialRes.json();
      const transactionsData = await transactionsRes.json();

      if (materialData.success) {
        setMaterial(materialData.data);
      }

      if (transactionsData.success) {
        setTransactions(transactionsData.data);
      }
    } catch (error) {
      console.error("Error loading material:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading material details...</p>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">Material not found</p>
          <button
            onClick={() => router.push("/inventory/materials")}
            className="mt-3 text-sm text-red-800 underline"
          >
            Back to Materials
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push("/inventory/materials")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {material.name}
            </h1>
            <p className="text-gray-600 mt-1">{material.materialCode}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsFormOpen(true)}
              variant="outline"
              size="sm"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            <Button
              onClick={() => setIsTransactionOpen(true)}
              variant="success"
              size="sm"
            >
              <ArrowDownToLine className="w-4 h-4" />
              Stock In/Out
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card hover>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Current Stock
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatNumber(material.currentStock || 0)}
                </p>
                <p className="text-xs text-gray-600">{material.unit}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          hover
          className={material.isLowStock ? "border-2 border-red-500" : ""}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Minimum Stock
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {material.minimumStock}
                </p>
                <p className="text-xs text-gray-600">{material.unit}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Reorder Point
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {material.reorderPoint}
                </p>
                <p className="text-xs text-gray-600">{material.unit}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <History className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Transactions
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {transactions.length}
                </p>
                <p className="text-xs text-gray-600">total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Material Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Material Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <Badge variant="info" size="sm">
                {material.category}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Unit</p>
              <p className="font-semibold text-gray-900">{material.unit}</p>
            </div>
            {material.color && (
              <div>
                <p className="text-sm text-gray-600">Color</p>
                <p className="font-semibold text-gray-900">{material.color}</p>
              </div>
            )}
            {material.supplier && (
              <div>
                <p className="text-sm text-gray-600">Supplier</p>
                <p className="font-semibold text-gray-900">
                  {material.supplier}
                </p>
              </div>
            )}
            {material.unitPrice && (
              <div>
                <p className="text-sm text-gray-600">Unit Price</p>
                <p className="font-semibold text-gray-900">
                  Rp {formatNumber(material.unitPrice)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Status */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-semibold text-blue-700">
                  Available
                </span>
                <span className="text-lg font-bold text-blue-900">
                  {formatNumber(material.currentStock || 0)} {material.unit}
                </span>
              </div>
              {material.isLowStock && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-red-800">
                    ⚠️ Low Stock Alert
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Below minimum stock level
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats (if available) */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Track material usage in production orders
            </p>
            {/* TODO: Add usage stats */}
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No transactions yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Type
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Quantity
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Reference
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      By
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {formatDateTime(tx.transactionDate)}
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
                          {tx.transactionType}
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
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {tx.referenceType && (
                          <span>
                            {tx.referenceType}
                            {tx.referenceId && `: ${tx.referenceId}`}
                          </span>
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

      {/* Modals */}
      <MaterialForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadMaterialData}
        material={material}
      />

      <StockTransactionModal
        isOpen={isTransactionOpen}
        onClose={() => setIsTransactionOpen(false)}
        onSuccess={loadMaterialData}
        item={{
          id: material.id,
          code: material.materialCode,
          name: material.name,
          unit: material.unit,
          currentStock: material.currentStock,
        }}
        type="material"
      />
    </div>
  );
}
