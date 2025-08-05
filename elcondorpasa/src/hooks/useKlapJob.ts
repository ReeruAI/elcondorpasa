import { useState, useEffect, useCallback } from "react";
import { KlapShort } from "@/types";

interface KlapJobStatus {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  result?: {
    short: KlapShort;
    downloadUrl: string;
  };
  error?: string;
}

export function useKlapJob() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<KlapJobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const startJob = useCallback(async (videoUrl: string, userId: string) => {
    try {
      const response = await fetch("/api/klap/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-userId": userId, // Pass actual user ID
        },
        body: JSON.stringify({ video_url: videoUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start job");
      }

      const data = await response.json();
      setJobId(data.jobId);
      setIsPolling(true);

      return data.jobId;
    } catch (error) {
      console.error("Failed to start job:", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    if (!jobId || !isPolling) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/klap/status/${jobId}`);
        const data: KlapJobStatus = await response.json();

        setStatus(data);

        if (data.status === "completed" || data.status === "failed") {
          setIsPolling(false);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("Failed to poll status:", error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [jobId, isPolling]);

  return {
    startJob,
    jobId,
    status,
    isPolling,
  };
}
