"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Order } from "@/lib/types-new";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import {
  PROCESS_LABELS,
  PHASE_LABELS,
  PROCESS_STATE_LABELS,
  BUYER_TYPE_LABELS,
} from "@/lib/constants-new";
import { formatDate, formatNumber } from "@/lib/utils";
import {
  Calendar,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  TrendingUp,
  Box,
  Eye,
  X,
} from "lucide-react";
import { DualProgressBarsCompact } from "@/components/DualProgressBars";

interface OrderCardProps {
  order: Order;
}

export const OrderCardNew: React.FC<OrderCardProps> = ({ order }) => {
  const [showDetailModal, setShowDetailModal] = useState(false);

  const isDelayed = new Date() > new Date(order.productionDeadline);
  const delayDays = isDelayed
    ? Math.ceil(
        (new Date().getTime() - new Date(order.productionDeadline).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const completionRate =
    order.totalQuantity > 0
      ? Math.round((order.totalCompleted / order.totalQuantity) * 100)
      : 0;

  return (
    <>
      <Card className="border-2 border-border hover:border-blue-500/40 hover:shadow-xl transition-all duration-300">
        <Link href={`/orders/${order.id}`}>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Order Number with Icon */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-blue-500/15 rounded-lg p-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <CardTitle className="text-base font-bold text-foreground truncate">
                    {order.orderNumber}
                  </CardTitle>
                </div>

                {/* Buyer Info */}
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {order.buyer.name}
                  </p>
                  {order.article && (
                    <p className="text-sm font-semibold text-foreground truncate">
                      {order.article}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <Box className="w-3 h-3" />
                    {order.style.name}
                  </p>
                </div>
              </div>

              {/* Buyer Type Badge */}
              <Badge
                variant={order.buyer.type === "repeat" ? "success" : "warning"}
                size="sm"
                className="shrink-0"
              >
                {BUYER_TYPE_LABELS[order.buyer.type]}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Phase & Process Status */}
            <div className="bg-linear-to-r from-muted to-blue-500/10 rounded-xl p-3 border border-border">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="info" size="sm">
                  {PHASE_LABELS[order.currentPhase]}
                </Badge>
                <Badge variant="purple" size="sm">
                  {PROCESS_STATE_LABELS[order.currentState]}
                </Badge>
              </div>
              <p className="text-sm font-bold text-foreground">
                {PROCESS_LABELS[order.currentProcess]}
              </p>
            </div>

            {/* Progress Bars */}
            <DualProgressBarsCompact order={order} />

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Total Quantity */}
              <div className="bg-muted rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">
                    Total Qty
                  </span>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {formatNumber(order.totalQuantity)}
                </p>
                <p className="text-xs text-muted-foreground">pieces</p>
              </div>

              {/* Completed */}
              <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs font-semibold text-green-600">
                    Completed
                  </span>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {formatNumber(order.totalCompleted)}
                </p>
                <p className="text-xs text-green-600">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Link>

        {/* See Details Button */}
        <div className="px-6 pb-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowDetailModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-blue-500/30 bg-card hover:bg-blue-500/10 hover:border-blue-500/40 transition-all duration-200"
          >
            <span className="text-sm font-medium text-blue-600">
              See Details
            </span>
          </button>
        </div>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-card border-b border-border px-6 py-3 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-foreground">
                Order Details
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              <Card className="border-2 border-border shadow-none">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Order Number with Icon */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-blue-500/15 rounded-lg p-1.5">
                          <Package className="w-4 h-4 text-blue-600" />
                        </div>
                        <CardTitle className="text-base font-bold text-foreground truncate">
                          {order.orderNumber}
                        </CardTitle>
                      </div>

                      {/* Buyer Info */}
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {order.buyer.name}
                        </p>
                        {order.article && (
                          <p className="text-sm font-semibold text-foreground truncate">
                            {order.article}
                          </p>
                        )}
                        <p className="text-xs text-gray-600 truncate flex items-center gap-1">
                          <Box className="w-3 h-3" />
                          {order.style.name}
                        </p>
                      </div>
                    </div>

                    {/* Buyer Type Badge */}
                    <Badge
                      variant={
                        order.buyer.type === "repeat" ? "success" : "warning"
                      }
                      size="sm"
                      className="shrink-0"
                    >
                      {BUYER_TYPE_LABELS[order.buyer.type]}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Phase & Process Status */}
                  <div className="bg-linear-to-r from-muted to-blue-500/10 rounded-xl p-3 border border-border">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="info" size="sm">
                        {PHASE_LABELS[order.currentPhase]}
                      </Badge>
                      <Badge variant="purple" size="sm">
                        {PROCESS_STATE_LABELS[order.currentState]}
                      </Badge>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {PROCESS_LABELS[order.currentProcess]}
                    </p>
                  </div>

                  {/* Progress Bars */}
                  <DualProgressBarsCompact order={order} />

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Total Quantity */}
                    <div className="bg-muted rounded-lg p-3 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">
                          Total Qty
                        </span>
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        {formatNumber(order.totalQuantity)}
                      </p>
                      <p className="text-xs text-muted-foreground">pieces</p>
                    </div>

                    {/* Completed */}
                    <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-xs font-semibold text-green-600">
                          Completed
                        </span>
                      </div>
                      <p className="text-lg font-bold text-green-600">
                        {formatNumber(order.totalCompleted)}
                      </p>
                      <p className="text-xs text-green-600">
                        {completionRate}%
                      </p>
                    </div>
                  </div>

                  {/* Production Start Date */}
                  {order.productionStartedAt ? (
                    <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
                      <div className="flex items-center gap-2 mb-1">
                        <PlayCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-600">
                          Production Started
                        </span>
                      </div>
                      <p className="text-sm font-bold text-blue-600">
                        {formatDate(new Date(order.productionStartedAt))}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-muted rounded-lg p-3 border border-border">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-foreground">
                          Not Started Yet
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Deadlines */}
                  <div className="space-y-2">
                    {/* Production Deadline */}
                    <div
                      className={`rounded-lg p-3 border ${
                        isDelayed
                          ? "bg-destructive/10 border-destructive/40"
                          : "bg-muted border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar
                            className={`w-4 h-4 ${
                              isDelayed
                                ? "text-destructive"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span
                            className={`text-xs font-semibold ${
                              isDelayed
                                ? "text-destructive"
                                : "text-muted-foreground"
                            }`}
                          >
                            Production Due
                          </span>
                        </div>
                        <p
                          className={`text-sm font-bold ${
                            isDelayed ? "text-destructive" : "text-foreground"
                          }`}
                        >
                          {formatDate(order.productionDeadline)}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Deadline */}
                    <div className="bg-muted rounded-lg p-3 border border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-semibold text-muted-foreground">
                            Delivery Due
                          </span>
                        </div>
                        <p className="text-sm font-bold text-foreground">
                          {formatDate(order.deliveryDeadline)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Delay Warning */}
                  {isDelayed && (
                    <div className="bg-destructive/10 border-2 border-destructive/40 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-destructive/15 rounded-full p-1">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-destructive">
                            Production Delayed
                          </p>
                          <p className="text-xs text-destructive/80">
                            {delayDays} day{delayDays > 1 ? "s" : ""} overdue
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reject Info */}
                  {order.totalRejected > 0 && (
                    <div className="bg-destructive/10 border-2 border-destructive/40 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          <span className="text-sm font-bold text-destructive">
                            Rejected Items
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-destructive">
                            {order.totalRejected}
                          </p>
                          <p className="text-xs text-destructive/80">
                            {(
                              (order.totalRejected / order.totalQuantity) *
                              100
                            ).toFixed(1)}
                            % of total
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {order.notes && (
                    <div className="bg-warning/10 border-2 border-warning/30 rounded-xl p-3">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                        <p className="text-xs text-warning-foreground font-medium leading-relaxed line-clamp-2">
                          {order.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
