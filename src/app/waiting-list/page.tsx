"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";
import { ProcessStep } from "@/lib/types-new";
import { ProcessStepCard } from "@/components/ProcessStepCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function WaitingListPage() {
  const [waitingItems, setWaitingItems] = useState<ProcessStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadWaitingList();
  }, []);

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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading waiting list...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadWaitingList}
            className="mt-3 text-sm text-red-800 underline hover:text-red-900"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Waiting List</h1>
        <p className="text-gray-600">
          Process steps waiting to be assigned and started
        </p>
      </div>

      {waitingItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p>No items in waiting list</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {waitingItems.map((item) => (
            <ProcessStepCard
              key={item.id}
              processStep={item}
              onUpdate={loadWaitingList}
            />
          ))}
        </div>
      )}
    </div>
  );
}