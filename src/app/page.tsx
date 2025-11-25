// app/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Order, DashboardStats } from '@/lib/types';
import { orderStorage } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { OrderCard } from '@/components/OrderCard';
import { Badge } from '@/components/ui/Badge';
import { initializeDummyData } from '@/lib/dummyData';
import { calculateAverageLeadTime, formatNumber } from '@/lib/utils';

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    ordersInProgress: 0,
    ordersCompleted: 0,
    ordersOnHold: 0,
    totalWIP: 0,
    avgLeadTime: 0,
    rejectRate: 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if data exists, if not initialize dummy data
    const existingOrders = orderStorage.getAll();
    if (existingOrders.length === 0 && !isInitialized) {
      initializeDummyData();
      setIsInitialized(true);
    }
    loadData();
  }, [isInitialized]);

  const loadData = () => {
    const allOrders = orderStorage.getAll();
    setOrders(allOrders);

    // Calculate stats
    const inProgress = allOrders.filter(o => 
      o.currentStatus !== 'completed' && 
      o.currentStatus !== 'on_hold' && 
      o.currentStatus !== 'rejected'
    ).length;

    const completed = allOrders.filter(o => o.currentStatus === 'completed').length;
    const onHold = allOrders.filter(o => o.currentStatus === 'on_hold').length;

    const totalWIP = allOrders.reduce((sum, order) => {
      return sum + Object.values(order.wip).reduce((wipSum, val) => wipSum + val, 0);
    }, 0);

    const totalRejected = allOrders.reduce((sum, order) => sum + order.totalRejected, 0);
    const totalQuantity = allOrders.reduce((sum, order) => sum + order.totalQuantity, 0);
    const rejectRate = totalQuantity > 0 ? (totalRejected / totalQuantity) * 100 : 0;

    setStats({
      totalOrders: allOrders.length,
      ordersInProgress: inProgress,
      ordersCompleted: completed,
      ordersOnHold: onHold,
      totalWIP,
      avgLeadTime: calculateAverageLeadTime(allOrders),
      rejectRate: Math.round(rejectRate * 10) / 10,
    });
  };

  // Get active orders (not completed)
  const activeOrders = orders
    .filter(o => o.currentStatus !== 'completed')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  // Get recently completed orders
  const completedOrders = orders
    .filter(o => o.currentStatus === 'completed')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Overview sistem produksi garment dan status order terkini
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalOrders}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {stats.ordersInProgress}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.ordersCompleted}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total WIP</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {formatNumber(stats.totalWIP)}
                </p>
                <p className="text-xs text-gray-500 mt-1">pieces</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Lead Time</span>
                <span className="text-xl font-bold text-gray-900">
                  {stats.avgLeadTime} hari
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Reject Rate</span>
                <span className={`text-xl font-bold ${stats.rejectRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.rejectRate}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">On Hold Orders</span>
                <span className="text-xl font-bold text-gray-900">
                  {stats.ordersOnHold}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/orders/new">
                <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-left font-medium">
                  + Create New Order
                </button>
              </Link>
              <Link href="/orders">
                <button className="w-full bg-white border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left font-medium">
                  📋 View All Orders
                </button>
              </Link>
              <button 
                onClick={() => {
                  if (confirm('Reset semua data dan load dummy data baru?')) {
                    initializeDummyData();
                    loadData();
                  }
                }}
                className="w-full bg-white border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left font-medium"
              >
                🔄 Reset Demo Data
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Orders */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Active Orders</h2>
          <Link href="/orders" className="text-blue-600 hover:text-blue-800 font-medium">
            View All →
          </Link>
        </div>
        {activeOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <p>Tidak ada order aktif</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      {/* Recently Completed */}
      {completedOrders.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recently Completed</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {completedOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}