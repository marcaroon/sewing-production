// src/app/layout.tsx

export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import RealtimeClock from "@/components/RealTimeClock";
import { AuthProvider } from "@/context/AuthContext";
import { headers } from "next/headers";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

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

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  const isFullscreenPage = pathname === "/monitoring";

  // Note: Variabel initialDate tidak digunakan di return, tapi saya biarkan sesuai instruksi "jangan dirubah"
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
    /* PERBAIKAN 1: Tambahkan suppressHydrationWarning di sini untuk hilangkan error */
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        {/* PERBAIKAN 2: Tambahkan props ini agar Dark Mode berfungsi dengan CSS globals.css Anda */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {showLayout && user && !isFullscreenPage ? (
              <div className="flex h-screen bg-background text-foreground">
                {/* Sidebar - Fixed width */}
                <div className="flex h-screen overflow-hidden bg-gray-50">
                  <Sidebar user={user} />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Header */}
                  <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-bold text-foreground">
                            Welcome back, {user.name}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            <RealtimeClock />
                          </p>
                        </div>
                      </div>
                      <ThemeToggle />
                    </div>
                  </header>

                  {/* Main Content with Padding */}
                  <main className="flex-1 overflow-y-auto p-6 bg-background">
                    <div className="max-w-7xl mx-auto">{children}</div>
                  </main>

                  {/* Footer - Minimalis */}
                  <footer className="bg-card border-t border-border py-3 px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        © 2025 Total Quality Indonesia
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Versi 1.0.0
                      </p>
                    </div>
                  </footer>
                </div>
              </div>
            ) : (
              // Unauthenticated - Landing/Login/Register pages
              <div className="min-h-screen bg-background text-foreground">
                {children}
              </div>
            )}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
