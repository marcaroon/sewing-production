// app/layout.tsx - IMPROVED VERSION

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Package, FileText, Clock, Plus } from "lucide-react";

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
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 border-b-4 border-blue-800 sticky top-0 z-40 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link
                href="/"
                className="flex items-center gap-3 hover:opacity-90 transition-opacity"
              >
                <div className="bg-white rounded-lg p-2 shadow-md">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white"> Garment Production</h1>
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
                  <Package className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  href="/orders"
                  className="text-white hover:bg-blue-500 font-semibold transition-colors px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Orders
                </Link>
                <Link
                  href="/waiting-list"
                  className="text-white hover:bg-blue-500 font-semibold transition-colors px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Waiting List
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
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t-2 border-gray-300 mt-auto shadow-inner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                © 2024 Garment Production System
              </p>
              <p className="text-xs font-medium text-gray-600">
                Prototype for Client Demo
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
