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
      <Card className="border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
        <Link href={`/orders/${order.id}`}>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Order Number with Icon */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-blue-100 rounded-lg p-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <CardTitle className="text-base font-bold text-gray-900 truncate">
                    {order.orderNumber}
                  </CardTitle>
                </div>

                {/* Buyer Info */}
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {order.buyer.name}
                  </p>
                  {/* <p className="text-sm font-semibold text-gray-900 truncate">
                    {article>}
                  </p> */}
                  <p className="text-xs text-gray-600 truncate flex items-center gap-1">
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
            <div className="bg-linear-to-r from-gray-50 to-blue-50 rounded-xl p-3 border border-gray-200">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="info" size="sm">
                  {PHASE_LABELS[order.currentPhase]}
                </Badge>
                <Badge variant="purple" size="sm">
                  {PROCESS_STATE_LABELS[order.currentState]}
                </Badge>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {PROCESS_LABELS[order.currentProcess]}
              </p>
            </div>

            {/* Progress Bars */}
            <DualProgressBarsCompact order={order} />

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Total Quantity */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-3.5 h-3.5 text-gray-600" />
                  <span className="text-xs font-semibold text-gray-600">
                    Total Qty
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {formatNumber(order.totalQuantity)}
                </p>
                <p className="text-xs text-gray-500">pieces</p>
              </div>

              {/* Completed */}
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">
                    Completed
                  </span>
                </div>
                <p className="text-lg font-bold text-green-700">
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
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
          >
            <span className="text-sm font-medium text-blue-700">
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
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              <Card className="border-2 border-gray-200 shadow-none">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Order Number with Icon */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-blue-100 rounded-lg p-1.5">
                          <Package className="w-4 h-4 text-blue-600" />
                        </div>
                        <CardTitle className="text-base font-bold text-gray-900 truncate">
                          {order.orderNumber}
                        </CardTitle>
                      </div>

                      {/* Buyer Info */}
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {order.buyer.name}
                        </p>
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
                  <div className="bg-linear-to-r from-gray-50 to-blue-50 rounded-xl p-3 border border-gray-200">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="info" size="sm">
                        {PHASE_LABELS[order.currentPhase]}
                      </Badge>
                      <Badge variant="purple" size="sm">
                        {PROCESS_STATE_LABELS[order.currentState]}
                      </Badge>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {PROCESS_LABELS[order.currentProcess]}
                    </p>
                  </div>

                  {/* Progress Bars */}
                  <DualProgressBarsCompact order={order} />

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Total Quantity */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-3.5 h-3.5 text-gray-600" />
                        <span className="text-xs font-semibold text-gray-600">
                          Total Qty
                        </span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatNumber(order.totalQuantity)}
                      </p>
                      <p className="text-xs text-gray-500">pieces</p>
                    </div>

                    {/* Completed */}
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-xs font-semibold text-green-700">
                          Completed
                        </span>
                      </div>
                      <p className="text-lg font-bold text-green-700">
                        {formatNumber(order.totalCompleted)}
                      </p>
                      <p className="text-xs text-green-600">
                        {completionRate}%
                      </p>
                    </div>
                  </div>

                  {/* Production Start Date */}
                  {order.productionStartedAt ? (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <PlayCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-700">
                          Production Started
                        </span>
                      </div>
                      <p className="text-sm font-bold text-blue-900">
                        {formatDate(new Date(order.productionStartedAt))}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-100 rounded-lg p-3 border border-gray-300">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-700">
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
                          ? "bg-red-50 border-red-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar
                            className={`w-4 h-4 ${
                              isDelayed ? "text-red-600" : "text-gray-600"
                            }`}
                          />
                          <span
                            className={`text-xs font-semibold ${
                              isDelayed ? "text-red-700" : "text-gray-600"
                            }`}
                          >
                            Production Due
                          </span>
                        </div>
                        <p
                          className={`text-sm font-bold ${
                            isDelayed ? "text-red-700" : "text-gray-900"
                          }`}
                        >
                          {formatDate(order.productionDeadline)}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Deadline */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <span className="text-xs font-semibold text-gray-600">
                            Delivery Due
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-900">
                          {formatDate(order.deliveryDeadline)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Delay Warning */}
                  {isDelayed && (
                    <div className="bg-linear-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-red-200 rounded-full p-1">
                          <AlertTriangle className="w-4 h-4 text-red-700" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-red-900">
                            Production Delayed
                          </p>
                          <p className="text-xs text-red-700">
                            {delayDays} day{delayDays > 1 ? "s" : ""} overdue
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reject Info */}
                  {order.totalRejected > 0 && (
                    <div className="bg-linear-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-bold text-red-900">
                            Rejected Items
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-700">
                            {order.totalRejected}
                          </p>
                          <p className="text-xs text-red-600">
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
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-yellow-900 font-medium leading-relaxed line-clamp-2">
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
