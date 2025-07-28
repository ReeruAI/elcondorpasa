"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Film,
  Loader2,
  Calendar,
  Download,
  TrendingUp,
  Copy,
  CheckCircle,
  X,
} from "lucide-react";
import axios from "axios";
import { format } from "date-fns";

// Types
interface VideoShort {
  title: string;
  download_url: string;
  created_at: string;
  virality_score?: number;
  captions?: {
    tiktok: string;
    youtube: string;
    linkedin: string;
    instagram: string;
  };
}

interface UserShortsResponse {
  _id: string;
  userid: string;
  createdAt: string;
  shorts: VideoShort[];
  updatedAt: string;
}

// Video Card Component
const VideoCard: React.FC<{
  video: VideoShort;
  onClick: () => void;
}> = ({ video, onClick }) => {
  const [thumbnailError, setThumbnailError] = useState(false);

  // Extract thumbnail by using video element
  const videoThumbnail = (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {!thumbnailError ? (
        <video
          src={video.download_url}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
          onError={() => setThumbnailError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <Film className="w-12 h-12 text-gray-600" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
  );

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer group"
    >
      <div className="relative aspect-[9/16] mb-3 rounded-xl overflow-hidden shadow-lg">
        {videoThumbnail}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
            <Film className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Virality Score Badge */}
        {video.virality_score && (
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-[#D68CB8]" />
            <span className="text-sm font-semibold">
              {video.virality_score}%
            </span>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="space-y-2">
        <h3 className="font-semibold text-white line-clamp-2 group-hover:text-[#D68CB8] transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>
            {format(new Date(video.created_at), "MMM d, yyyy 'at' h:mm a")}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Video Modal Component (Similar to VideoResultModal)
const VideoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  video: VideoShort | null;
}> = ({ isOpen, onClose, video }) => {
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [isYouTubeConnected, setIsYouTubeConnected] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  // Check YouTube connection status on mount
  useEffect(() => {
    checkYouTubeConnection();
  }, []);

  const checkYouTubeConnection = async () => {
    try {
      const response = await axios.get("/api/youtube/status", {
        withCredentials: true,
      });
      setIsYouTubeConnected(response.data.connected);
    } catch (error) {
      console.error("Error checking YouTube connection:", error);
    }
  };

  const handleYouTubeLogin = async () => {
    try {
      const response = await axios.get("/api/youtube/auth-url", {
        withCredentials: true,
      });

      if (response.data.authUrl) {
        // Open YouTube OAuth in a popup window
        const width = 500;
        const height = 600;
        const left = window.innerWidth / 2 - width / 2;
        const top = window.innerHeight / 2 - height / 2;

        const popup = window.open(
          response.data.authUrl,
          "youtube-auth",
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Check if popup was closed and refresh connection status
        const checkPopup = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkPopup);
            checkYouTubeConnection();
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error getting YouTube auth URL:", error);
    }
  };

  const handleYouTubeUpload = async () => {
    if (!video || !isYouTubeConnected) return;

    setIsUploading(true);
    setUploadStatus("Preparing upload...");

    try {
      // First, download the video from the URL
      setUploadStatus("Downloading video...");
      const videoResponse = await fetch(video.download_url);
      const videoBlob = await videoResponse.blob();

      // Create FormData with video file and metadata
      const formData = new FormData();
      const videoFile = new File(
        [videoBlob],
        `${video.title.replace(/[^a-z0-9]/gi, "_")}.mp4`,
        {
          type: "video/mp4",
        }
      );

      formData.append("video", videoFile);
      formData.append("title", video.title);

      // Use YouTube caption if available, otherwise use a default
      const description =
        video.captions?.youtube ||
        `Check out this viral short! Created with our AI-powered video editor.\n\n#shorts #viral`;
      formData.append("description", description);

      // Add tags based on the title
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
            setUploadStatus(`Uploading to YouTube... ${progress}%`);
          }
        },
      });

      if (response.data.success) {
        setUploadStatus("Upload successful! 🎉");

        // Open the uploaded video in a new tab after 2 seconds
        setTimeout(() => {
          if (response.data.videoUrl) {
            window.open(response.data.videoUrl, "_blank");
          }
          setUploadStatus("");
          setIsUploading(false);
        }, 2000);
      } else {
        throw new Error(response.data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading to YouTube:", error);
      setUploadStatus("Upload failed. Please try again.");
      setTimeout(() => {
        setUploadStatus("");
        setIsUploading(false);
      }, 3000);
    }
  };

  const handleCopyCaption = (platform: string, caption: string) => {
    navigator.clipboard.writeText(caption);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  const getViralityColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-orange-400";
  };

  const platformIcons = {
    tiktok: "🎵",
    youtube: "📺",
    linkedin: "💼",
    instagram: "📸",
  };

  const handleDownload = async () => {
    if (!video) return;

    try {
      const response = await fetch(video.download_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${video.title
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && video && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#2A2A2A] rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold">Your Clip</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex flex-col lg:flex-row">
              {/* Video Preview - Left Side */}
              <div className="lg:w-1/2 p-6 bg-black/20">
                <div className="aspect-[9/16] max-h-[600px] mx-auto rounded-xl overflow-hidden bg-black">
                  <video
                    src={video.download_url}
                    controls
                    className="w-full h-full object-contain"
                    autoPlay
                    loop
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>

              {/* Info Panel - Right Side */}
              <div className="lg:w-1/2 p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Title */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-300">
                    Title
                  </h3>
                  <p className="text-white text-xl">{video.title}</p>
                </div>

                {/* Created Date */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-300">
                    Created
                  </h3>
                  <p className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#D68CB8]" />
                    {format(
                      new Date(video.created_at),
                      "MMMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                </div>

                {/* Virality Score - Only show if available */}
                {video.virality_score && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-300">
                      Virality Score
                    </h3>
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-6 h-6 text-[#D68CB8]" />
                      <span
                        className={`text-3xl font-bold ${getViralityColor(
                          video.virality_score
                        )}`}
                      >
                        {video.virality_score}%
                      </span>
                      <span className="text-gray-400">
                        {video.virality_score >= 80
                          ? "Excellent potential!"
                          : video.virality_score >= 60
                          ? "Good potential"
                          : "Moderate potential"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Captions - Only show if available */}
                {video.captions && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-300">
                      Platform Captions
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(video.captions).map(
                        ([platform, caption]) => (
                          <div
                            key={platform}
                            className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium capitalize flex items-center gap-2">
                                <span className="text-xl">
                                  {
                                    platformIcons[
                                      platform as keyof typeof platformIcons
                                    ]
                                  }
                                </span>
                                {platform}
                              </span>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  handleCopyCaption(platform, caption)
                                }
                                className="text-[#D68CB8] hover:text-pink-400 transition-colors flex items-center gap-1"
                              >
                                {copiedPlatform === platform ? (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-sm">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4" />
                                    <span className="text-sm">Copy</span>
                                  </>
                                )}
                              </motion.button>
                            </div>
                            <p className="text-sm text-gray-300 line-clamp-2">
                              {caption}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Download Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-[#D68CB8] to-pink-500 hover:shadow-lg hover:shadow-pink-500/25 rounded-xl font-semibold transition-all duration-300"
                >
                  <Download className="w-5 h-5" />
                  Download Video
                </motion.button>

                {/* YouTube Upload Section */}
                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-300 flex items-center gap-2">
                    <span className="text-2xl">📺</span>
                    Upload to YouTube
                  </h3>

                  {!isYouTubeConnected ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleYouTubeLogin}
                      className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-all duration-300"
                    >
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      Connect YouTube Account
                    </motion.button>
                  ) : (
                    <div className="space-y-4">
                      {/* Upload Preview */}
                      <div className="bg-white/5 rounded-lg p-4 space-y-3">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Title</p>
                          <p className="text-white">{video.title}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">
                            Description
                          </p>
                          <p className="text-gray-300 text-sm line-clamp-3">
                            {video.captions?.youtube ||
                              "Check out this viral short! Created with our AI-powered video editor.\n\n#shorts #viral"}
                          </p>
                        </div>
                      </div>

                      {/* Upload Button */}
                      <motion.button
                        whileHover={{ scale: isUploading ? 1 : 1.02 }}
                        whileTap={{ scale: isUploading ? 1 : 0.98 }}
                        onClick={handleYouTubeUpload}
                        disabled={isUploading}
                        className={`flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                          isUploading
                            ? "bg-gray-600 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {uploadStatus}
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                            Upload to YouTube
                          </>
                        )}
                      </motion.button>

                      {/* Disconnect Option */}
                      <button
                        onClick={() => setIsYouTubeConnected(false)}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        Disconnect YouTube Account
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Main Page Component
export default function YourClipsPage() {
  const [shorts, setShorts] = useState<VideoShort[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoShort | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchUserShorts();
  }, []);

  const fetchUserShorts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<UserShortsResponse>("/api/user-shorts", {
        withCredentials: true,
      });

      if (response.data?.shorts) {
        // Sort by created_at date, newest first
        const sortedShorts = [...response.data.shorts].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setShorts(sortedShorts);
      }
    } catch (error) {
      console.error("Error fetching user shorts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoClick = (video: VideoShort) => {
    setSelectedVideo(video);
    setShowModal(true);
  };

  return (
    <>
      <VideoModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedVideo(null);
        }}
        video={selectedVideo}
      />

      <div className="min-h-screen bg-[#1D1D1D] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Your Clips</h1>
            <p className="text-gray-400">
              All your generated viral shorts in one place
            </p>
          </motion.div>

          {/* Content */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#D68CB8] mx-auto mb-4" />
                <p className="text-gray-400">Loading your clips...</p>
              </div>
            </div>
          ) : shorts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-64 text-center"
            >
              <Film className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Clips Yet</h3>
              <p className="text-gray-400 max-w-md">
                Start creating viral shorts and they'll appear here. Your video
                history is waiting to be filled!
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            >
              {shorts.map((video, index) => (
                <motion.div
                  key={`${video.created_at}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <VideoCard
                    video={video}
                    onClick={() => handleVideoClick(video)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
