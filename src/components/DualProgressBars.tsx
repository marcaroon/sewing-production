// src/components/DualProgressBars.tsx
// Dual Progress Bar System: Process Flow + Quantity Completion

"use client";

import React from "react";
import { Order, ProcessStep } from "@/lib/types-new";
import { TrendingUp, Package } from "lucide-react";

interface DualProgressBarsProps {
  order: Order;
  compact?: boolean; // For order cards
}

/**
 * Calculate Process Flow Progress
 */
function calculateProcessProgress(order: Order) {
  const processSteps = order.processSteps || [];
  const totalSteps = order.totalProcessSteps || processSteps.length;

  if (totalSteps === 0) {
    return { percentage: 0, completed: 0, total: 0 };
  }

  const completedSteps = processSteps.filter(
    (step) => step.status === "completed"
  ).length;

  const percentage = Math.round((completedSteps / totalSteps) * 100);

  return {
    percentage,
    completed: completedSteps,
    total: totalSteps,
  };
}

/**
 * Calculate Quantity Completion Progress
 */
function calculateQuantityProgress(order: Order) {
  const percentage =
    order.totalQuantity > 0
      ? Math.round((order.totalCompleted / order.totalQuantity) * 100)
      : 0;

  return {
    percentage,
    completed: order.totalCompleted,
    total: order.totalQuantity,
  };
}

/**
 * COMPONENT: Dual Progress Bars (Compact Version)
 * Untuk Order Cards di dashboard/list
 */
export function DualProgressBarsCompact({ order }: DualProgressBarsProps) {
  const processProgress = calculateProcessProgress(order);
  const quantityProgress = calculateQuantityProgress(order);

  return (
    <div className="space-y-3 mb-6">
      {/* Process Progress */}
      <div>
        <div className="flex justify-between items-center text-xs font-semibold text-gray-700 mb-1.5">
          <div className="flex items-center gap-1">
            <span>Process Steps</span>
          </div>
          <span>
            {processProgress.completed}/{processProgress.total}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-500  h-2 rounded-full transition-all duration-300"
            style={{ width: `${processProgress.percentage}%` }}
          />
        </div>
      </div>

      {/* Quantity Progress */}
      <div>
        <div className="flex justify-between items-center text-xs font-semibold text-gray-700 mb-1.5">
          <div className="flex items-center gap-1">
            <span>Output</span>
          </div>
          <span>
            {quantityProgress.completed}/{quantityProgress.total} pcs
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-linear-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${quantityProgress.percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * COMPONENT: Dual Progress Bars (Full Version)
 * Untuk Order Detail Page
 */
export function DualProgressBarsFull({ order }: DualProgressBarsProps) {
  const processProgress = calculateProcessProgress(order);
  const quantityProgress = calculateQuantityProgress(order);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Process Progress */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          {/* <div className="bg-blue-600 rounded-full p-2">
            <TrendingUp className="w-6 h-6 text-white" />
          </div> */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">
              Process Flow Progress
            </h3>
            <p className="text-sm text-gray-600">
              Steps completed in production flow
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-3xl font-bold text-blue-600">
                {processProgress.percentage}%
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {processProgress.completed} of {processProgress.total} steps
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-700">
                Current Step
              </p>
              <p className="text-lg font-bold text-gray-700">
                {processProgress.completed + 1}
              </p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
            <div
              className="bg-blue-500 h-4 rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${processProgress.percentage}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-blue-200">
          <p className="text-sm font-bold text-gray-900">
            {order.processTemplate || "Standard Flow"}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Total {processProgress.total} production steps
          </p>
        </div>
      </div>

      {/* Quantity Progress */}
      <div className="bg-linear-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          {/* <div className="bg-green-600 rounded-full p-2">
            <Package className="w-6 h-6 text-white" />
          </div> */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">Output Progress</h3>
            <p className="text-sm text-gray-600">Pieces completed and ready</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-3xl font-bold text-green-600">
                {quantityProgress.percentage}%
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {quantityProgress.completed.toLocaleString()} of{" "}
                {quantityProgress.total.toLocaleString()} pieces
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-700">Remaining</p>
              <p className="text-lg font-bold text-gray-700">
                {(
                  quantityProgress.total - quantityProgress.completed
                ).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
            <div
              className="bg-green-600 h-4 rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${quantityProgress.percentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <p className="text-xs font-semibold text-gray-700">Completed</p>
            <p className="text-lg font-bold text-green-600">
              {quantityProgress.completed.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-red-200">
            <p className="text-xs font-semibold text-gray-700">Rejected</p>
            <p className="text-lg font-bold text-red-600">
              {order.totalRejected}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
