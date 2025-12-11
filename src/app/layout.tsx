// src/app/layout.tsx - IMPROVED with Inventory Menu

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Plus } from "lucide-react";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Production Management System",
  description: "Sistem Manajemen Produksi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {/* Header */}
        <header className="bg-linear-to-r from-blue-600 to-blue-700 border-b-4 border-blue-800 sticky top-0 z-40 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link
                href="/"
                className="flex items-center gap-3 hover:opacity-90 transition-opacity"
              >
                <div className="bg-white rounded-full flex justify-center p-2 w-15 h-15 shadow-md">
                  <Image
                    src="/dbg-logo.png" // ganti sesuai path yang kamu mau
                    alt="Logo"
                    width={50} // bebas, nanti tinggal sesuaikan
                    height={50}
                    className="object-fit"
                    priority // biar cepat muncul di header
                  />
                </div>

                <div>
                  <h1 className="text-xl font-bold text-white">Production</h1>
                  <p className="text-xs text-blue-100 font-medium">
                    Management System
                  </p>
                </div>
              </Link>
              <nav className="flex items-center gap-2">
                <Link
                  href="/"
                  className="text-white hover:bg-blue-500 font-semibold transition-colors px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  Dashboard
                </Link>
                <Link
                  href="/orders"
                  className="text-white hover:bg-blue-500 font-semibold transition-colors px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  Orders
                </Link>

                {/* NEW: Inventory Dropdown */}
                <div className="relative group">
                  <button className="text-white hover:bg-blue-500 font-semibold transition-colors px-4 py-2 rounded-lg flex items-center gap-2">
                    Inventory
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
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border-2 border-blue-200 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link
                      href="/inventory/materials"
                      className="block px-4 py-3 text-gray-900 hover:bg-blue-50 font-semibold text-sm border-b border-gray-200"
                    >
                      Materials
                    </Link>
                    <Link
                      href="/inventory/accessories"
                      className="block px-4 py-3 text-gray-900 hover:bg-blue-50 font-semibold text-sm border-b border-gray-200"
                    >
                      Accessories
                    </Link>
                    <Link
                      href="/inventory/transactions"
                      className="block px-4 py-3 text-gray-900 hover:bg-blue-50 font-semibold text-sm border-b border-gray-200"
                    >
                      Transactions
                    </Link>
                    <Link
                      href="/inventory/dashboard"
                      className="block px-4 py-3 text-gray-900 hover:bg-blue-50 font-semibold text-sm"
                    >
                      Inventory Dashboard
                    </Link>
                  </div>
                </div>

                <Link
                  href="/waiting-list"
                  className="text-white hover:bg-blue-500 font-semibold transition-colors px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  Waiting List
                </Link>
                <Link
                  href="/monitoring"
                  className="text-white hover:bg-blue-500 font-semibold transition-colors px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  Monitoring
                </Link>
                <Link
                  href="/orders/new"
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors font-bold shadow-md ml-2 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Order
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t-2 border-gray-300 mt-auto shadow-inner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-center">
              <p className="text-sm font-semibold text-gray-700">
                © 2025 Total Quality Indonesia. All rights reserved
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
