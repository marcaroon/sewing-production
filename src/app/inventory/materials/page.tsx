// src/app/inventory/materials/page.tsx - COMPLETE CRUD

"use client";

import React, { useEffect, useState } from "react";
import { Material } from "@/lib/types-inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { MaterialForm } from "@/components/MaterialForm";
import { StockTransactionModal } from "@/components/StockTransactionModal";
import { formatNumber } from "@/lib/utils";
import { Package, Plus, AlertTriangle, Edit, Trash2, ArrowDownToLine, ArrowUpFromLine, RefreshCw } from "lucide-react";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<
    (Material & { currentStock?: number; isLowStock?: boolean })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  
  // Form modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  // Transaction modal
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [transactionMaterial, setTransactionMaterial] = useState<any>(null);
  
  // Delete modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteMaterial, setDeleteMaterial] = useState<Material | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleEdit = (material: Material) => {
    setSelectedMaterial(material);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedMaterial(null);
    setIsFormOpen(true);
  };

  const handleStockIn = (material: any) => {
    setTransactionMaterial(material);
    setIsTransactionOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteMaterial) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/materials/${deleteMaterial.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setIsDeleteOpen(false);
        setDeleteMaterial(null);
        loadMaterials();
      } else {
        alert(result.error || "Failed to delete material");
      }
    } catch (error) {
      alert("Failed to delete material");
    } finally {
      setIsDeleting(false);
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
            onClick={() => loadMaterials()}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            variant={showLowStockOnly ? "danger" : "outline"}
            size="sm"
          >
            <AlertTriangle className="w-4 h-4" />
            Low Stock ({lowStockCount})
          </Button>
          <Button onClick={handleCreate} variant="primary">
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
                <div className="flex-1">
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

              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-2">
                <Button 
                  variant="success" 
                  size="sm"
                  onClick={() => handleStockIn(material)}
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  Stock In
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(material)}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={() => {
                    setDeleteMaterial(material);
                    setIsDeleteOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
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
            <p className="text-gray-600 mb-4">
              {showLowStockOnly
                ? "No low stock materials"
                : "No materials found"}
            </p>
            {!showLowStockOnly && (
              <Button onClick={handleCreate} variant="primary">
                <Plus className="w-4 h-4" />
                Add Your First Material
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Material Form Modal */}
      <MaterialForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedMaterial(null);
        }}
        onSuccess={loadMaterials}
        material={selectedMaterial}
      />

      {/* Stock Transaction Modal */}
      {transactionMaterial && (
        <StockTransactionModal
          isOpen={isTransactionOpen}
          onClose={() => {
            setIsTransactionOpen(false);
            setTransactionMaterial(null);
          }}
          onSuccess={loadMaterials}
          item={{
            id: transactionMaterial.id,
            code: transactionMaterial.materialCode,
            name: transactionMaterial.name,
            unit: transactionMaterial.unit,
            currentStock: transactionMaterial.currentStock,
          }}
          type="material"
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => !isDeleting && setIsDeleteOpen(false)}
        title="Delete Material"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete{" "}
            <span className="font-bold">{deleteMaterial?.name}</span>?
          </p>
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-sm text-red-800">
              ⚠️ This action cannot be undone. All transaction history will be
              deleted.
            </p>
          </div>
        </div>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setIsDeleteOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}