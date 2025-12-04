"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";
import { ProcessStep } from "@/lib/types-new";
import { ProcessStepCard } from "@/components/ProcessStepCards";

export default function WaitingListPage() {
  const [waitingItems, setWaitingItems] = useState<ProcessStep[]>([]);

  useEffect(() => {
    loadWaitingList();
  }, []);

  const loadWaitingList = async () => {
    const items = await apiClient.getWaitingList();
    setWaitingItems(items);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Waiting List</h1>
      <div className="space-y-4">
        {waitingItems.map((item) => (
          <ProcessStepCard
            key={item.id}
            processStep={item}
            onUpdate={loadWaitingList}
          />
        ))}
      </div>
    </div>
  );
}
