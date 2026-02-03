// src/app/inventory/materials/page.tsx - COMPLETE CRUD

"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Material } from "@/lib/types-inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { MaterialForm } from "@/components/MaterialForm";
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
  ArrowLeft,
} from "lucide-react";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<
    (Material & { currentStock?: number; isLowStock?: boolean })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Form modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );

  // Transaction modal
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [transactionMaterial, setTransactionMaterial] = useState<any>(null);

  // Delete modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteMaterial, setDeleteMaterial] = useState<Material | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    loadMaterials();
  }, [showLowStockOnly]);

  useEffect(() => {
    const lowStockParam = searchParams.get("lowStock");
    if (lowStockParam === "true") {
      setShowLowStockOnly(true);
    }
    loadMaterials();
  }, [searchParams]);

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
          <p>Memuat bahan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground mb-2">Bahan</h1>
          <p className="text-muted-foreground">
            Manage raw materials and fabrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => loadMaterials()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
            Muat Ulang
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
            Tambah Bahan
          </Button>{" "}
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
                  <p className="text-sm text-muted-foreground mt-1">
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
                  <span className="text-sm text-muted-foreground">
                    Kategori
                  </span>
                  <Badge variant="info" size="sm">
                    {material.category}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Stock Sekarang
                  </span>
                  <span
                    className={`text-2xl font-bold ${
                      material.isLowStock ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {formatNumber(material.currentStock || 0)} {material.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Stok Minimum</span>
                  <span className="font-semibold text-muted-foreground">
                    {material.minimumStock} {material.unit}
                  </span>
                </div>
                {material.unitPrice && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Harga Satuan</span>
                    <span className="font-semibold text-muted-foreground">
                      Rp {formatNumber(material.unitPrice)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleStockIn(material)}
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  Stok Masuk
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(material)}
                >
                  <Edit className="w-4 h-4" />
                  Ubah
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
                  Hapus
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {materials.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {showLowStockOnly
                ? "No low stock materials"
                : "No materials found"}
            </p>
            {!showLowStockOnly && (
              <Button onClick={handleCreate} variant="primary">
                <Plus className="w-4 h-4" />
                Tambah bahan pertama
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
          <p className="text-foreground">
            Anda yakin ingin menghapus?{" "}
            <span className="font-bold">{deleteMaterial?.name}</span>?
          </p>
          <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
            <p className="text-sm text-red-600">
              ⚠️ Tindakan ini bersifat permanen. Semua riwayat transaksi akan
              dihapus.
            </p>
          </div>
        </div>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setIsDeleteOpen(false)}
            disabled={isDeleting}
          >
            Batal
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
