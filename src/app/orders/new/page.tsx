// src/app/orders/new/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Buyer, Style, ProcessName } from "@/lib/types-new";
import {
  BUYER_TYPE_LABELS,
  PROCESS_LABELS,
  PROCESS_DEPARTMENT_MAP,
  DELIVERY_PROCESSES,
  PRODUCTION_PROCESSES,
} from "@/lib/constants-new";
import { getTemplateOptions, getTemplateById } from "@/lib/process-templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import apiClient from "@/lib/api-client";
import { MaterialAccessorySelector } from "@/components/MaterialAccessorySelector";
import { AlertCircle, ArrowLeft, Plus, Trash2 } from "lucide-react";

// Tipe data untuk baris size breakdown
interface SizeRow {
  size: string;
  quantity: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingOrderNumber, setIsCheckingOrderNumber] = useState(false);

  const [showBuyerForm, setShowBuyerForm] = useState(false);
  const [showStyleForm, setShowStyleForm] = useState(false);

  const [newBuyer, setNewBuyer] = useState({
    name: "",
    type: "repeat" as "repeat" | "one-time",
    code: "",
    contactPerson: "",
    phone: "",
    canReuse: false,
    returRequired: false,
    storageLocation: "",
  });

  const [newStyle, setNewStyle] = useState({
    styleCode: "",
    name: "",
    category: "shirt" as "shirt" | "pants" | "jacket" | "dress" | "other",
    description: "",
    estimatedCuttingTime: 0,
    estimatedSewingTime: 0,
  });

  const [formData, setFormData] = useState({
    orderNumber: "",
    buyerId: "",
    styleId: "",
    orderDate: new Date().toISOString().split("T")[0],
    productionDeadline: "",
    deliveryDeadline: "",
    createdBy: "Admin",
    notes: "",
    processTemplateId: "full_process",
  });

  // --- DYNAMIC SIZE STATE ---
  const [sizeRows, setSizeRows] = useState<SizeRow[]>([
    { size: "S", quantity: 0 },
    { size: "M", quantity: 0 },
    { size: "L", quantity: 0 },
    { size: "XL", quantity: 0 },
  ]);

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

  // Custom Process Flow State
  const [customProcessFlow, setCustomProcessFlow] = useState<ProcessName[]>([]);
  const [isCustomizing, setIsCustomizing] = useState(false);

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

  // Sync template flow
  useEffect(() => {
    if (formData.processTemplateId && !isCustomizing) {
      const template = getTemplateById(formData.processTemplateId);
      if (template) {
        setCustomProcessFlow([...template.processes]);
      }
    }
  }, [formData.processTemplateId]);

  // --- DYNAMIC SIZE FUNCTIONS ---

  const addSizeRow = () => {
    setSizeRows([...sizeRows, { size: "", quantity: 0 }]);
  };

  const removeSizeRow = (index: number) => {
    const newRows = [...sizeRows];
    newRows.splice(index, 1);
    setSizeRows(newRows);
  };

  const handleSizeChange = (
    index: number,
    field: keyof SizeRow,
    value: string | number
  ) => {
    const newRows = [...sizeRows];
    // @ts-ignore
    newRows[index][field] = value;
    setSizeRows(newRows);
  };

  const getTotalQuantity = () => {
    return sizeRows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
  };

  // --- PROCESS FLOW FUNCTIONS ---

  const addProcessToFlow = (processName: ProcessName) => {
    if (!customProcessFlow.includes(processName)) {
      setCustomProcessFlow([...customProcessFlow, processName]);
      setIsCustomizing(true);
    }
  };

  const removeProcessFromFlow = (processName: ProcessName) => {
    setCustomProcessFlow(customProcessFlow.filter((p) => p !== processName));
    setIsCustomizing(true);
  };

  const moveProcessUp = (index: number) => {
    if (index > 0) {
      const newFlow = [...customProcessFlow];
      [newFlow[index - 1], newFlow[index]] = [
        newFlow[index],
        newFlow[index - 1],
      ];
      setCustomProcessFlow(newFlow);
      setIsCustomizing(true);
    }
  };

  const moveProcessDown = (index: number) => {
    if (index < customProcessFlow.length - 1) {
      const newFlow = [...customProcessFlow];
      [newFlow[index], newFlow[index + 1]] = [
        newFlow[index + 1],
        newFlow[index],
      ];
      setCustomProcessFlow(newFlow);
      setIsCustomizing(true);
    }
  };

  const resetToTemplate = () => {
    const template = getTemplateById(formData.processTemplateId);
    if (template) {
      setCustomProcessFlow([...template.processes]);
      setIsCustomizing(false);
    }
  };

  // --- CREATE NEW DATA HANDLERS ---

  const handleCreateBuyer = async () => {
    try {
      const response = await fetch("/api/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBuyer),
      });

      const result = await response.json();
      if (result.success) {
        await loadData();
        setFormData({ ...formData, buyerId: result.data.id });
        setNewBuyer({
          name: "",
          type: "repeat",
          code: "",
          contactPerson: "",
          phone: "",
          canReuse: false,
          returRequired: false,
          storageLocation: "",
        });
        setShowBuyerForm(false);
        alert("Buyer created successfully!");
      } else {
        alert(result.error || "Failed to create buyer");
      }
    } catch (error) {
      console.error("Error creating buyer:", error);
      alert("Failed to create buyer");
    }
  };

  const handleCreateStyle = async () => {
    try {
      const response = await fetch("/api/styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStyle),
      });

      const result = await response.json();
      if (result.success) {
        await loadData();
        setFormData({ ...formData, styleId: result.data.id });
        setNewStyle({
          styleCode: "",
          name: "",
          category: "shirt",
          description: "",
          estimatedCuttingTime: 0,
          estimatedSewingTime: 0,
        });
        setShowStyleForm(false);
        alert("Style created successfully!");
      } else {
        alert(result.error || "Failed to create style");
      }
    } catch (error) {
      console.error("Error creating style:", error);
      alert("Failed to create style");
    }
  };

  // --- ORDER NUMBER CHECK ---

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
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    setFormData({ ...formData, orderNumber: cleaned });

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

  // --- VALIDATION & SUBMIT ---

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

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

      // Filter rows yang valid (size ada nama dan qty > 0)
      const validSizeBreakdown = sizeRows.filter(
        (row) => row.size.trim() !== "" && row.quantity > 0
      );

      const orderData = {
        orderNumber: formData.orderNumber.trim().toUpperCase(),
        buyerId: formData.buyerId,
        styleId: formData.styleId,
        orderDate: formData.orderDate,
        productionDeadline: formData.productionDeadline,
        deliveryDeadline: formData.deliveryDeadline,
        totalQuantity,
        sizeBreakdown: validSizeBreakdown,
        createdBy: formData.createdBy,
        notes: formData.notes,
        processTemplateId: isCustomizing
          ? "custom"
          : formData.processTemplateId,
        customProcessFlow: isCustomizing ? customProcessFlow : undefined,
        selectedMaterials,
        selectedAccessories,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
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
            <ArrowLeft className="w-6 h-6" />
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
                    Order number is available
                  </p>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Buyer Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pilih Buyer</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowBuyerForm(!showBuyerForm)}
              >
                {showBuyerForm ? "Cancel" : "+ New Buyer"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Existing Buyer Selection */}
              {!showBuyerForm && (
                <>
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
                      <p className="text-sm text-red-600 mt-1">
                        {errors.buyerId}
                      </p>
                    )}
                  </div>

                  {selectedBuyer && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-blue-900 font-medium">
                            Jenis Buyer
                          </p>
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
                </>
              )}

              {/* New Buyer Form */}
              {showBuyerForm && (
                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 space-y-4">
                  <h4 className="font-bold text-purple-900">
                    Create New Buyer
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Buyer Name *
                      </label>
                      <input
                        type="text"
                        value={newBuyer.name}
                        onChange={(e) =>
                          setNewBuyer({ ...newBuyer, name: e.target.value })
                        }
                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg"
                        placeholder="e.g., Nike Indonesia"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Buyer Code *
                      </label>
                      <input
                        type="text"
                        value={newBuyer.code}
                        onChange={(e) =>
                          setNewBuyer({ ...newBuyer, code: e.target.value })
                        }
                        className="w-full px-4 py-2 border text-gray-900 border-gray-300 rounded-lg"
                        placeholder="e.g., NIKE-001"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Buyer Type *
                    </label>
                    <select
                      value={newBuyer.type}
                      onChange={(e) =>
                        setNewBuyer({
                          ...newBuyer,
                          type: e.target.value as "repeat" | "one-time",
                        })
                      }
                      className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg"
                    >
                      <option value="repeat">Repeat Buyer</option>
                      <option value="one-time">One-Time Buyer</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        value={newBuyer.contactPerson}
                        onChange={(e) =>
                          setNewBuyer({
                            ...newBuyer,
                            contactPerson: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={newBuyer.phone}
                        onChange={(e) =>
                          setNewBuyer({ ...newBuyer, phone: e.target.value })
                        }
                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newBuyer.canReuse}
                        onChange={(e) =>
                          setNewBuyer({
                            ...newBuyer,
                            canReuse: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-900">
                        Material can be reused
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newBuyer.returRequired}
                        onChange={(e) =>
                          setNewBuyer({
                            ...newBuyer,
                            returRequired: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-900">
                        Return required
                      </span>
                    </label>
                  </div>

                  {newBuyer.canReuse && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Storage Location
                      </label>
                      <input
                        type="text"
                        value={newBuyer.storageLocation}
                        onChange={(e) =>
                          setNewBuyer({
                            ...newBuyer,
                            storageLocation: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g., Warehouse A, Rack 5"
                      />
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={handleCreateBuyer}
                    variant="primary"
                    className="w-full"
                  >
                    Create Buyer
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Style Selection - UPDATED */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pilih Style</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowStyleForm(!showStyleForm)}
              >
                {showStyleForm ? "Cancel" : "+ New Style"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Existing Style Selection */}
              {!showStyleForm && (
                <>
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
                      <p className="text-sm text-red-600 mt-1">
                        {errors.styleId}
                      </p>
                    )}
                  </div>

                  {selectedStyle && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-700 font-medium">
                            Kode Style
                          </p>
                          <p className="text-gray-900">
                            {selectedStyle.styleCode}
                          </p>
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
                </>
              )}

              {/* New Style Form */}
              {showStyleForm && (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 space-y-4">
                  <h4 className="font-bold text-green-900">Create New Style</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Style Code *
                      </label>
                      <input
                        type="text"
                        value={newStyle.styleCode}
                        onChange={(e) =>
                          setNewStyle({
                            ...newStyle,
                            styleCode: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg"
                        placeholder="e.g., ST-001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Style Name *
                      </label>
                      <input
                        type="text"
                        value={newStyle.name}
                        onChange={(e) =>
                          setNewStyle({ ...newStyle, name: e.target.value })
                        }
                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg"
                        placeholder="e.g., Polo Shirt Regular"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Category *
                    </label>
                    <select
                      value={newStyle.category}
                      onChange={(e) =>
                        setNewStyle({
                          ...newStyle,
                          category: e.target.value as
                            | "shirt"
                            | "pants"
                            | "jacket"
                            | "dress"
                            | "other",
                        })
                      }
                      className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg"
                    >
                      <option value="shirt">Shirt</option>
                      <option value="pants">Pants</option>
                      <option value="jacket">Jacket</option>
                      <option value="dress">Dress</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newStyle.description}
                      onChange={(e) =>
                        setNewStyle({
                          ...newStyle,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg"
                      rows={3}
                      placeholder="Style description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Est. Cutting Time (min)
                      </label>
                      <input
                        type="number"
                        value={newStyle.estimatedCuttingTime}
                        onChange={(e) =>
                          setNewStyle({
                            ...newStyle,
                            estimatedCuttingTime: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Est. Sewing Time (min/pc)
                      </label>
                      <input
                        type="number"
                        value={newStyle.estimatedSewingTime}
                        onChange={(e) =>
                          setNewStyle({
                            ...newStyle,
                            estimatedSewingTime: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg"
                        min="0"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleCreateStyle}
                    variant="primary"
                    className="w-full"
                  >
                    Create Style
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Process Template Selection */}
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
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      processTemplateId: e.target.value,
                    });
                    setIsCustomizing(false); // Reset customization when changing template
                  }}
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

              {selectedTemplate && customProcessFlow.length > 0 && (
                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-purple-900 flex items-center gap-2">
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
                      Process Flow Editor
                      {isCustomizing && (
                        <Badge variant="warning" size="sm">
                          Modified
                        </Badge>
                      )}
                    </h4>
                    <div className="flex gap-2">
                      {isCustomizing && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={resetToTemplate}
                        >
                          Reset to Template
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4 p-3 bg-white rounded-lg border border-purple-200">
                    <div>
                      <p className="text-purple-700 font-semibold">
                        Total Tahapan
                      </p>
                      <p className="text-2xl font-bold text-purple-900">
                        {customProcessFlow.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-purple-700 font-semibold">Est. Days</p>
                      <p className="text-2xl font-bold text-purple-900">
                        ~{selectedTemplate.estimatedDays}
                      </p>
                    </div>
                  </div>

                  {/* Process Flow List - EDITABLE */}
                  <div className="bg-white rounded-lg p-3 space-y-2 max-h-96 overflow-y-auto border-2 border-purple-200">
                    {customProcessFlow.map((process, idx) => (
                      <div
                        key={`${process}-${idx}`}
                        className="flex items-center gap-2 p-2 bg-purple-50 rounded border border-purple-200 hover:bg-purple-100 transition-colors"
                      >
                        {/* Move Buttons */}
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => moveProcessUp(idx)}
                            disabled={idx === 0}
                            className="text-purple-600 hover:text-purple-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveProcessDown(idx)}
                            disabled={idx === customProcessFlow.length - 1}
                            className="text-purple-600 hover:text-purple-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Step Number */}
                        <span className="font-bold text-sm text-purple-700 w-8">
                          {idx + 1}.
                        </span>

                        {/* Process Name */}
                        <span className="flex-1 text-sm font-semibold text-gray-800">
                          {PROCESS_LABELS[process]}
                        </span>

                        {/* Department Badge */}
                        <Badge variant="info" size="sm">
                          {PROCESS_DEPARTMENT_MAP[process]}
                        </Badge>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeProcessFromFlow(process)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded p-1"
                          title="Remove from flow"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Process Dropdown */}
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-purple-900 mb-2">
                      Add More Processes:
                    </label>
                    <select
                      onChange={(e) => {
                        console.log("Selected value:", e.target.value); // DEBUG: Cek apakah event trigger
                        if (e.target.value) {
                          addProcessToFlow(e.target.value as ProcessName);
                          e.target.value = "";
                        }
                      }}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 font-medium"
                      disabled={isSubmitting} // Tambahkan ini jika perlu, tapi default false
                    >
                      <option value="">-- Add Process --</option>
                      <optgroup label="📦 Production">
                        {PRODUCTION_PROCESSES.filter(
                          (p) => !customProcessFlow.includes(p)
                        ).map((process) => (
                          <option key={process} value={process}>
                            {PROCESS_LABELS[process]}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🚚 Delivery">
                        {DELIVERY_PROCESSES.filter(
                          (p) => !customProcessFlow.includes(p)
                        ).map((process) => (
                          <option key={process} value={process}>
                            {PROCESS_LABELS[process]}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    {PRODUCTION_PROCESSES.filter(
                      (p) => !customProcessFlow.includes(p)
                    ).length === 0 &&
                      DELIVERY_PROCESSES.filter(
                        (p) => !customProcessFlow.includes(p)
                      ).length === 0 && (
                        <p className="text-sm text-red-600 mt-2">
                          All processes already added. No more available.
                        </p>
                      )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* --- DYNAMIC SIZE BREAKDOWN (UPDATED) --- */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Size Breakdown</CardTitle>
            <div className="text-right">
              <span className="text-sm text-gray-500 mr-2">
                Total Quantity:
              </span>
              <span className="text-xl font-bold text-blue-600">
                {getTotalQuantity()} pcs
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Header Tabel */}
              <div className="grid grid-cols-12 gap-4 mb-2 font-medium text-gray-700 text-sm">
                <div className="col-span-5">Ukuran (Size)</div>
                <div className="col-span-5">Jumlah (Qty)</div>
                <div className="col-span-2 text-center">Aksi</div>
              </div>

              {/* Baris Input Dynamic */}
              {sizeRows.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 items-center"
                >
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={row.size}
                      onChange={(e) =>
                        handleSizeChange(index, "size", e.target.value)
                      }
                      placeholder="Contoh: XL, 32, All Size"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="col-span-5">
                    <input
                      type="number"
                      min="0"
                      value={row.quantity}
                      onChange={(e) =>
                        handleSizeChange(
                          index,
                          "quantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="col-span-2 text-center">
                    {sizeRows.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeSizeRow(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Hapus baris"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {errors.sizes && (
                <p className="text-sm text-red-600">{errors.sizes}</p>
              )}

              {/* Tombol Tambah Baris */}
              <Button
                type="button"
                variant="outline"
                onClick={addSizeRow}
                className="w-full mt-2 border-dashed border-2 hover:border-blue-500 hover:text-blue-600"
                disabled={isSubmitting}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Ukuran Lain
              </Button>
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
                  className="w-full px-4 py-2 text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className={`w-full px-4 py-2 text-gray-500 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                  className={`w-full px-4 py-2 text-gray-500 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                className={`w-full px-4 py-2 text-gray-600 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                className="w-full px-4 py-2 border text-gray-600 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
