// src/app/inventory/accessories/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { Accessory } from "@/lib/types-inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { AccessoryForm } from "@/components/AccessoryForm";
import { StockTransactionModal } from "@/components/StockTransactionModal";
import { formatNumber } from "@/lib/utils";
import {
  Package,
  Plus,
  AlertTriangle,
  Edit,
  Trash2,
  ArrowDownToLine,
  RefreshCw,
} from "lucide-react";

export default function AccessoriesPage() {
  const [accessories, setAccessories] = useState<
    (Accessory & {
      currentStock?: number;
      isLowStock?: boolean;
    })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(
    null
  );

  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [transactionAccessory, setTransactionAccessory] = useState<any>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteAccessory, setDeleteAccessory] = useState<Accessory | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadAccessories();
  }, [showLowStockOnly]);

  const loadAccessories = async () => {
    try {
      const url = showLowStockOnly
        ? "/api/accessories?lowStock=true"
        : "/api/accessories";
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setAccessories(result.data);
      }
    } catch (error) {
      console.error("Error loading accessories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (accessory: Accessory) => {
    setSelectedAccessory(accessory);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedAccessory(null);
    setIsFormOpen(true);
  };

  const handleStockIn = (accessory: any) => {
    setTransactionAccessory(accessory);
    setIsTransactionOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteAccessory) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/accessories/${deleteAccessory.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setIsDeleteOpen(false);
        setDeleteAccessory(null);
        loadAccessories();
      } else {
        alert(result.error || "Failed to delete accessory");
      }
    } catch (error) {
      alert("Failed to delete accessory");
    } finally {
      setIsDeleting(false);
    }
  };

  const lowStockCount = accessories.filter((a) => a.isLowStock).length;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading accessories...</p>
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
            Accessories Inventory
          </h1>
          <p className="text-gray-600">Manage accessories and trims</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => loadAccessories()} variant="outline" size="sm">
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
            Add Accessory
          </Button>
        </div>
      </div>

      {/* Accessories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accessories.map((accessory) => (
          <Card
            key={accessory.id}
            hover
            className={accessory.isLowStock ? "border-2 border-red-500" : ""}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{accessory.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {accessory.accessoryCode}
                  </p>
                </div>
                {accessory.isLowStock && (
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
                    {accessory.category}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Stock</span>
                  <span
                    className={`text-2xl font-bold ${
                      accessory.isLowStock ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {formatNumber(accessory.currentStock || 0)} {accessory.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Minimum Stock</span>
                  <span className="font-semibold">
                    {accessory.minimumStock} {accessory.unit}
                  </span>
                </div>
                {accessory.unitPrice && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Unit Price</span>
                    <span className="font-semibold">
                      Rp {formatNumber(accessory.unitPrice)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-2">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleStockIn(accessory)}
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  Stock In
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(accessory)}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setDeleteAccessory(accessory);
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

      {accessories.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">
              {showLowStockOnly
                ? "No low stock accessories"
                : "No accessories found"}
            </p>
            {!showLowStockOnly && (
              <Button onClick={handleCreate} variant="primary">
                <Plus className="w-4 h-4" />
                Add Your First Accessory
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Accessory Form Modal */}
      <AccessoryForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedAccessory(null);
        }}
        onSuccess={loadAccessories}
        accessory={selectedAccessory}
      />

      {/* Stock Transaction Modal */}
      {transactionAccessory && (
        <StockTransactionModal
          isOpen={isTransactionOpen}
          onClose={() => {
            setIsTransactionOpen(false);
            setTransactionAccessory(null);
          }}
          onSuccess={loadAccessories}
          item={{
            id: transactionAccessory.id,
            code: transactionAccessory.accessoryCode,
            name: transactionAccessory.name,
            unit: transactionAccessory.unit,
            currentStock: transactionAccessory.currentStock,
          }}
          type="accessory"
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => !isDeleting && setIsDeleteOpen(false)}
        title="Delete Accessory"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete{" "}
            <span className="font-bold">{deleteAccessory?.name}</span>?
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
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
