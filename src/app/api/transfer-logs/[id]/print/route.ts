// ========================================
// app/api/transfer-logs/[id]/print/route.ts
// Generate printable surat jalan
// ========================================

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const transferLog = await prisma.transferLog.findUnique({
      where: { id: (await params).id },
      include: {
        order: {
          include: {
            buyer: true,
            style: true,
          },
        },
        processStep: {
          include: {
            rejects: true,
          },
        },
      },
    });

    if (!transferLog) {
      return NextResponse.json(
        { success: false, error: "Transfer log not found" },
        { status: 404 }
      );
    }

    // Parse reject summary
    const rejects = transferLog.rejectSummary
      ? JSON.parse(transferLog.rejectSummary)
      : [];

    const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Surat Jalan - ${transferLog.transferNumber}</title>
    <style>
      @page { size: A4; margin: 20mm; }
      body {
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 1.6;
        color: #333;
      }
      .header {
        text-align: center;
        border-bottom: 3px solid #333;
        padding-bottom: 10px;
        margin-bottom: 20px;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
        text-transform: uppercase;
      }
      .header p {
        margin: 5px 0;
        font-size: 10px;
      }
      .info-section {
        margin-bottom: 20px;
      }
      .info-row {
        display: flex;
        margin-bottom: 8px;
      }
      .info-label {
        width: 150px;
        font-weight: bold;
      }
      .info-value {
        flex: 1;
      }
      .divider {
        border-top: 1px solid #ccc;
        margin: 20px 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #f5f5f5;
        font-weight: bold;
      }
      .quantity-box {
        background-color: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
        margin: 15px 0;
      }
      .quantity-item {
        display: flex;
        justify-content: space-between;
        margin: 5px 0;
        padding: 5px 0;
        border-bottom: 1px dotted #ddd;
      }
      .quantity-label {
        font-weight: bold;
      }
      .signature-section {
        display: flex;
        justify-content: space-between;
        margin-top: 50px;
      }
      .signature-box {
        width: 45%;
        text-align: center;
      }
      .signature-line {
        border-top: 1px solid #333;
        margin-top: 60px;
        padding-top: 5px;
      }
      .notes-box {
        background-color: #fff9e6;
        border: 1px solid #ffd700;
        padding: 10px;
        border-radius: 5px;
        margin: 15px 0;
      }
      .alert-box {
        background-color: #ffe6e6;
        border: 1px solid #ff4444;
        padding: 10px;
        border-radius: 5px;
        margin: 15px 0;
      }
      @media print {
        button { display: none; }
      }
    </style>
  </head>
  <body>
    <!-- Header -->
    <div class="header">
      <h1>Surat Jalan Produksi</h1>
      <p>No: ${transferLog.transferNumber}</p>
      <p>Tanggal: ${new Date(transferLog.transferDate).toLocaleString(
        "id-ID"
      )}</p>
    </div>
  
    <!-- Order Information -->
    <div class="info-section">
      <h3>Informasi Order</h3>
      <div class="info-row">
        <div class="info-label">No. Order:</div>
        <div class="info-value">${transferLog.order.orderNumber}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Buyer:</div>
        <div class="info-value">${transferLog.order.buyer.name}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Style:</div>
        <div class="info-value">${transferLog.order.style.name}</div>
      </div>
    </div>
  
    <div class="divider"></div>
  
    <!-- Transfer Information -->
    <div class="info-section">
      <h3>Detail Transfer</h3>
      <div class="info-row">
        <div class="info-label">Dari Proses:</div>
        <div class="info-value">${transferLog.fromProcess} (${
      transferLog.fromDepartment
    })</div>
      </div>
      <div class="info-row">
        <div class="info-label">Ke Proses:</div>
        <div class="info-value">${transferLog.toProcess} (${
      transferLog.toDepartment
    })</div>
      </div>
      <div class="info-row">
        <div class="info-label">Diserahkan oleh:</div>
        <div class="info-value">${transferLog.handedOverBy}</div>
      </div>
      ${
        transferLog.receivedBy
          ? `
      <div class="info-row">
        <div class="info-label">Diterima oleh:</div>
        <div class="info-value">${transferLog.receivedBy}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Tanggal Terima:</div>
        <div class="info-value">${new Date(
          transferLog.receivedDate!
        ).toLocaleString("id-ID")}</div>
      </div>
      `
          : ""
      }
    </div>
  
    <div class="divider"></div>
  
    <!-- Quantity Summary -->
    <div class="quantity-box">
      <h3 style="margin-top: 0;">Ringkasan Kuantitas</h3>
      <div class="quantity-item">
        <span class="quantity-label">Jumlah Ditransfer:</span>
        <span>${transferLog.quantityTransferred} pcs</span>
      </div>
      <div class="quantity-item">
        <span class="quantity-label">Completed:</span>
        <span>${transferLog.quantityCompleted} pcs</span>
      </div>
      ${
        transferLog.quantityRejected > 0
          ? `
      <div class="quantity-item" style="color: #d32f2f;">
        <span class="quantity-label">Rejected:</span>
        <span>${transferLog.quantityRejected} pcs</span>
      </div>
      `
          : ""
      }
      ${
        transferLog.quantityRework > 0
          ? `
      <div class="quantity-item" style="color: #ff9800;">
        <span class="quantity-label">Rework:</span>
        <span>${transferLog.quantityRework} pcs</span>
      </div>
      `
          : ""
      }
    </div>
  
    <!-- Reject Details -->
    ${
      rejects.length > 0
        ? `
    <div class="alert-box">
      <h3 style="margin-top: 0; color: #d32f2f;">Detail Reject/Rework</h3>
      <table>
        <thead>
          <tr>
            <th>Jenis</th>
            <th>Kategori</th>
            <th>Qty</th>
            <th>Keterangan</th>
            <th>Tindakan</th>
          </tr>
        </thead>
        <tbody>
          ${rejects
            .map(
              (r: any) => `
          <tr>
            <td>${r.type}</td>
            <td>${r.category}</td>
            <td>${r.quantity}</td>
            <td>${r.description}</td>
            <td>${r.action}</td>
          </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
    `
        : ""
    }
  
    <!-- Duration Info -->
    ${
      transferLog.processingDuration || transferLog.waitingDuration
        ? `
    <div class="info-section">
      <h3>Informasi Durasi</h3>
      ${
        transferLog.processingDuration
          ? `
      <div class="info-row">
        <div class="info-label">Waktu Proses:</div>
        <div class="info-value">${transferLog.processingDuration} menit</div>
      </div>
      `
          : ""
      }
      ${
        transferLog.waitingDuration
          ? `
      <div class="info-row">
        <div class="info-label">Waktu Tunggu:</div>
        <div class="info-value">${transferLog.waitingDuration} menit</div>
      </div>
      `
          : ""
      }
    </div>
    `
        : ""
    }
  
    <!-- Notes -->
    ${
      transferLog.notes
        ? `
    <div class="notes-box">
      <strong>Catatan:</strong><br>
      ${transferLog.notes}
    </div>
    `
        : ""
    }
  
    ${
      transferLog.issues
        ? `
    <div class="alert-box">
      <strong>⚠ Masalah/Issues:</strong><br>
      ${transferLog.issues}
    </div>
    `
        : ""
    }
  
    <!-- Signatures -->
    <div class="signature-section">
      <div class="signature-box">
        <p><strong>Yang Menyerahkan</strong></p>
        <div class="signature-line">
          ${transferLog.handedOverBy}
        </div>
        <p style="font-size: 10px; margin-top: 5px;">${
          transferLog.fromDepartment
        }</p>
      </div>
      <div class="signature-box">
        <p><strong>Yang Menerima</strong></p>
        <div class="signature-line">
          ${transferLog.receivedBy || "___________________"}
        </div>
        <p style="font-size: 10px; margin-top: 5px;">${
          transferLog.toDepartment
        }</p>
      </div>
    </div>
  
    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; font-size: 10px; color: #666;">
      <p>Dokumen ini dicetak otomatis dari sistem pada ${new Date().toLocaleString(
        "id-ID"
      )}</p>
      <p style="margin-top: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">
          🖨️ Print Dokumen
        </button>
      </p>
    </div>
  </body>
  </html>
      `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="surat-jalan-${transferLog.transferNumber}.html"`,
      },
    });
  } catch (error) {
    console.error("Error generating print:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate print" },
      { status: 500 }
    );
  }
}
