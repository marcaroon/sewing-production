// app/orders/new/page.tsx (Fixed API Call)

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Buyer, Style, SizeType } from "@/lib/types-new";
import { SIZE_OPTIONS, BUYER_TYPE_LABELS } from "@/lib/constants-new";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import apiClient from "@/lib/api-client";

export default function NewOrderPage() {
  const router = useRouter();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    buyerId: "",
    styleId: "",
    orderDate: new Date().toISOString().split("T")[0],
    productionDeadline: "", // GANTI dari targetDate
    deliveryDeadline: "", // TAMBAHKAN ini
    createdBy: "Admin",
    notes: "",
  });

  const [sizeBreakdown, setSizeBreakdown] = useState<{
    [key in SizeType]?: number;
  }>({});

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

    if (!formData.buyerId) {
      newErrors.buyerId = "Please select a buyer";
    }

    if (!formData.styleId) {
      newErrors.styleId = "Please select a style";
    }

    if (!formData.productionDeadline) {
      newErrors.productionDeadline = "Please set production deadline";
    }

    if (!formData.deliveryDeadline) {
      newErrors.deliveryDeadline = "Please set delivery deadline";
    }

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (!selectedBuyer || !selectedStyle) {
      return;
    }

    setIsSubmitting(true);

    try {
      const totalQuantity = getTotalQuantity();

      // Create size breakdown array
      const sizeBreakdownArray = SIZE_OPTIONS.filter(
        (size) => sizeBreakdown[size] && sizeBreakdown[size]! > 0
      ).map((size) => ({
        size,
        quantity: sizeBreakdown[size]!,
      }));

      // Create order data matching NEW API schema
      const orderData = {
        buyerId: formData.buyerId,
        styleId: formData.styleId,
        orderDate: formData.orderDate,
        productionDeadline: formData.productionDeadline, // NEW field
        deliveryDeadline: formData.deliveryDeadline, // NEW field
        totalQuantity,
        sizeBreakdown: sizeBreakdownArray,
        createdBy: formData.createdBy,
        notes: formData.notes,
      };

      // Create order via API
      const newOrder = await apiClient.createOrder(orderData);

      // Generate QR codes for the order
      try {
        await apiClient.generateOrderQR(newOrder.id);
      } catch (qrError) {
        console.error("Failed to generate QR codes:", qrError);
        // Continue anyway, QR can be generated later
      }

      // Redirect to order detail
      router.push(`/orders/${newOrder.id}`);
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading form data...</p>
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
              Create New Order
            </h1>
            <p className="text-gray-600 mt-1">Buat order produksi baru</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Buyer Selection */}
        <Card>
          <CardHeader>
            <CardTitle>1. Select Buyer</CardTitle>
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.buyerId ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                >
                  <option value="">-- Select Buyer --</option>
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
                      <p className="text-blue-900 font-medium">Buyer Type</p>
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
                        Leftover Policy
                      </p>
                      <p className="text-blue-800 text-sm">
                        {selectedBuyer.leftoverPolicy?.canReuse
                          ? "✓ Material dapat digunakan kembali"
                          : "✗ Material harus diretur"}
                      </p>
                    </div>
                  </div>
                  {selectedBuyer.contactPerson && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-blue-900 font-medium text-sm">
                        Contact Person
                      </p>
                      <p className="text-blue-800 text-sm">
                        {selectedBuyer.contactPerson}
                        {selectedBuyer.phone && ` - ${selectedBuyer.phone}`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Style Selection */}
        <Card>
          <CardHeader>
            <CardTitle>2. Select Style</CardTitle>
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.styleId ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                >
                  <option value="">-- Select Style --</option>
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
                      <p className="text-gray-700 font-medium">Style Code</p>
                      <p className="text-gray-900">{selectedStyle.styleCode}</p>
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium">Category</p>
                      <p className="text-gray-900 capitalize">
                        {selectedStyle.category}
                      </p>
                    </div>
                  </div>
                  {selectedStyle.description && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-gray-700 font-medium text-sm">
                        Description
                      </p>
                      <p className="text-gray-600 text-sm">
                        {selectedStyle.description}
                      </p>
                    </div>
                  )}
                  {(selectedStyle.estimatedCuttingTime ||
                    selectedStyle.estimatedSewingTime) && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex gap-6 text-sm">
                      {selectedStyle.estimatedCuttingTime && (
                        <div>
                          <p className="text-gray-700 font-medium">
                            Est. Cutting Time
                          </p>
                          <p className="text-gray-600">
                            {selectedStyle.estimatedCuttingTime} min
                          </p>
                        </div>
                      )}
                      {selectedStyle.estimatedSewingTime && (
                        <div>
                          <p className="text-gray-700 font-medium">
                            Est. Sewing Time
                          </p>
                          <p className="text-gray-600">
                            {selectedStyle.estimatedSewingTime} min/pc
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Size Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>3. Size Breakdown</CardTitle>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    Total Quantity: {getTotalQuantity()} pieces
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    Estimated bundles: {Math.ceil(getTotalQuantity() / 10)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        {/* Schedule Section */}
        <Card>
          <CardHeader>
            <CardTitle>4. Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Order Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Date *
                </label>
                <input
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) =>
                    setFormData({ ...formData, orderDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>

              {/* Production Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Production Deadline *
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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

              {/* Delivery Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Deadline *
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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

            {/* Helpful hint */}
            <p className="text-xs text-gray-500 mt-2">
              💡 Delivery deadline should be after production completion to
              allow for final checks and packaging.
            </p>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>5. Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Created By *
              </label>
              <input
                type="text"
                value={formData.createdBy}
                onChange={(e) =>
                  setFormData({ ...formData, createdBy: e.target.value })
                }
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            Cancel
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
                Creating...
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
