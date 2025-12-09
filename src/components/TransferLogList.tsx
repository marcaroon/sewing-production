import { TransferLog } from "@/lib/types-new";
import { TransferLogCard } from "./TransferLogCard";
import { useEffect, useState } from "react";

interface TransferLogListProps {
    orderId?: string;
    department?: string;
    status?: "pending" | "received" | "disputed" | "all";
  }
  
  export const TransferLogList: React.FC<TransferLogListProps> = ({
    orderId,
    department,
    status = "all",
  }) => {
    const [transferLogs, setTransferLogs] = useState<TransferLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
  
    useEffect(() => {
      loadTransferLogs();
    }, [orderId, department, status]);
  
    const loadTransferLogs = async () => {
      setIsLoading(true);
      setError("");
  
      try {
        const params = new URLSearchParams();
        if (orderId) params.append("orderId", orderId);
        if (department) params.append("department", department);
        if (status !== "all") params.append("status", status);
  
        const response = await fetch(`/api/transfer-logs?${params}`);
        const result = await response.json();
  
        if (result.success) {
          setTransferLogs(result.data);
        } else {
          setError(result.error || "Failed to load transfer logs");
        }
      } catch (err) {
        setError("Failed to load transfer logs");
      } finally {
        setIsLoading(false);
      }
    };
  
    if (isLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transfer logs...</p>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadTransferLogs}
            className="mt-3 text-sm text-red-800 underline hover:text-red-900"
          >
            Try Again
          </button>
        </div>
      );
    }
  
    if (transferLogs.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>Belum ada surat jalan</p>
        </div>
      );
    }
  
    return (
      <div className="space-y-4">
        {transferLogs.map((log: TransferLog) => (
          <TransferLogCard
            key={log.id}
            transferLog={log}
            onUpdate={loadTransferLogs}
          />
        ))}
      </div>
    );
  };