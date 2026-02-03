// src/app/orders/new/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Buyer, Style, ProcessName, SewingLine } from "@/lib/types-new";
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
  const [showLineForm, setShowLineForm] = useState(false);

  const [sewingLines, setSewingLines] = useState<any[]>([]);
  const [selectedLine, setSelectedLine] = useState<string>("");

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

  const [newLine, setNewLine] = useState({
    lineName: "",
    capacity: 0,
    department: "sewing" as "cutting" | "sewing" | "finishing",
    status: "active" as "active" | "inactive",
  });

  const [formData, setFormData] = useState({
    orderNumber: "",
    buyerId: "",
    styleId: "",
    article: "",
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
      notes?: string;
    }>
  >([]);

  const [selectedAccessories, setSelectedAccessories] = useState<
    Array<{
      accessoryId: string;
      quantityRequired: number;
      notes?: string;
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

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [buyersRes, stylesRes, linesRes] = await Promise.all([
          apiClient.getBuyers(),
          apiClient.getStyles(),
          // Asumsi Anda punya endpoint ini, jika belum bisa pakai fetch manual
          fetch("/api/sewing-lines").then((res) => res.json()),
        ]);

        if (buyersRes) setBuyers(buyersRes);
        if (stylesRes) setStyles(stylesRes);

        // Handle response sewing lines
        if (linesRes.success) {
          // Filter hanya line yang aktif jika perlu
          setSewingLines(
            linesRes.data.filter((l: any) => l.status === "active")
          );
        }
      } catch (error) {
        console.error("Error fetching master data:", error);
      }
    };

    fetchMasterData();
  }, []);

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
        setBuyers([...buyers, result.data]);
        setFormData({ ...formData, buyerId: result.data.id });
        setShowBuyerForm(false);
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
        setStyles([...styles, result.data]);
        setFormData({ ...formData, styleId: result.data.id });
        setShowStyleForm(false);
        setNewStyle({
          styleCode: "",
          name: "",
          category: "shirt",
          description: "",
          estimatedCuttingTime: 0,
          estimatedSewingTime: 0,
        });
      } else {
        alert(result.error || "Failed to create style");
      }
    } catch (error) {
      console.error("Error creating style:", error);
      alert("Failed to create style");
    }
  };

  const handleCreateLine = async () => {
    try {
      const response = await fetch("/api/sewing-lines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLine),
      });
      const result = await response.json();

      if (result.success) {
        setSewingLines([...sewingLines, result.data]);
        setSelectedLine(result.data.lineName);
        setShowLineForm(false);
        setNewLine({
          lineName: "",
          capacity: 0,
          department: "sewing",
          status: "active",
        });
      } else {
        alert(result.error || "Failed to create line");
      }
    } catch (error) {
      console.error("Error creating line:", error);
      alert("Failed to create line");
    }
  };

  // --- VALIDATION & SUBMIT ---

  const selectedBuyer = buyers.find((b) => b.id === formData.buyerId);
  const selectedStyle = styles.find((s) => s.id === formData.styleId);

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

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.orderNumber.trim())
      newErrors.orderNumber = "Order number is required";
    if (!formData.buyerId) newErrors.buyerId = "Please select a buyer";
    if (!formData.styleId) newErrors.styleId = "Please select a style";
    if (!formData.productionDeadline)
      newErrors.productionDeadline = "Production deadline is required";
    if (!formData.deliveryDeadline)
      newErrors.deliveryDeadline = "Delivery deadline is required";
    if (!formData.createdBy.trim())
      newErrors.createdBy = "Created by is required";
    if (!formData.processTemplateId)
      newErrors.processTemplateId = "Please select a process template";

    if (sizeRows.length === 0 || sizeRows.every((row) => !row.size.trim())) {
      newErrors.sizes = "Please add at least one size";
    }

    if (getTotalQuantity() === 0) {
      newErrors.sizes = "Total quantity must be greater than 0";
    }

    if (
      formData.productionDeadline &&
      formData.deliveryDeadline &&
      new Date(formData.productionDeadline) >
        new Date(formData.deliveryDeadline)
    ) {
      newErrors.productionDeadline =
        "Production deadline must be before delivery deadline";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.orderNumber.trim()) {
      newErrors.orderNumber = "Order number is required";
    } else if (formData.orderNumber.trim().length < 3) {
      newErrors.orderNumber = "Order number must be at least 3 characters";
    }

    if (!formData.buyerId) newErrors.buyerId = "Please select a buyer";
    if (!formData.styleId) newErrors.styleId = "Please select a style";
    if (!formData.article) newErrors.article = "Order article is required";
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
        article: formData.article,
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
        assignedLine: selectedLine,
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
            className="text-muted-foreground hover:text-foreground"
            disabled={isSubmitting}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Buat Order Baru
            </h1>
            <p className="text-muted-foreground mt-1">
              Buat order produksi baru
            </p>
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
              <label className="block text-sm font-medium text-foreground mb-2">
                Nomor Order *
              </label>
              <input
                type="text"
                value={formData.orderNumber}
                onChange={(e) => handleOrderNumberChange(e.target.value)}
                onBlur={handleOrderNumberBlur}
                className={`w-full px-4 py-2 text-muted-foreground border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg ${
                  errors.orderNumber ? "border-destructive" : "border-border"
                }`}
                placeholder="e.g., ORD-2025-00001 or ANY-FORMAT-YOU-WANT"
                disabled={isSubmitting}
                maxLength={50}
              />

              {errors.orderNumber && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
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

        <Card>
          <CardHeader>
            <CardTitle>Article</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Article Name
              </label>
              <input
                type="text"
                value={formData.article}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    article: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 text-muted-foreground border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Spring 2025, Summer Collection, Article A"
                disabled={isSubmitting}
                maxLength={100}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Optional: Specify article name or collection for this order
              </p>
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
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Buyer *
                    </label>
                    <select
                      value={formData.buyerId}
                      onChange={(e) =>
                        setFormData({ ...formData, buyerId: e.target.value })
                      }
                      className={`w-full px-4 py-2 text-muted-foreground border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.buyerId ? "border-destructive" : "border-border"
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
                      <p className="text-sm text-destructive mt-1">
                        {errors.buyerId}
                      </p>
                    )}
                  </div>

                  {selectedBuyer && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-blue-600 font-medium">
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
                          <p className="text-blue-600 font-medium">
                            Aturan Pengembalian
                          </p>
                          <p className="text-blue-600 text-sm">
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
                <div className="bg-purple-500/10 border-2 border-purple-500/40 rounded-lg p-4 space-y-4">
                  <h4 className="font-bold text-purple-600">
                    Create New Buyer
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Buyer Name *
                      </label>
                      <input
                        type="text"
                        value={newBuyer.name}
                        onChange={(e) =>
                          setNewBuyer({ ...newBuyer, name: e.target.value })
                        }
                        className="w-full px-4 py-2 text-foreground border border-border rounded-lg"
                        placeholder="e.g., Nike Indonesia"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Buyer Code *
                      </label>
                      <input
                        type="text"
                        value={newBuyer.code}
                        onChange={(e) =>
                          setNewBuyer({ ...newBuyer, code: e.target.value })
                        }
                        className="w-full px-4 py-2 text-foreground border border-border rounded-lg"
                        placeholder="e.g., NIKE-ID"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
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
                      className="w-full px-4 py-2 text-foreground border border-border rounded-lg"
                    >
                      <option value="repeat">Repeat</option>
                      <option value="one-time">One-Time</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
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
                        className="w-full px-4 py-2 text-foreground border border-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={newBuyer.phone}
                        onChange={(e) =>
                          setNewBuyer({ ...newBuyer, phone: e.target.value })
                        }
                        className="w-full px-4 py-2 text-foreground border border-border rounded-lg"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleCreateBuyer}
                    className="w-full"
                  >
                    Create Buyer
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Style Selection */}
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
              {!showStyleForm && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Style *
                    </label>
                    <select
                      value={formData.styleId}
                      onChange={(e) =>
                        setFormData({ ...formData, styleId: e.target.value })
                      }
                      className={`w-full px-4 py-2 text-muted-foreground border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.styleId ? "border-destructive" : "border-border"
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
                      <p className="text-sm text-destructive mt-1">
                        {errors.styleId}
                      </p>
                    )}
                  </div>

                  {selectedStyle && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-green-600 font-medium">Category</p>
                          <Badge variant="success">
                            {selectedStyle.category}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-green-600 font-medium">
                            Est. Time
                          </p>
                          <p className="text-green-600">
                            Cutting: {selectedStyle.estimatedCuttingTime}h |
                            Sewing: {selectedStyle.estimatedSewingTime}h
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {showStyleForm && (
                <div className="bg-purple-500/10 border-2 border-purple-500/40 rounded-lg p-4 space-y-4">
                  <h4 className="font-bold text-purple-600">
                    Create New Style
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
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
                        className="w-full px-4 py-2 text-foreground border border-border rounded-lg"
                        placeholder="e.g., SH-2025-001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Style Name *
                      </label>
                      <input
                        type="text"
                        value={newStyle.name}
                        onChange={(e) =>
                          setNewStyle({ ...newStyle, name: e.target.value })
                        }
                        className="w-full px-4 py-2 text-foreground border border-border rounded-lg"
                        placeholder="e.g., Classic Blue Shirt"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
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
                      className="w-full px-4 py-2 text-foreground border border-border rounded-lg"
                    >
                      <option value="shirt">Shirt</option>
                      <option value="pants">Pants</option>
                      <option value="jacket">Jacket</option>
                      <option value="dress">Dress</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
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
                      className="w-full px-4 py-2 text-foreground border border-border rounded-lg"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Est. Cutting Time (hours)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newStyle.estimatedCuttingTime}
                        onChange={(e) =>
                          setNewStyle({
                            ...newStyle,
                            estimatedCuttingTime:
                              parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 text-foreground border border-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Est. Sewing Time (hours)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newStyle.estimatedSewingTime}
                        onChange={(e) =>
                          setNewStyle({
                            ...newStyle,
                            estimatedSewingTime:
                              parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 text-foreground border border-border rounded-lg"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleCreateStyle}
                    className="w-full"
                  >
                    Create Style
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assigned Line Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Assigned Line (Opsional)</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowLineForm(!showLineForm)}
              >
                {showLineForm ? "Cancel" : "+ New Line"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!showLineForm && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Sewing Line
                    </label>
                    <select
                      value={selectedLine}
                      onChange={(e) => setSelectedLine(e.target.value)}
                      className="w-full px-4 py-2 text-muted-foreground border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSubmitting}
                    >
                      <option value="">-- Pilih Line --</option>
                      {sewingLines.map((line) => (
                        <option key={line.id} value={line.lineName}>
                          {line.lineName} (Kapasitas: {line.capacity})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Line produksi yang akan mengerjakan order ini.
                    </p>
                  </div>

                  {selectedLine && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-orange-600 font-medium">
                            Line Terpilih
                          </p>
                          <Badge variant="warning">{selectedLine}</Badge>
                        </div>
                        <div>
                          <p className="text-orange-600 font-medium">
                            Kapasitas
                          </p>
                          <p className="text-orange-600">
                            {
                              sewingLines.find(
                                (l) => l.lineName === selectedLine
                              )?.capacity
                            }{" "}
                            pcs/hari
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {showLineForm && (
                <div className="bg-purple-500/10 border-2 border-purple-500/40 rounded-lg p-4 space-y-4">
                  <h4 className="font-bold text-purple-600">Create New Line</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Line Name *
                      </label>
                      <input
                        type="text"
                        value={newLine.lineName}
                        onChange={(e) =>
                          setNewLine({ ...newLine, lineName: e.target.value })
                        }
                        className="w-full px-4 py-2 text-foreground border border-border rounded-lg"
                        placeholder="e.g., Line A, Line 1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Capacity (pcs/day) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newLine.capacity}
                        onChange={(e) =>
                          setNewLine({
                            ...newLine,
                            capacity: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 text-foreground border border-border rounded-lg"
                        placeholder="e.g., 500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Department *
                      </label>
                      <select
                        value={newLine.department}
                        onChange={(e) =>
                          setNewLine({
                            ...newLine,
                            department: e.target.value as
                              | "cutting"
                              | "sewing"
                              | "finishing",
                          })
                        }
                        className="w-full px-4 py-2 text-foreground border border-border rounded-lg"
                      >
                        <option value="cutting">Cutting</option>
                        <option value="sewing">Sewing</option>
                        <option value="finishing">Finishing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Status *
                      </label>
                      <select
                        value={newLine.status}
                        onChange={(e) =>
                          setNewLine({
                            ...newLine,
                            status: e.target.value as "active" | "inactive",
                          })
                        }
                        className="w-full px-4 py-2 text-foreground border border-border rounded-lg"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleCreateLine}
                    className="w-full"
                  >
                    Create Line
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
                <label className="block text-sm font-medium text-foreground mb-2">
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
                  className={`w-full px-4 py-2 text-muted-foreground border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.processTemplateId
                      ? "border-destructive"
                      : "border-border"
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
                  <p className="text-sm text-destructive mt-1">
                    {errors.processTemplateId}
                  </p>
                )}
              </div>

              {selectedTemplate && customProcessFlow.length > 0 && (
                <div className="bg-purple-500/10 border-2 border-purple-500/40 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-purple-600 flex items-center gap-2">
                      {selectedTemplate.name}
                      {isCustomizing && (
                        <Badge variant="warning" className="text-xs">
                          Customized
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
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4 p-3 bg-card rounded-lg border border-purple-500/30">
                    <div>
                      <p className="text-purple-600 font-semibold">
                        Total Tahapan
                      </p>
                      <p className="text-2xl font-bold text-purple-600">
                        {customProcessFlow.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-purple-600 font-semibold">Est. Days</p>
                      <p className="text-2xl font-bold text-purple-600">
                        ~{selectedTemplate.estimatedDays}
                      </p>
                    </div>
                  </div>

                  {/* Process Flow List - EDITABLE */}
                  <div className="bg-card rounded-lg p-3 space-y-2 max-h-96 overflow-y-auto border-2 border-purple-500/30">
                    {customProcessFlow.map((process, idx) => (
                      <div
                        key={`${process}-${idx}`}
                        className="flex items-center gap-2 p-2 bg-purple-500/10 rounded border border-purple-500/30 hover:bg-purple-500/15 transition-colors"
                      >
                        {/* Move Buttons */}
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => moveProcessUp(idx)}
                            disabled={idx === 0}
                            className="text-purple-600 hover:text-purple-600 disabled:text-muted-foreground disabled:cursor-not-allowed"
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
                            className="text-purple-600 hover:text-purple-600 disabled:text-muted-foreground disabled:cursor-not-allowed"
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

                        {/* Process Info */}
                        <div className="flex-1 flex items-center gap-2">
                          <span className="font-mono text-sm text-purple-600 font-bold">
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-purple-600">
                              {PROCESS_LABELS[process]}
                            </p>
                            <p className="text-xs text-purple-600">
                              {PROCESS_DEPARTMENT_MAP[process]}
                            </p>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeProcessFromFlow(process)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded p-1"
                          title="Remove process"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add More Processes */}
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-purple-600 mb-2">
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
                      className="w-full px-4 py-2 border-2 border-purple-500/40 rounded-lg focus:ring-2 focus:ring-purple-500 text-foreground font-medium"
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
                        <p className="text-sm text-destructive mt-2">
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
              <span className="text-sm text-muted-foreground mr-2">
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
              <div className="grid grid-cols-12 gap-4 mb-2 font-medium text-foreground text-sm">
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
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 text-foreground"
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
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 text-foreground"
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
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                <p className="text-sm text-destructive">{errors.sizes}</p>
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
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tanggal Order *
                </label>
                <input
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) =>
                    setFormData({ ...formData, orderDate: e.target.value })
                  }
                  className="w-full px-4 py-2 text-muted-foreground border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
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
                  className={`w-full px-4 py-2 text-muted-foreground border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.productionDeadline
                      ? "border-destructive"
                      : "border-border"
                  }`}
                  disabled={isSubmitting}
                />
                {errors.productionDeadline && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.productionDeadline}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
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
                  className={`w-full px-4 py-2 text-muted-foreground border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.deliveryDeadline
                      ? "border-destructive"
                      : "border-border"
                  }`}
                  disabled={isSubmitting}
                />
                {errors.deliveryDeadline && (
                  <p className="text-sm text-destructive mt-1">
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
              <label className="block text-sm font-medium text-foreground mb-2">
                Dibuat oleh *
              </label>
              <input
                type="text"
                value={formData.createdBy}
                onChange={(e) =>
                  setFormData({ ...formData, createdBy: e.target.value })
                }
                className={`w-full px-4 py-2 text-muted-foreground border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.createdBy ? "border-destructive" : "border-border"
                }`}
                placeholder="Your name"
                disabled={isSubmitting}
              />
              {errors.createdBy && (
                <p className="text-sm text-destructive mt-1">
                  {errors.createdBy}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Catatan (Opsional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border text-muted-foreground border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
