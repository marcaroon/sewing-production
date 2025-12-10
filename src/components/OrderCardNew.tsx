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
  BUYER_TYPE_LABELS,
} from "@/lib/constants-new";
import { formatDate, formatNumber } from "@/lib/utils";
import { Calendar, Package, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

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
      <Card hover className="cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base">{order.orderNumber}</CardTitle>
              </div>
              <p className="text-sm font-medium text-gray-700 mt-1">
                {order.buyer.name}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {order.style.name}
              </p>
            </div>
            <Badge
              variant={order.buyer.type === "repeat" ? "success" : "warning"}
              size="sm"
            >
              {BUYER_TYPE_LABELS[order.buyer.type]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {/* Phase & Process */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
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

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-700 mb-2">
              <span>Completion Progress</span>
              <span className="text-blue-600">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
            <div className="flex items-start gap-2">
              <Package className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <span className="text-gray-600 text-xs block">Total Qty</span>
                <p className="font-bold text-gray-900">
                  {formatNumber(order.totalQuantity)} pcs
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <span className="text-gray-600 text-xs block">Completed</span>
                <p className="font-bold text-green-600">
                  {formatNumber(order.totalCompleted)} pcs
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <span className="text-gray-600 text-xs block">Production Due</span>
                <p
                  className={`font-bold ${
                    isDelayed ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {formatDate(order.productionDeadline)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <span className="text-gray-600 text-xs block">Delivery Due</span>
                <p className="font-bold text-gray-900">
                  {formatDate(order.deliveryDeadline)}
                </p>
              </div>
            </div>
          </div>

          {/* Delay Warning */}
          {isDelayed && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-800">
                  Delayed {delayDays} day{delayDays > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}

          {/* Reject Info */}
          {order.totalRejected > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <span className="text-xs font-semibold text-red-700">Rejected:</span>
                <span className="text-sm font-bold text-red-600">
                  {order.totalRejected} pcs (
                  {((order.totalRejected / order.totalQuantity) * 100).toFixed(1)}
                  %)
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-700 italic line-clamp-2 bg-yellow-50 border border-yellow-200 rounded px-2 py-1.5">
                {order.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};