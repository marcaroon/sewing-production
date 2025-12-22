// src/app/layout.tsx - IMPROVED VERSION

export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import RealtimeClock from "@/components/RealTimeClock";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Production Management System",
  description: "Sistem Manajemen Produksi Garment",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const showLayout = !!user;

  const initialDate = new Date().toLocaleString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <html lang="id">
      <body className={inter.className}>
        <AuthProvider>
          {showLayout && user ? (
            // Authenticated Layout with Sidebar
            <div className="flex h-screen overflow-hidden bg-gray-50">
              {/* Sidebar */}
              <Sidebar user={user} />

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header - Minimalis & Clean */}
                <header className="bg-white border-b border-gray-200 shadow-sm">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          Welcome back, {user.name}
                        </h2>
                        <p className="text-sm text-gray-500">
                          <RealtimeClock />
                        </p>
                      </div>
                    </div>
                  </div>
                </header>

                {/* Main Content with Padding */}
                <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
                  <div className="max-w-7xl mx-auto">{children}</div>
                </main>

                {/* Footer - Minimalis */}
                <footer className="bg-white border-t border-gray-200 py-3 px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      © 2025 Total Quality Indonesia
                    </p>
                    <p className="text-xs text-gray-400">Versi 1.0.0</p>
                  </div>
                </footer>
              </div>
            </div>
          ) : (
            // Unauthenticated - Landing/Login/Register pages
            <div className="min-h-screen">{children}</div>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}
