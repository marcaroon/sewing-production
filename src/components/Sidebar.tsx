// src/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  List,
  Monitor,
  QrCode,
  Plus,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User,
} from "lucide-react";

type SidebarProps = {
  user: {
    role: string;
    name: string;
    department: string;
  };
};

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/inventory/dashboard", label: "Inventory", icon: Warehouse },
  { href: "/waiting-list", label: "Waiting List", icon: List },
  { href: "/monitoring", label: "Monitoring", icon: Monitor },
  { href: "/qr/scanner", label: "Scanner", icon: QrCode },
];

export default function Sidebar({ user }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const canCreateOrder = ["admin", "ppic"].includes(user?.role || "");

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white shadow-lg text-gray-900 p-2.5 rounded-xl border border-gray-200"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay untuk mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:inset-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 rounded-xl p-2.5 shadow-lg">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Production</h1>
                <p className="text-xs text-gray-500 font-medium">
                  Management System
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                    isActive
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 ${
                        isActive
                          ? "text-blue-600"
                          : "text-gray-500 group-hover:text-gray-700"
                      }`}
                    />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {isActive}
                </Link>
              );
            })}

            {canCreateOrder && (
              <Link
                href="/orders/new"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition-all mt-4"
              >
                <Plus className="w-5 h-5" />
                <span>New Order</span>
              </Link>
            )}
          </nav>

          {/* User Section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50">
              <div className="bg-blue-100 rounded-full p-2">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.department}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
