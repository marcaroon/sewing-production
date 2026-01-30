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
  User,
  ChevronRight,
  UserPlus,
} from "lucide-react";

type SidebarProps = {
  user: {
    role: string;
    name: string;
    department: string;
    isAdmin?: boolean;
  };
};

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/inventory/dashboard", label: "Inventory", icon: Warehouse },
  { href: "/waiting-list", label: "Waiting List", icon: List },
  { href: "/monitoring", label: "Monitoring", icon: Monitor },
  { href: "/qr/scanner", label: "QR Scanner", icon: QrCode },
];

export default function Sidebar({ user }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const canCreateOrder = user.isAdmin || ["ppic"].includes(user?.role || "");

  const isAdmin = user?.isAdmin === true;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white shadow-lg text-gray-900 p-3 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:inset-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section - Professional */}
          <div className="px-6 py-6 border-b mx-4 mt-4 rounded-xl border-gray-200 bg-linear-to-r from-blue-600 to-blue-700">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-bold text-white">PCMS</h1>
                {/* <p className="text-xs text-blue-100 font-normal mt-1">
                  Production Control Management System
                </p> */}
              </div>
            </div>
          </div>

          {/* Navigation Menu - Professional */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isMonitoring = item.href === "/monitoring";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  target={isMonitoring ? "_blank" : undefined}
                  rel={isMonitoring ? "noopener noreferrer" : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-white" />}
                </Link>
              );
            })}

            {isAdmin && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Admin Area
                </p>
                <Link
                  href="/admin/users/create"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group ${
                    pathname === "/admin/users/create"
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Create User</span>
                  </div>
                </Link>
              </div>
            )}

            {/* Create Order Button - Professional */}
            {canCreateOrder && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <Link
                  href="/orders/new"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-linear-to-r from-green-600 to-green-700 text-white font-semibold shadow-lg shadow-green-200 hover:shadow-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create New Order</span>
                </Link>
              </div>
            )}
          </nav>

          {/* User Section - Professional */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white border border-gray-200 shadow-sm">
              <div className="bg-linear-to-br from-blue-600 to-blue-700 rounded-full p-2.5 shadow-md">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {user.name}
                </p>
                {!user.isAdmin && user.department && (
                  <p className="text-xs text-gray-600 truncate font-medium">
                    {user.department}
                  </p>
                )}
                {user.isAdmin && (
                  <p className="text-xs text-blue-600 truncate font-semibold">
                    Administrator
                  </p>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all"
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
