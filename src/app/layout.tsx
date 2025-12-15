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
                    src="/dbg-logo.png"
                    alt="Logo"
                    width={50}
                    height={50}
                    className="object-fit"
                    priority
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

                <Link
                  href="/inventory/dashboard"
                  className="text-white hover:bg-blue-500 font-semibold transition-colors px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  Inventory
                </Link>

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
