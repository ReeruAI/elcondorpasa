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

  const checkConnection = useCallback(async () => {
    try {
      const response = await axios.get("/api/youtube/status", {
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
      const response = await axios.get("/api/youtube/auth-url", {
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
      if (!isConnected) return;

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

        const response = await axios.post("/api/youtube/upload", formData, {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100
              );
              setUploadStatus(`Uploading... ${progress}%`);
            }
          },
        });

        if (response.data.success) {
          setUploadStatus("Upload successful! 🎉");
          setTimeout(() => {
            if (response.data.videoUrl) {
              window.open(response.data.videoUrl, "_blank");
            }
            setUploadStatus("");
            setIsUploading(false);
          }, 2000);
        }
      } catch (error) {
        console.error("Error uploading to YouTube:", error);
        setUploadStatus("Upload failed. Please try again.");
        setTimeout(() => {
          setUploadStatus("");
          setIsUploading(false);
        }, 3000);
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
