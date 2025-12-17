// src/contexts/AuthContext.tsx - FIXED VERSION
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SessionUser } from "@/lib/auth";
import { UserRole, Permissions } from "@/lib/permissions";
import { ProcessName } from "@/lib/types-new";

interface AuthContextType {
  user: SessionUser | null;
  isLoading: boolean;
  permissions: typeof Permissions;
  checkPermission: (
    permission: keyof typeof Permissions,
    ...args: unknown[]
  ) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const result = await response.json();

      if (result.success) {
        setUser(result.user);
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPermission = (
    permission: keyof typeof Permissions,
    ...args: unknown[]
  ): boolean => {
    if (!user) return false;

    const permissionFn = Permissions[permission];
    if (typeof permissionFn === "function") {
      // Cast to any to allow dynamic parameter passing
      // This is safe because we're just forwarding the arguments
      return (permissionFn as any)(user.role as UserRole, ...args);
    }

    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        permissions: Permissions,
        checkPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
