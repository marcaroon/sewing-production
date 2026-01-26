// src/components/InventoryImporter.tsx
"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { Button } from "./ui/Button";
import {
  Upload,
  Download,
  FileSpreadsheet,
  Loader2,
  ChevronDown,
  Plus,
  Package,
  ShoppingCart,
} from "lucide-react";
import { Modal } from "./ui/Modal";

export const InventoryImporter = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Logic Download Template (DIUPDATE) ---
  const handleDownloadTemplate = () => {
    const workbook = XLSX.utils.book_new();

    // 1. Template Materials - Tambahkan "Initial Stock"
    const materialHeaders = [
      "Material Code",
      "Name",
      "Category",
      "Unit",
      "Color",
      "Supplier",
      "Minimum Stock",
      "Reorder Point",
      "Price",
      "Initial Stock", // Kolom Baru
    ];
    // Contoh Data
    const materialData = [
      [
        "MT-001",
        "Cotton Combed 30s",
        "fabric",
        "kg",
        "Black",
        "PT Textile",
        100,
        50,
        85000,
        500,
      ],
    ];
    const materialSheet = XLSX.utils.aoa_to_sheet([
      materialHeaders,
      ...materialData,
    ]);
    XLSX.utils.book_append_sheet(workbook, materialSheet, "Materials");

    // 2. Template Accessories - Tambahkan "Initial Stock"
    const accessoryHeaders = [
      "Accessory Code",
      "Name",
      "Category",
      "Unit",
      "Color",
      "Size",
      "Supplier",
      "Minimum Stock",
      "Reorder Point",
      "Price",
      "Initial Stock", // Kolom Baru
    ];
    // Contoh Data
    const accessoryData = [
      [
        "ACC-001",
        "Button 14mm",
        "button",
        "gross",
        "White",
        "14mm",
        "PT Button",
        50,
        10,
        25000,
        100,
      ],
    ];
    const accessorySheet = XLSX.utils.aoa_to_sheet([
      accessoryHeaders,
      ...accessoryData,
    ]);
    XLSX.utils.book_append_sheet(workbook, accessorySheet, "Accessories");

    XLSX.writeFile(workbook, "Inventory_Import_Template.xlsx");
    setIsMenuOpen(false);
  };

  // ... (Sisa kode handleFileChange dan return sama persis seperti sebelumnya)
  // ... Pastikan bagian return di bawah ini tetap ada (saya tulis ulang singkatnya agar lengkap)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/inventory/import", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setUploadResult(data.message);
        setTimeout(() => {
          setIsModalOpen(false);
          window.location.reload();
        }, 2000);
      } else {
        setUploadResult(`Error: ${data.error}`);
      }
    } catch (error) {
      setUploadResult("Terjadi kesalahan saat upload.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <Button
          variant="primary"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Menu Import</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              isMenuOpen ? "rotate-180" : ""
            }`}
          />
        </Button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
            <div className="py-1">
              <Link
                href="/inventory/materials"
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                <Package className="w-4 h-4 text-blue-600" />
                Tambah Bahan
              </Link>

              <Link
                href="/inventory/accessories"
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCart className="w-4 h-4 text-green-600" />
                Tambah Aksesoris
              </Link>

              <button
                onClick={() => {
                  setIsModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Import Excel
              </button>

              <button
                onClick={handleDownloadTemplate}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                <Download className="w-4 h-4 text-orange-600" />
                Download Template
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Import Data Inventory"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
            <p className="font-semibold mb-2">Panduan Import:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Gunakan tombol <strong>Download Template</strong> di menu untuk
                format yang benar.
              </li>
              <li>
                Isi kolom <strong>Initial Stock</strong> untuk memasukkan saldo
                awal (otomatis tercatat di riwayat).
              </li>
              <li>
                Kode Barang (Code) harus unik. Jika kode sudah ada, data akan
                di-update.
              </li>
            </ul>
          </div>

          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-2" />
                <p className="text-gray-500">Sedang memproses data...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                <p className="font-medium text-gray-700">
                  Klik untuk upload file Excel
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Format: .xlsx atau .xls
                </p>
              </div>
            )}
          </div>

          {uploadResult && (
            <div
              className={`p-3 rounded-lg text-sm font-medium ${
                uploadResult.includes("Error")
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              {uploadResult}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
