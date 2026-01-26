// src/app/api/inventory/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

// 1. Update Interface untuk memasukkan "Initial Stock"
interface MaterialImportRow {
  "Material Code": string;
  Name: string;
  Category: string;
  Unit: string;
  Color?: string;
  Supplier?: string;
  "Minimum Stock"?: number;
  "Reorder Point"?: number;
  Price?: number;
  "Initial Stock"?: number; // Field Baru
}

interface AccessoryImportRow {
  "Accessory Code": string;
  Name: string;
  Category: string;
  Unit: string;
  Color?: string;
  Size?: string;
  Supplier?: string;
  "Minimum Stock"?: number;
  "Reorder Point"?: number;
  Price?: number;
  "Initial Stock"?: number; // Field Baru
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);

    const results = {
      materials: { success: 0, failed: 0 },
      accessories: { success: 0, failed: 0 },
    };

    // --- PROSES MATERIALS ---
    const materialSheet = workbook.Sheets["Materials"];
    if (materialSheet) {
      const rawData =
        XLSX.utils.sheet_to_json<MaterialImportRow>(materialSheet);

      for (const row of rawData) {
        try {
          if (
            !row["Material Code"] ||
            !row["Name"] ||
            !row["Category"] ||
            !row["Unit"]
          ) {
            results.materials.failed++;
            continue;
          }

          // 1. Upsert Master Data
          const material = await prisma.material.upsert({
            where: { materialCode: String(row["Material Code"]) },
            update: {
              name: String(row["Name"]),
              category: String(row["Category"]),
              unit: String(row["Unit"]),
              color: row["Color"] ? String(row["Color"]) : null,
              supplier: row["Supplier"] ? String(row["Supplier"]) : null,
              minimumStock: Number(row["Minimum Stock"] || 0),
              reorderPoint: Number(row["Reorder Point"] || 0),
              unitPrice: row["Price"] ? Number(row["Price"]) : null,
            },
            create: {
              materialCode: String(row["Material Code"]),
              name: String(row["Name"]),
              category: String(row["Category"]),
              unit: String(row["Unit"]),
              color: row["Color"] ? String(row["Color"]) : null,
              supplier: row["Supplier"] ? String(row["Supplier"]) : null,
              minimumStock: Number(row["Minimum Stock"] || 0),
              reorderPoint: Number(row["Reorder Point"] || 0),
              unitPrice: row["Price"] ? Number(row["Price"]) : null,
            },
          });

          // 2. Handle Initial Stock (Jika ada value > 0)
          const initialStock = Number(row["Initial Stock"] || 0);
          if (initialStock > 0) {
            // Cek apakah sudah ada transaksi initial untuk item ini agar tidak double (Optional, tapi disarankan)
            // Disini kita langsung insert saja sebagai adjustment/in
            await prisma.materialStockTransaction.create({
              data: {
                materialId: material.id,
                transactionType: "adjustment", // Menggunakan adjustment untuk saldo awal
                quantity: initialStock,
                unit: material.unit,
                referenceType: "import",
                remarks: "Initial Stock from Excel Import",
                performedBy: "System Import",
              },
            });
          }

          results.materials.success++;
        } catch (error) {
          console.error("Error importing material:", error);
          results.materials.failed++;
        }
      }
    }

    // --- PROSES ACCESSORIES ---
    const accessorySheet = workbook.Sheets["Accessories"];
    if (accessorySheet) {
      const rawData =
        XLSX.utils.sheet_to_json<AccessoryImportRow>(accessorySheet);

      for (const row of rawData) {
        try {
          if (
            !row["Accessory Code"] ||
            !row["Name"] ||
            !row["Category"] ||
            !row["Unit"]
          ) {
            results.accessories.failed++;
            continue;
          }

          // 1. Upsert Master Data
          const accessory = await prisma.accessory.upsert({
            where: { accessoryCode: String(row["Accessory Code"]) },
            update: {
              name: String(row["Name"]),
              category: String(row["Category"]),
              unit: String(row["Unit"]),
              color: row["Color"] ? String(row["Color"]) : null,
              size: row["Size"] ? String(row["Size"]) : null,
              supplier: row["Supplier"] ? String(row["Supplier"]) : null,
              minimumStock: Number(row["Minimum Stock"] || 0),
              reorderPoint: Number(row["Reorder Point"] || 0),
              unitPrice: row["Price"] ? Number(row["Price"]) : null,
            },
            create: {
              accessoryCode: String(row["Accessory Code"]),
              name: String(row["Name"]),
              category: String(row["Category"]),
              unit: String(row["Unit"]),
              color: row["Color"] ? String(row["Color"]) : null,
              size: row["Size"] ? String(row["Size"]) : null,
              supplier: row["Supplier"] ? String(row["Supplier"]) : null,
              minimumStock: Number(row["Minimum Stock"] || 0),
              reorderPoint: Number(row["Reorder Point"] || 0),
              unitPrice: row["Price"] ? Number(row["Price"]) : null,
            },
          });

          // 2. Handle Initial Stock
          const initialStock = Number(row["Initial Stock"] || 0);
          if (initialStock > 0) {
            await prisma.accessoryStockTransaction.create({
              data: {
                accessoryId: accessory.id,
                transactionType: "adjustment",
                quantity: initialStock,
                unit: accessory.unit,
                referenceType: "import",
                remarks: "Initial Stock from Excel Import",
                performedBy: "System Import",
              },
            });
          }

          results.accessories.success++;
        } catch (error) {
          console.error("Error importing accessory:", error);
          results.accessories.failed++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import selesai. Materials: ${results.materials.success} OK, ${results.materials.failed} Gagal. Accessories: ${results.accessories.success} OK, ${results.accessories.failed} Gagal.`,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process file" },
      { status: 500 }
    );
  }
}
