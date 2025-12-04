import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Garment Production System",
  description: "Sistem Manajemen Produksi Garment - Prototype",
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
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  Garment Production System
                </h1>
              </div>
              <nav className="flex items-center gap-6">
                <a
                  href="/"
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Dashboard
                </a>
                <a
                  href="/orders"
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Orders
                </a>
                <a
                  href="/waiting-list"
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Waiting List
                </a>
                <a
                  href="/orders/new"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + New Order
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="min-h-screen bg-gray-50">{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-gray-600">
              © 2024 Garment Production System - Prototype for Client Demo
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
