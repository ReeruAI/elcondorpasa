// hooks/useUserShorts.ts
import { useState, useEffect, useCallback } from "react";
import { VideoShort } from "../types";

interface UseUserShortsReturn {
  shorts: VideoShort[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useUserShorts = (): UseUserShortsReturn => {
  const [shorts] = useState<VideoShort[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserShorts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
    } catch (error) {
      console.error("Error fetching user shorts:", error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserShorts();
  }, [fetchUserShorts]);

  return {
    shorts,
    isLoading,
    error,
    refetch: fetchUserShorts,
  };
};
