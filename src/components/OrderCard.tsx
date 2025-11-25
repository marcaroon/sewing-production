// components/OrderCard.tsx

"use client";

import React from "react";
import Link from "next/link";
import { Order } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import {
  PROCESS_STATUS_LABELS,
  STATUS_COLORS,
  BUYER_TYPE_LABELS,
} from "@/lib/constants";
import {
  formatDate,
  calculateProgress,
  isOrderDelayed,
  getDelayDays,
  calculateCompletionRate,
  formatNumber,
} from "@/lib/utils";

interface OrderCardProps {
  order: Order;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const progress = calculateProgress(order);
  const isDelayed = isOrderDelayed(order);
  const delayDays = getDelayDays(order);
  const completionRate = calculateCompletionRate(order);

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
          {/* Status */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  STATUS_COLORS[order.currentStatus]
                }`}
              >
                {PROCESS_STATUS_LABELS[order.currentStatus]}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{progress}% Progress</span>
              <span>{completionRate}% Completed</span>
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
              <span className="text-gray-600">Sewing Line:</span>
              <p className="font-semibold text-gray-900">
                {order.assignedLine || "-"}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Order Date:</span>
              <p className="font-semibold text-gray-900">
                {formatDate(order.orderDate)}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Target Date:</span>
              <p
                className={`font-semibold ${
                  isDelayed ? "text-red-600" : "text-gray-900"
                }`}
              >
                {formatDate(order.targetDate)}
                {isDelayed && (
                  <span className="text-xs ml-1">(+{delayDays}d)</span>
                )}
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
              <p className="text-xs text-gray-600 italic">{order.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
