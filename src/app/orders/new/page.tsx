// app/orders/new/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Order, Buyer, Style, SizeType } from "@/lib/types";
import { orderStorage, buyerStorage, styleStorage } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { generateOrderNumber, generateId } from "@/lib/utils";
import { SIZE_OPTIONS, BUYER_TYPE_LABELS } from "@/lib/constants";

export default function NewOrderPage() {
  const router = useRouter();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);

  const [formData, setFormData] = useState({
    buyerId: "",
    styleId: "",
    orderDate: new Date().toISOString().split("T")[0],
    targetDate: "",
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

  const loadData = () => {
    setBuyers(buyerStorage.getAll());
    setStyles(styleStorage.getAll());
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

    if (!formData.targetDate) {
      newErrors.targetDate = "Please set a target date";
    }

    if (new Date(formData.targetDate) <= new Date(formData.orderDate)) {
      newErrors.targetDate = "Target date must be after order date";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (!selectedBuyer || !selectedStyle) {
      return;
    }

    const totalQuantity = getTotalQuantity();

    // Create size breakdown array
    const sizeBreakdownArray = SIZE_OPTIONS.filter(
      (size) => sizeBreakdown[size] && sizeBreakdown[size]! > 0
    ).map((size) => ({
      size,
      quantity: sizeBreakdown[size]!,
      completed: 0,
      rejected: 0,
      bundleCount: Math.ceil(sizeBreakdown[size]! / 10), // 10 pieces per bundle
    }));

    // Create new order
    const newOrder: Order = {
      id: generateId("order"),
      orderNumber: generateOrderNumber(),
      buyer: selectedBuyer,
      style: selectedStyle,
      orderDate: new Date(formData.orderDate),
      targetDate: new Date(formData.targetDate),
      totalQuantity,
      sizeBreakdown: sizeBreakdownArray,
      currentStatus: "draft",
      progress: {
        cutting: 0,
        numbering: 0,
        shiwake: 0,
        sewing: 0,
        qc: 0,
        ironing: 0,
        finalQc: 0,
        packing: 0,
      },
      materialsIssued: false,
      wip: {
        atCutting: 0,
        atNumbering: 0,
        atShiwake: 0,
        atSewing: 0,
        atQC: 0,
        atIroning: 0,
        atPacking: 0,
      },
      leadTime: {},
      totalRejected: 0,
      totalRework: 0,
      hasLeftover: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: formData.createdBy,
      notes: formData.notes,
    };

    // Save order
    orderStorage.save(newOrder);

    // Redirect to order detail
    router.push(`/orders/${newOrder.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push("/orders")}
            className="text-gray-600 hover:text-gray-900"
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
                        {selectedBuyer.leftoverPolicy.canReuse
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
        <Card>
          <CardHeader>
            <CardTitle>4. Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Date *
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) =>
                    setFormData({ ...formData, targetDate: e.target.value })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.targetDate ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.targetDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.targetDate}
                  </p>
                )}
              </div>
            </div>
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
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="lg">
            Create Order
          </Button>
        </div>
      </form>
    </div>
  );
}
