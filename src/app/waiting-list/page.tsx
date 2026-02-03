// src/app/waiting-list/page.tsx - IMPROVED VERSION with Role-Based Access
"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";
import { ProcessName, ProcessStep } from "@/lib/types-new";
import { ProcessStepCard } from "@/components/ProcessStepCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import {
  canModifyProcess,
  UserRole,
  ROLE_PROCESS_MAP,
  Department,
} from "@/lib/permissions";
import { PROCESS_LABELS, PROCESS_DEPARTMENT_MAP } from "@/lib/constants-new";
import { AlertTriangle, Clock, List, Package, User } from "lucide-react";

export default function WaitingListPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [waitingItems, setWaitingItems] = useState<ProcessStep[]>([]);
  const [filteredItems, setFilteredItems] = useState<ProcessStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "my-processes">(
    "all"
  );

  useEffect(() => {
    if (!authLoading && user) {
      loadWaitingList();
    }
  }, [authLoading, user]);

  useEffect(() => {
    applyFilters();
  }, [waitingItems, activeFilter, user]);

  const loadWaitingList = async () => {
    setIsLoading(true);
    setError("");

    try {
      const items = await apiClient.getWaitingList();
      setWaitingItems(items);
    } catch (err) {
      console.error("Error loading waiting list:", err);
      setError("Failed to load waiting list");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    if (!user) {
      setFilteredItems([]);
      return;
    }

    let filtered = [...waitingItems];

    if (activeFilter === "my-processes") {
      if (!user.isAdmin && user.department !== "PPIC") {
        filtered = filtered.filter((item) =>
          canModifyProcess(
            user.department as Department,
            item.processName as ProcessName,
            user.isAdmin || false
          )
        );
      }
    }

    setFilteredItems(filtered);
  };

  const getUserAllowedProcesses = (): ProcessName[] => {
    if (!user) return [];
    if (user.isAdmin || user.department === "PPIC") return [];

    const normalizeDept = (dept: string | undefined) => {
      if (!dept) return "";
      return dept.charAt(0).toUpperCase() + dept.slice(1).toLowerCase();
    };

    const dept = normalizeDept(user?.department);
    return (ROLE_PROCESS_MAP as Record<string, ProcessName[]>)[dept] ?? [];
  };

  const myProcessCount = waitingItems.filter((item) =>
    canModifyProcess(
      user?.department as Department,
      item.processName as ProcessName,
      user?.isAdmin || false
    )
  ).length;

  if (authLoading || isLoading || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              Memuat data pengguna dan waiting list...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={loadWaitingList}
                className="mt-3 text-sm text-red-800 font-semibold underline hover:text-red-900"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const allowedProcesses = getUserAllowedProcesses();
  const isAdmin = user?.isAdmin || false;
  const isPPIC = user?.department === "ppic";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Waiting List
            </h1>
            <p className="text-gray-600">
              Process steps waiting to be assigned and started
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card hover>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <List className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">
                    Total Waiting
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {waitingItems.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {!isAdmin && !isPPIC && (
            <Card hover>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <Package className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">
                      My Processes
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {myProcessCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card hover>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">
                    Filtered View
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {filteredItems.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveFilter("all")}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
              activeFilter === "all"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All Processes ({waitingItems.length})
          </button>
          {!isAdmin && !isPPIC && (
            <button
              onClick={() => setActiveFilter("my-processes")}
              className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                activeFilter === "my-processes"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              My Processes Only ({myProcessCount})
            </button>
          )}
        </div>

        {/* Role Info Banner */}
        {!isAdmin && !isPPIC && allowedProcesses.length > 0 && (
          <div className="mt-4 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              {/* <User className="w-5 h-5 text-blue-600 mt-0.5" /> */}
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900 mb-2">
                  Your Authorized Processes:
                </p>
                <div className="flex flex-wrap gap-2">
                  {allowedProcesses.map((processName) => (
                    <Badge key={processName} variant="info" size="sm">
                      {PROCESS_LABELS[processName]}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  You can view and execute only these processes. Other processes
                  will be hidden unless you select "All Processes".
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Admin/PPIC Info */}
        {/* {(isAdmin || isPPIC) && (
          <div className="mt-4 bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-purple-900 mb-1">
                  {isAdmin ? "Admin Access" : "PPIC Access"}
                </p>
                <p className="text-xs text-purple-700">
                  {isAdmin
                    ? "You can view all processes in the waiting list as an admin."
                    : "You can view all processes for monitoring and assignment purposes. However, you cannot execute the processes directly."}
                </p>
              </div>
            </div>
          </div>
        )} */}
      </div>

      {/* Waiting List Content */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-semibold text-gray-900 mb-2">
              No items in waiting list
            </p>
            <p className="text-sm text-gray-600">
              {activeFilter === "my-processes" && !isAdmin && !isPPIC
                ? "No processes assigned to your department are currently waiting"
                : "All processes are either completed or in progress"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Info about filtered view */}
          {activeFilter === "all" && !isAdmin && !isPPIC && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <span className="font-bold">Note:</span> You're viewing all
                processes in the waiting list. However, you can only execute
                processes from{" "}
                <span className="font-bold">{user?.department}</span>. Other
                processes are read-only.
              </p>
            </div>
          )}

          {filteredItems.map((item) => (
            <ProcessStepCard
              key={item.id}
              processStep={item}
              onUpdate={loadWaitingList}
            />
          ))}
        </div>
      )}

      {/* Process Distribution Summary */}
      {filteredItems.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Distribution by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(
                filteredItems.reduce((acc, item) => {
                  const dept = item.department;
                  acc[dept] = (acc[dept] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              )
                .sort(([, a], [, b]) => b - a)
                .map(([dept, count]) => (
                  <div
                    key={dept}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                  >
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                      {dept}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
