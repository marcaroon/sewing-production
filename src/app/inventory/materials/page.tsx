"use client";

import React, { useEffect, useState } from "react";
import { Material } from "@/lib/types-inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatNumber } from "@/lib/utils";
import { Package, Plus, AlertTriangle } from "lucide-react";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<
    (Material & { currentStock?: number; isLowStock?: boolean })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, [showLowStockOnly]);

  const loadMaterials = async () => {
    try {
      const url = showLowStockOnly
        ? "/api/materials?lowStock=true"
        : "/api/materials";
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setMaterials(result.data);
      }
    } catch (error) {
      console.error("Error loading materials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const lowStockCount = materials.filter((m) => m.isLowStock).length;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Materials Inventory
          </h1>
          <p className="text-gray-600">Manage raw materials and fabrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            variant={showLowStockOnly ? "danger" : "outline"}
            size="sm"
          >
            <AlertTriangle className="w-4 h-4" />
            Low Stock ({lowStockCount})
          </Button>
          <Button variant="primary">
            <Plus className="w-4 h-4" />
            Add Material
          </Button>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((material) => (
          <Card
            key={material.id}
            hover
            className={material.isLowStock ? "border-2 border-red-500" : ""}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{material.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {material.materialCode}
                  </p>
                </div>
                {material.isLowStock && (
                  <Badge variant="danger" size="sm">
                    Low Stock
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Category</span>
                  <Badge variant="info" size="sm">
                    {material.category}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Stock</span>
                  <span
                    className={`text-2xl font-bold ${
                      material.isLowStock ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {formatNumber(material.currentStock || 0)} {material.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Minimum Stock</span>
                  <span className="font-semibold">
                    {material.minimumStock} {material.unit}
                  </span>
                </div>
                {material.unitPrice && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Unit Price</span>
                    <span className="font-semibold">
                      Rp {formatNumber(material.unitPrice)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Stock In
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {materials.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No materials found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
