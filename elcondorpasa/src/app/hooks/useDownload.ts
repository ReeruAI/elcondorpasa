// src/app/hooks/useDownload.ts
import { useState, useCallback } from "react";

interface DownloadOptions {
  filename?: string;
  useProxy?: boolean;
  onProgress?: (message: string) => void;
  onError?: (error: string) => void;
  onSuccess?: () => void;
}

interface UseDownloadReturn {
  downloadFile: (url: string, options?: DownloadOptions) => Promise<boolean>;
  isDownloading: boolean;
  progress: string;
  error: string | null;
  clearError: () => void;
}

export const useDownload = (): UseDownloadReturn => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const downloadFile = useCallback(
    async (url: string, options: DownloadOptions = {}): Promise<boolean> => {
      const {
        filename = "download",
        useProxy = true,
        onProgress,
        onError,
        onSuccess,
      } = options;

      setIsDownloading(true);
      setError(null);
      setProgress("");

      try {
        const progressUpdate = (message: string) => {
          setProgress(message);
          onProgress?.(message);
        };

        progressUpdate("Initiating download...");

        let response: Response;

        if (useProxy) {
          progressUpdate("Fetching file through proxy...");
          response = await fetch(
            `/api/download?url=${encodeURIComponent(
              url
            )}&filename=${encodeURIComponent(filename)}`
          );
        } else {
          progressUpdate("Fetching file directly...");
          response = await fetch(url, {
            mode: "cors",
            method: "GET",
          });
        }

        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;

          if (useProxy) {
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } catch {
              // If we can't parse JSON, use the default error message
            }
          }

          throw new Error(errorMessage);
        }

        progressUpdate("Processing file...");
        const blob = await response.blob();

        progressUpdate("Preparing download...");
        const downloadUrl = window.URL.createObjectURL(blob);

        // Create and trigger download
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup
        window.URL.revokeObjectURL(downloadUrl);

        progressUpdate("Download completed!");
        onSuccess?.();

        // Clear progress after delay
        setTimeout(() => {
          setProgress("");
        }, 3000);

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        const fullError = `Download failed: ${errorMessage}`;

        setError(fullError);
        onError?.(fullError);
        setProgress("");

        console.error("Download error:", err);
        return false;
      } finally {
        setIsDownloading(false);
      }
    },
    []
  );

  return {
    downloadFile,
    isDownloading,
    progress,
    error,
    clearError,
  };
};
