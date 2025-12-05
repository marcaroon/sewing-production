"use client";

import React from "react";
import Link from "next/link";
import { Order } from "@/lib/types-new";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import {
  PROCESS_LABELS,
  PHASE_LABELS,
  PROCESS_STATE_LABELS,
  PROCESS_STATE_COLORS,
  BUYER_TYPE_LABELS,
} from "@/lib/constants-new";
import { formatDate, formatNumber } from "@/lib/utils";

interface OrderCardProps {
  order: Order;
}

export const OrderCardNew: React.FC<OrderCardProps> = ({ order }) => {
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
    <Link href={`/orders/${order.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{order.orderNumber}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {order.buyer.name} - {order.style.name}
              </p>
            </div>
            <Badge
              variant={order.buyer.type === "repeat" ? "success" : "warning"}
            >
              {BUYER_TYPE_LABELS[order.buyer.type]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {/* Phase & Process */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="info">{PHASE_LABELS[order.currentPhase]}</Badge>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  PROCESS_STATE_COLORS[order.currentState]
                }`}
              >
                {PROCESS_STATE_LABELS[order.currentState]}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {PROCESS_LABELS[order.currentProcess]}
            </p>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Completion</span>
              <span>{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Qty:</span>
              <p className="font-semibold text-gray-900">
                {formatNumber(order.totalQuantity)} pcs
              </p>
            </div>
            <div>
              <span className="text-gray-600">Completed:</span>
              <p className="font-semibold text-green-600">
                {formatNumber(order.totalCompleted)} pcs
              </p>
            </div>
            <div>
              <span className="text-gray-600">Production Due:</span>
              <p
                className={`font-semibold ${
                  isDelayed ? "text-red-600" : "text-gray-900"
                }`}
              >
                {formatDate(order.productionDeadline)}
                {isDelayed && (
                  <span className="text-xs ml-1">(+{delayDays}d)</span>
                )}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Delivery Due:</span>
              <p className="font-semibold text-gray-900">
                {formatDate(order.deliveryDeadline)}
              </p>
            </div>
          </div>

          {/* Reject Info */}
          {order.totalRejected > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Rejected:</span>
                <span className="text-red-600 font-semibold">
                  {order.totalRejected} pcs (
                  {((order.totalRejected / order.totalQuantity) * 100).toFixed(
                    1
                  )}
                  %)
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600 italic line-clamp-2">
                {order.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
