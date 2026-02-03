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
import { User } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PCMS | DMOS",
  description: "Production Control Management System",
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

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <AuthProvider>
            {showLayout && user && !isFullscreenPage ? (
              <div className="flex h-screen bg-background text-foreground overflow-hidden">
                {/* Sidebar - Fixed width */}
                <Sidebar user={user} />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Header - Professional */}
                  <header className="h-16 border-b border-border bg-card/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="hidden md:flex bg-linear-to-br from-blue-600 to-blue-700 rounded-lg p-2">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-lg font-bold text-foreground">
                              Welcome back, {user.name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              <RealtimeClock />
                            </p>
                          </div>
                        </div>
                      </div>
                      <ThemeToggle />
                    </div>
                  </header>

                  {/* Main Content with Padding */}
                  <main className="flex-1 overflow-y-auto bg-background">
                    <div className="max-w-7xl mx-auto p-6">{children}</div>
                  </main>

                  {/* Footer - Professional */}
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
