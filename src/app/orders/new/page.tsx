// src/app/orders/new/page.tsx - UPDATED with Process Template Selection

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Buyer, Style, SizeType } from "@/lib/types-new";
import { SIZE_OPTIONS, BUYER_TYPE_LABELS } from "@/lib/constants-new";
import { getTemplateOptions, getTemplateById } from "@/lib/process-templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import apiClient from "@/lib/api-client";
import { MaterialAccessorySelector } from "@/components/MaterialAccessorySelector";
import { AlertCircle } from "lucide-react";

export default function NewOrderPage() {
  const router = useRouter();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingOrderNumber, setIsCheckingOrderNumber] = useState(false);

  const [formData, setFormData] = useState({
    orderNumber: "", // NEW: Manual input
    buyerId: "",
    styleId: "",
    orderDate: new Date().toISOString().split("T")[0],
    productionDeadline: "",
    deliveryDeadline: "",
    createdBy: "Admin",
    notes: "",
    processTemplateId: "full_process",
  });

  const [sizeBreakdown, setSizeBreakdown] = useState<{
    [key in SizeType]?: number;
  }>({});

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [selectedMaterials, setSelectedMaterials] = useState<
    Array<{
      materialId: string;
      quantityRequired: number;
    }>
  >([]);

  const [selectedAccessories, setSelectedAccessories] = useState<
    Array<{
      accessoryId: string;
      quantityRequired: number;
    }>
  >([]);

  const templateOptions = getTemplateOptions();
  const selectedTemplate = getTemplateById(formData.processTemplateId);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [buyersData, stylesData] = await Promise.all([
        apiClient.getBuyers(),
        apiClient.getStyles(),
      ]);
      setBuyers(buyersData);
      setStyles(stylesData);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load buyers and styles. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if order number exists
  const checkOrderNumberExists = async (orderNumber: string) => {
    if (!orderNumber.trim()) return;

    setIsCheckingOrderNumber(true);
    try {
      const response = await fetch(
        `/api/orders?search=${encodeURIComponent(
          orderNumber.trim().toUpperCase()
        )}`
      );
      const result = await response.json();

      if (result.success && result.data.length > 0) {
        const exactMatch = result.data.find(
          (order: any) =>
            order.orderNumber.toUpperCase() === orderNumber.trim().toUpperCase()
        );

        if (exactMatch) {
          setErrors({
            ...errors,
            orderNumber: `Order number "${orderNumber.toUpperCase()}" already exists`,
          });
        } else {
          const newErrors = { ...errors };
          delete newErrors.orderNumber;
          setErrors(newErrors);
        }
      } else {
        const newErrors = { ...errors };
        delete newErrors.orderNumber;
        setErrors(newErrors);
      }
    } catch (error) {
      console.error("Error checking order number:", error);
    } finally {
      setIsCheckingOrderNumber(false);
    }
  };

  const handleOrderNumberChange = (value: string) => {
    // Auto-uppercase and remove special characters except dash
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    setFormData({ ...formData, orderNumber: cleaned });

    // Clear error when typing
    if (errors.orderNumber) {
      const newErrors = { ...errors };
      delete newErrors.orderNumber;
      setErrors(newErrors);
    }
  };

  const handleOrderNumberBlur = () => {
    if (formData.orderNumber.trim()) {
      checkOrderNumberExists(formData.orderNumber);
    }
  };

  const selectedBuyer = buyers.find((b) => b.id === formData.buyerId);
  const selectedStyle = styles.find((s) => s.id === formData.styleId);

  const handleSizeChange = (size: SizeType, value: string) => {
    const qty = parseInt(value) || 0;
    setSizeBreakdown((prev) => ({
      ...prev,
      [size]: qty > 0 ? qty : undefined,
    }));
  };

  const getTotalQuantity = () => {
    return Object.values(sizeBreakdown).reduce(
      (sum, qty) => sum + (qty || 0),
      0
    );
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate order number
    if (!formData.orderNumber.trim()) {
      newErrors.orderNumber = "Order number is required";
    } else if (formData.orderNumber.trim().length < 3) {
      newErrors.orderNumber = "Order number must be at least 3 characters";
    }

    if (!formData.buyerId) newErrors.buyerId = "Please select a buyer";
    if (!formData.styleId) newErrors.styleId = "Please select a style";
    if (!formData.productionDeadline)
      newErrors.productionDeadline = "Please set production deadline";
    if (!formData.deliveryDeadline)
      newErrors.deliveryDeadline = "Please set delivery deadline";

    if (new Date(formData.productionDeadline) <= new Date(formData.orderDate)) {
      newErrors.productionDeadline =
        "Production deadline must be after order date";
    }

    if (
      new Date(formData.deliveryDeadline) <=
      new Date(formData.productionDeadline)
    ) {
      newErrors.deliveryDeadline =
        "Delivery deadline must be after production deadline";
    }

    if (getTotalQuantity() === 0) {
      newErrors.sizes = "Please add at least one size with quantity";
    }

    if (!formData.createdBy.trim()) {
      newErrors.createdBy = "Please enter your name";
    }

    if (!formData.processTemplateId) {
      newErrors.processTemplateId = "Please select a process template";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    if (!selectedBuyer || !selectedStyle) return;

    setIsSubmitting(true);

    try {
      const totalQuantity = getTotalQuantity();

      const sizeBreakdownArray = SIZE_OPTIONS.filter(
        (size) => sizeBreakdown[size] && sizeBreakdown[size]! > 0
      ).map((size) => ({
        size,
        quantity: sizeBreakdown[size]!,
      }));

      const orderData = {
        orderNumber: formData.orderNumber.trim().toUpperCase(), // NEW: Send manual order number
        buyerId: formData.buyerId,
        styleId: formData.styleId,
        orderDate: formData.orderDate,
        productionDeadline: formData.productionDeadline,
        deliveryDeadline: formData.deliveryDeadline,
        totalQuantity,
        sizeBreakdown: sizeBreakdownArray,
        createdBy: formData.createdBy,
        notes: formData.notes,
        processTemplateId: formData.processTemplateId,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        // Generate QR codes
        try {
          await apiClient.generateOrderQR(result.data.id);
        } catch (qrError) {
          console.error("Failed to generate QR codes:", qrError);
        }

        router.push(`/orders/${result.data.id}`);
      } else {
        alert(result.error || "Failed to create order");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat form data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push("/orders")}
            className="text-gray-600 hover:text-gray-900"
            disabled={isSubmitting}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Buat Order Baru
            </h1>
            <p className="text-gray-600 mt-1">Buat order produksi baru</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Nomor Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Order *
              </label>
              <input
                type="text"
                value={formData.orderNumber}
                onChange={(e) => handleOrderNumberChange(e.target.value)}
                onBlur={handleOrderNumberBlur}
                className={`w-full px-4 py-2 text-gray-600 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg ${
                  errors.orderNumber ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., ORD-2025-00001 or ANY-FORMAT-YOU-WANT"
                disabled={isSubmitting}
                maxLength={50}
              />

              {isCheckingOrderNumber && (
                <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  Mengecek kesediaan...
                </p>
              )}

              {errors.orderNumber && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.orderNumber}
                </p>
              )}

              {formData.orderNumber &&
                !errors.orderNumber &&
                !isCheckingOrderNumber && (
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Order number is available
                  </p>
                )}
            </div>
          </CardContent>
        </Card>
        {/* Buyer Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Pilih Buyer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buyer *
                </label>
                <select
                  value={formData.buyerId}
                  onChange={(e) =>
                    setFormData({ ...formData, buyerId: e.target.value })
                  }
                  className={`w-full px-4 py-2 text-gray-600 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.buyerId ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                >
                  <option value="">-- Pilih Buyer --</option>
                  {buyers.map((buyer) => (
                    <option key={buyer.id} value={buyer.id}>
                      {buyer.name} ({buyer.code}) -{" "}
                      {BUYER_TYPE_LABELS[buyer.type]}
                    </option>
                  ))}
                </select>
                {errors.buyerId && (
                  <p className="text-sm text-red-600 mt-1">{errors.buyerId}</p>
                )}
              </div>

              {selectedBuyer && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-900 font-medium">Jenis Buyer</p>
                      <Badge
                        variant={
                          selectedBuyer.type === "repeat"
                            ? "success"
                            : "warning"
                        }
                      >
                        {BUYER_TYPE_LABELS[selectedBuyer.type]}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-blue-900 font-medium">
                        Aturan Pengembalian
                      </p>
                      <p className="text-blue-800 text-sm">
                        {selectedBuyer.leftoverPolicy?.canReuse
                          ? "✓ Material dapat digunakan kembali"
                          : "✗ Material harus diretur"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Style Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Pilih Style</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Style *
                </label>
                <select
                  value={formData.styleId}
                  onChange={(e) =>
                    setFormData({ ...formData, styleId: e.target.value })
                  }
                  className={`w-full px-4 py-2 text-gray-600 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.styleId ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                >
                  <option value="">-- Pilih Style --</option>
                  {styles.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.styleCode} - {style.name}
                    </option>
                  ))}
                </select>
                {errors.styleId && (
                  <p className="text-sm text-red-600 mt-1">{errors.styleId}</p>
                )}
              </div>

              {selectedStyle && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-700 font-medium">Kode Style</p>
                      <p className="text-gray-900">{selectedStyle.styleCode}</p>
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium">Kategori</p>
                      <p className="text-gray-900 capitalize">
                        {selectedStyle.category}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* NEW: Process Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Pilih Template Proses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Alur Proses *
                </label>
                <select
                  value={formData.processTemplateId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      processTemplateId: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2 text-gray-600 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.processTemplateId
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                >
                  <option value="">-- Pilih Template --</option>
                  {templateOptions.map((template) => (
                    <option key={template.value} value={template.value}>
                      {template.label} ({template.steps} steps, ~{template.days}{" "}
                      days)
                    </option>
                  ))}
                </select>
                {errors.processTemplateId && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.processTemplateId}
                  </p>
                )}
              </div>

              {selectedTemplate && (
                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                  <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Template Preview
                  </h4>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-purple-700 font-semibold">
                        Total Tahapan
                      </p>
                      <p className="text-2xl font-bold text-purple-900">
                        {selectedTemplate.processes.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-purple-700 font-semibold">
                        Perkiraaan Hari
                      </p>
                      <p className="text-2xl font-bold text-purple-900">
                        ~{selectedTemplate.estimatedDays}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded p-3 max-h-48 overflow-y-auto">
                    <p className="text-xs font-bold text-purple-900 mb-2 uppercase">
                      Alur Tahapan:
                    </p>
                    <ol className="text-xs space-y-1">
                      {selectedTemplate.processes.map((process, idx) => (
                        <li key={process} className="text-gray-800">
                          <span className="font-bold text-purple-700">
                            {idx + 1}.
                          </span>{" "}
                          {process.replace(/_/g, " ").toUpperCase()}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Size Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Size Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {SIZE_OPTIONS.map((size) => (
                  <div key={size}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size {size}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={sizeBreakdown[size] || ""}
                      onChange={(e) => handleSizeChange(size, e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2 border text-gray-600 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSubmitting}
                    />
                  </div>
                ))}
              </div>

              {errors.sizes && (
                <p className="text-sm text-red-600">{errors.sizes}</p>
              )}

              {getTotalQuantity() > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-900 font-medium">
                    Jumlah Total: {getTotalQuantity()} pieces
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    Estimasi Bundle: {Math.ceil(getTotalQuantity() / 10)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Material Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Bahan & Aksesoris</CardTitle>
          </CardHeader>
          <CardContent>
            <MaterialAccessorySelector
              totalQuantity={getTotalQuantity()}
              selectedMaterials={selectedMaterials}
              selectedAccessories={selectedAccessories}
              onMaterialsChange={setSelectedMaterials}
              onAccessoriesChange={setSelectedAccessories}
            />
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Jadwal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Order *
                </label>
                <input
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) =>
                    setFormData({ ...formData, orderDate: e.target.value })
                  }
                  className="w-full px-4 py-2 text-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batas Waktu Produksi *
                </label>
                <input
                  type="date"
                  value={formData.productionDeadline}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      productionDeadline: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2 text-gray-400 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.productionDeadline
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                />
                {errors.productionDeadline && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.productionDeadline}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batas Waktu Pengiriman *
                </label>
                <input
                  type="date"
                  value={formData.deliveryDeadline}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryDeadline: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2 text-gray-400 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.deliveryDeadline
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                />
                {errors.deliveryDeadline && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.deliveryDeadline}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Tambahan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dibuat oleh *
              </label>
              <input
                type="text"
                value={formData.createdBy}
                onChange={(e) =>
                  setFormData({ ...formData, createdBy: e.target.value })
                }
                className={`w-full px-4 py-2 text-gray-400 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.createdBy ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Your name"
                disabled={isSubmitting}
              />
              {errors.createdBy && (
                <p className="text-sm text-red-600 mt-1">{errors.createdBy}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan (Opsional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border text-gray-400 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any special instructions or notes..."
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/orders")}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Membuat...
              </>
            ) : (
              "Create Order"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
