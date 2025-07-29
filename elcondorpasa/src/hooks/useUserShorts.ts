// hooks/useUserShorts.ts
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { VideoShort, UserShortsResponse } from "../types";

interface UseUserShortsReturn {
  shorts: VideoShort[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useUserShorts = (): UseUserShortsReturn => {
  const [shorts, setShorts] = useState<VideoShort[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserShorts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.get<UserShortsResponse>("/api/user-shorts", {
        withCredentials: true,
      });

      if (response.data?.shorts) {
        const sortedShorts = [...response.data.shorts].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setShorts(sortedShorts);
      }
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
