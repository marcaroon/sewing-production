// src/components/DualProgressBars.tsx
// Dual Progress Bar System: Process Flow + Quantity Completion

"use client";

import React from "react";
import { Order } from "@/lib/types-new";

interface DualProgressBarsProps {
  order: Order;
  compact?: boolean; // For order cards
}

/**
 * Calculate Process Flow Progress
 */
function calculateProcessProgress(order: Order) {
  const processSteps = [...(order.processSteps || [])].sort(
    (a, b) => a.sequenceOrder - b.sequenceOrder
  );
  const totalSteps = order.totalProcessSteps || processSteps.length;

  if (totalSteps === 0) {
    return { percentage: 0, completed: 0, current: 0, total: 0 };
  }

  const completedSteps = processSteps.filter(
    (step) => step.status === "completed"
  ).length;

  const inProgressIndex = processSteps.findIndex(
    (step) => step.status === "in_progress"
  );
  const currentProcessIndex = processSteps.findIndex(
    (step) => step.processName === order.currentProcess
  );

  const resolvedIndex =
    inProgressIndex >= 0 ? inProgressIndex : currentProcessIndex;
  const currentStep = Math.min(
    totalSteps,
    Math.max(
      0,
      resolvedIndex >= 0
        ? resolvedIndex + 1
        : completedSteps === totalSteps
        ? totalSteps
        : 0
    )
  );

  const percentage = Math.round((currentStep / totalSteps) * 100);
  return {
    percentage,
    completed: completedSteps,
    current: currentStep,
    total: totalSteps,
  };
}

/**
 * Calculate Quantity Completion Progress
 */
function calculateQuantityProgress(order: Order) {
  const totalQuantity = order.totalQuantity;
  const totalRejected = Math.max(order.totalRejected, 0);
  const remainingQuantity = Math.max(totalQuantity - totalRejected, 0);
  const percentage =
    totalQuantity > 0
      ? Math.round((remainingQuantity / totalQuantity) * 100)
      : 0;

  return {
    percentage,
    remaining: remainingQuantity,
    total: totalQuantity,
    rejected: totalRejected,
  };
}

/**
 * COMPONENT: Dual Progress Bars (Compact Version)
 * Untuk Order Cards di dashboard/list
 */
export function DualProgressBarsCompact({ order }: DualProgressBarsProps) {
  const processProgress = calculateProcessProgress(order);
  const quantityProgress = calculateQuantityProgress(order);
  const processFlowName = order.processTemplate || order.processFlow || "";

  return (
    <div className="space-y-3 mb-6">
      {/* Process Progress */}
      <div>
        <div className="flex justify-between items-center text-xs font-semibold text-foreground mb-1.5">
          <div className="flex items-center gap-1">
            <span>Tahapan</span>
          </div>
          <span>
            {processProgress.current}/{processProgress.total}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-500  h-2 rounded-full transition-all duration-300"
            style={{ width: `${processProgress.percentage}%` }}
          />
        </div>
      </div>

      {/* Quantity Progress */}
      <div>
        <div className="flex justify-between items-center text-xs font-semibold text-foreground mb-1.5">
          <div className="flex items-center gap-1">
            <span>Output</span>
          </div>
          <span>
            {quantityProgress.remaining}/{quantityProgress.total} pcs
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
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
  const processFlowName = order.processTemplate || order.processFlow || "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Process Progress */}
      <div className="bg-blue-500/10 border-2 border-blue-500/40 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          {/* <div className="bg-blue-600 rounded-full p-2">
            <TrendingUp className="w-6 h-6 text-white" />
          </div> */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground">
              Progres Tahapan
            </h3>
            <p className="text-sm text-muted-foreground">
              Tahapan selesai di alur produksi
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-3xl font-bold text-blue-600">
                {processProgress.percentage}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {processProgress.current} of {processProgress.total} tahap
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                Tahapan Sekarang
              </p>
              <p className="text-lg font-bold text-foreground">
                {processProgress.current}
              </p>
            </div>
          </div>

          <div className="w-full bg-muted rounded-full h-4 overflow-hidden shadow-inner">
            <div
              className="bg-blue-500 h-4 rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${processProgress.percentage}%` }}
            />
          </div>
        </div>

        <div className="bg-card rounded-lg p-3 border border-blue-500/30">
          <p className="text-sm font-bold text-foreground">{processFlowName}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Total {processProgress.total} tahapan produksi
          </p>
        </div>
      </div>

      {/* Quantity Progress */}
      <div className="bg-success/10 border-2 border-success/40 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          {/* <div className="bg-green-600 rounded-full p-2">
            <Package className="w-6 h-6 text-white" />
          </div> */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground">
              Output Progress
            </h3>
            <p className="text-sm text-muted-foreground">
              Pieces completed and ready
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-3xl font-bold text-success">
                {quantityProgress.percentage}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {quantityProgress.remaining.toLocaleString()} of{" "}
                {quantityProgress.total.toLocaleString()} pieces
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">Tersisa</p>
              <p className="text-lg font-bold text-foreground">
                {(
                  quantityProgress.total - quantityProgress.remaining
                ).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="w-full bg-muted rounded-full h-4 overflow-hidden shadow-inner">
            <div
              className="bg-success h-4 rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${quantityProgress.percentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card rounded-lg p-3 border border-success/30">
            <p className="text-xs font-semibold text-foreground">Selesai</p>
            <p className="text-lg font-bold text-success">
              {quantityProgress.remaining.toLocaleString()}
            </p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-destructive/30">
            <p className="text-xs font-semibold text-foreground">Rejected</p>
            <p className="text-lg font-bold text-destructive">
              {quantityProgress.rejected}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
