// src/context/AuthContext.tsx - FIXED VERSION
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SessionUser } from "@/lib/auth";
import { Permissions } from "@/lib/permissions";
import { ProcessName } from "@/lib/types-new";

interface AuthContextType {
  user: (SessionUser & { isAdmin?: boolean }) | null;
  isLoading: boolean;
  permissions: typeof Permissions;
  checkPermission: (
    permission: keyof typeof Permissions,
    ...args: unknown[]
  ) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<
    (SessionUser & { isAdmin?: boolean }) | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
    window.addEventListener("focus", loadUser);
    return () => window.removeEventListener("focus", loadUser);
  }, []);

  const loadUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const result = await response.json();

      if (result.success) {
        setUser(result.user);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const checkPermission = (
    permission: keyof typeof Permissions,
    ...args: unknown[]
  ): boolean => {
    if (!user) {
      return false;
    }

    const permissionFn = Permissions[permission];
    if (typeof permissionFn === "function") {
      try {
        const result = (permissionFn as any)(
          user.department,
          ...args,
          user.isAdmin || false
        );
        return result;
      } catch (error) {
        return false;
      }
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
