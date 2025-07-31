// hooks/useYouTubeIntegration.ts
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { VideoShort } from "../types";
import { createVideoFile, openPopupWindow } from "../utils/yourclip";

interface UseYouTubeIntegrationReturn {
  isConnected: boolean;
  isUploading: boolean;
  uploadStatus: string;
  checkConnection: () => Promise<void>;
  handleLogin: () => Promise<void>;
  handleUpload: (video: VideoShort) => Promise<void>;
}

export const useYouTubeIntegration = (): UseYouTubeIntegrationReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  // Add base URL configuration
  const getBaseURL = () => {
    if (typeof window !== "undefined") {
      // Use relative URLs in production
      return window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "";
    }
    return "";
  };

  const checkConnection = useCallback(async () => {
    try {
      const response = await axios.get(`${getBaseURL()}/api/youtube/status`, {
        withCredentials: true,
      });
      setIsConnected(response.data.connected);
    } catch (error) {
      console.error("Error checking YouTube connection:", error);
      setIsConnected(false);
    }
  }, []);

  const handleLogin = useCallback(async () => {
    try {
      const response = await axios.get(`${getBaseURL()}/api/youtube/auth-url`, {
        withCredentials: true,
      });

      if (response.data.authUrl) {
        const popup = openPopupWindow(response.data.authUrl, "youtube-auth");

        if (popup) {
          const checkPopup = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkPopup);
              checkConnection();
            }
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Error getting YouTube auth URL:", error);
    }
  }, [checkConnection]);

  const handleUpload = useCallback(
    async (video: VideoShort) => {
      if (!isConnected) {
        console.error("Not connected to YouTube");
        return;
      }

      setIsUploading(true);
      setUploadStatus("Preparing upload...");

      try {
        setUploadStatus("Downloading video...");
        const videoFile = await createVideoFile(
          video.download_url,
          video.title
        );

        const formData = new FormData();
        formData.append("video", videoFile);
        formData.append("title", video.title);

        const description =
          video.captions?.youtube ||
          `Check out this viral short! Created with AI-powered video editor.\n\n#shorts #viral`;
        formData.append("description", description);

        const tags = video.title
          .toLowerCase()
          .split(" ")
          .filter((word) => word.length > 3);
        formData.append(
          "tags",
          JSON.stringify([...tags, "shorts", "viral", "ai"])
        );

        setUploadStatus("Uploading to YouTube...");

        // Enhanced error handling and debugging
        const response = await axios.post(
          `${getBaseURL()}/api/youtube/upload`,
          formData,
          {
            withCredentials: true,
            headers: {
              "Content-Type": "multipart/form-data",
              // No need to manually add x-userid - middleware handles it
            },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const progress = Math.round(
                  (progressEvent.loaded / progressEvent.total) * 100
                );
                setUploadStatus(`Uploading... ${progress}%`);
              }
            },
            // Add timeout for large files
            timeout: 300000, // 5 minutes
          }
        );

        if (response.data.success) {
          setUploadStatus("Upload successful! 🎉");
          setTimeout(() => {
            if (response.data.videoUrl) {
              window.open(response.data.videoUrl, "_blank");
            }
            setUploadStatus("");
            setIsUploading(false);
          }, 2000);
        } else {
          // Handle API error response
          throw new Error(response.data.error || "Upload failed");
        }
      } catch (error) {
        console.error("Error uploading to YouTube:", error);

        // Enhanced error messaging
        let errorMessage = "Upload failed. ";

        if (axios.isAxiosError(error)) {
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error("Error response:", error.response.data);
            console.error("Error status:", error.response.status);

            if (error.response.status === 401) {
              errorMessage +=
                "Authentication failed. Please reconnect YouTube.";
              setIsConnected(false);
            } else if (error.response.status === 413) {
              errorMessage += "File too large.";
            } else if (error.response.status === 500) {
              errorMessage += "Server error. Check production logs.";
            } else {
              errorMessage +=
                error.response.data?.message || "Please try again.";
            }
          } else if (error.request) {
            // The request was made but no response was received
            console.error("No response received:", error.request);
            errorMessage += "Network error. Check your connection.";
          } else {
            // Something happened in setting up the request
            console.error("Request setup error:", error.message);
            errorMessage += error.message;
          }
        } else {
          errorMessage += (error as Error).message || "Unknown error occurred.";
        }

        setUploadStatus(errorMessage);
        setTimeout(() => {
          setUploadStatus("");
          setIsUploading(false);
        }, 5000);
      }
    },
    [isConnected]
  );

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    isConnected,
    isUploading,
    uploadStatus,
    checkConnection,
    handleLogin,
    handleUpload,
  };
};
