// components/VideoModal.tsx
import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Download,
  TrendingUp,
  Youtube,
  Loader2,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { VideoShort, PlatformType } from "@/types";
import { ANIMATION_VARIANTS } from "@/constants";
import { downloadVideo, copyToClipboard } from "@/utils/yourclip";
import { useYouTubeIntegration } from "@/hooks/useYouTubeIntegration";
import PlatformCaption from "./PlatformCaption";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoShort | null;
}

const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, video }) => {
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const {
    isConnected: isYouTubeConnected,
    isUploading,
    uploadStatus,
    handleLogin: handleYouTubeLogin,
    handleUpload: handleYouTubeUpload,
  } = useYouTubeIntegration();

  const handleCopyCaption = useCallback(
    async (platform: string, caption: string) => {
      await copyToClipboard(caption);
      setCopiedPlatform(platform);
      setTimeout(() => setCopiedPlatform(null), 2000);
    },
    []
  );

  const handleDownload = useCallback(async () => {
    if (!video) return;
    try {
      await downloadVideo(video);
    } catch (error) {
      console.error("Download failed:", error);
    }
  }, [video]);

  const handleUpload = useCallback(() => {
    if (video) {
      handleYouTubeUpload(video);
    }
  }, [video, handleYouTubeUpload]);

  if (!video) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          {...ANIMATION_VARIANTS.fadeIn}
          className="fixed inset-0 bg-black/70 backdrop-blur-xl z-50 overflow-y-auto"
          onClick={onClose}
        >
          <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
              {...ANIMATION_VARIANTS.scale}
              className="rounded-3xl max-w-6xl w-full shadow-2xl"
              style={{
                backgroundColor: "rgba(31, 31, 31, 0.4)",
                backdropFilter: "blur(30px)",
                WebkitBackdropFilter: "blur(30px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 lg:p-8">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{
                      boxShadow: "0 8px 20px rgba(236, 72, 153, 0.3)",
                    }}
                  >
                    <Sparkles className="w-6 h-6 text-white" />
                  </motion.div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-white">
                    Your Creation
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.1)";
                  }}
                >
                  <X className="w-6 h-6 text-gray-300" />
                </motion.button>
              </div>

              {/* Divider */}
              <div
                className="h-px w-full"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)",
                }}
              />

              {/* Content */}
              <div className="flex flex-col lg:flex-row">
                {/* Video Player */}
                <div className="lg:w-1/2 p-6 lg:p-8 lg:pr-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="aspect-[9/16] max-h-[70vh] lg:max-h-[600px] mx-auto rounded-2xl overflow-hidden shadow-2xl"
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <video
                      src={video.download_url}
                      controls
                      className="w-full h-full object-contain"
                      autoPlay
                      loop
                      playsInline
                    />
                  </motion.div>
                </div>

                {/* Info Panel */}
                <div className="lg:w-1/2 p-6 lg:p-8 lg:pl-4 space-y-6">
                  {/* Title */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-4 h-4 text-pink-400" />
                      <span className="text-sm">
                        {format(
                          new Date(video.created_at),
                          "MMMM d, yyyy 'at' h:mm a"
                        )}
                      </span>
                    </div>
                  </motion.div>

                  {/* Virality Score */}
                  {video.virality_score && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="rounded-2xl p-5"
                      style={{
                        backgroundColor: "rgba(236, 72, 153, 0.1)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        border: "1px solid rgba(236, 72, 153, 0.2)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-200 font-medium">
                          Virality Score
                        </span>
                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <TrendingUp className="w-6 h-6 text-pink-400" />
                          </motion.div>
                          <span className="text-3xl font-bold text-white">
                            {video.virality_score}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Platform Captions */}
                  {video.captions && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-4"
                    >
                      <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                        Platform Captions
                      </h4>
                      <div className="grid gap-3">
                        {Object.entries(video.captions).map(
                          ([platform, caption], index) => (
                            <motion.div
                              key={platform}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + index * 0.1 }}
                            >
                              <PlatformCaption
                                platform={platform as PlatformType}
                                caption={caption}
                                onCopy={() =>
                                  handleCopyCaption(platform, caption)
                                }
                                isCopied={copiedPlatform === platform}
                              />
                            </motion.div>
                          )
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-3 pt-4"
                  >
                    {/* Download Button */}
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDownload}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all duration-300"
                      style={{
                        boxShadow: "0 10px 30px rgba(236, 72, 153, 0.3)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 15px 40px rgba(236, 72, 153, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 10px 30px rgba(236, 72, 153, 0.3)";
                      }}
                    >
                      <Download className="w-5 h-5" />
                      Download Video
                    </motion.button>

                    {/* YouTube Upload Section */}
                    {!isYouTubeConnected ? (
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleYouTubeLogin}
                        className="w-full font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all duration-300 text-white"
                        style={{
                          backgroundColor: "rgba(220, 38, 38, 0.9)",
                          backdropFilter: "blur(10px)",
                          WebkitBackdropFilter: "blur(10px)",
                          border: "1px solid rgba(220, 38, 38, 0.3)",
                          boxShadow: "0 10px 30px rgba(220, 38, 38, 0.3)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgba(220, 38, 38, 1)";
                          e.currentTarget.style.boxShadow =
                            "0 15px 40px rgba(220, 38, 38, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgba(220, 38, 38, 0.9)";
                          e.currentTarget.style.boxShadow =
                            "0 10px 30px rgba(220, 38, 38, 0.3)";
                        }}
                      >
                        <Youtube className="w-5 h-5" />
                        Connect YouTube
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{
                          scale: isUploading ? 1 : 1.02,
                          y: isUploading ? 0 : -2,
                        }}
                        whileTap={{ scale: isUploading ? 1 : 0.98 }}
                        onClick={handleUpload}
                        disabled={isUploading}
                        className={`w-full font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all duration-300 text-white ${
                          isUploading ? "cursor-not-allowed opacity-70" : ""
                        }`}
                        style={{
                          backgroundColor: isUploading
                            ? "rgba(107, 114, 128, 0.5)"
                            : "rgba(220, 38, 38, 0.9)",
                          backdropFilter: "blur(10px)",
                          WebkitBackdropFilter: "blur(10px)",
                          border: isUploading
                            ? "1px solid rgba(107, 114, 128, 0.3)"
                            : "1px solid rgba(220, 38, 38, 0.3)",
                          boxShadow: isUploading
                            ? "none"
                            : "0 10px 30px rgba(220, 38, 38, 0.3)",
                        }}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {uploadStatus}
                          </>
                        ) : (
                          <>
                            <Youtube className="w-5 h-5" />
                            Upload to YouTube
                          </>
                        )}
                      </motion.button>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoModal;
