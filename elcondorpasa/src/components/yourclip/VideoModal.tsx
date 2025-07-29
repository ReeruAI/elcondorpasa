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
import { VideoShort, PlatformType } from "@/types"; // Adjust the import path as necessary
import { ANIMATION_VARIANTS } from "@/constants"; // Adjust the import path as necessary
import { downloadVideo, copyToClipboard } from "@/utils/yourclip"; // Adjust the import path as necessary
import { useYouTubeIntegration } from "@/hooks/useYouTubeIntegration"; // Adjust the import path as necessary
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
          className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 overflow-y-auto"
          onClick={onClose}
        >
          <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
              {...ANIMATION_VARIANTS.scale}
              className="bg-gradient-to-b from-gray-900 to-black rounded-3xl max-w-6xl w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 lg:p-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl lg:text-2xl font-semibold text-white">
                    Your Creation
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="flex flex-col lg:flex-row">
                {/* Video Player */}
                <div className="lg:w-1/2 p-6 lg:p-8 lg:pr-4">
                  <div className="aspect-[9/16] max-h-[70vh] lg:max-h-[600px] mx-auto rounded-2xl overflow-hidden bg-black shadow-2xl">
                    <video
                      src={video.download_url}
                      controls
                      className="w-full h-full object-contain"
                      autoPlay
                      loop
                      playsInline
                    />
                  </div>
                </div>

                {/* Info Panel */}
                <div className="lg:w-1/2 p-6 lg:p-8 lg:pl-4 space-y-6">
                  {/* Title */}
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {format(
                          new Date(video.created_at),
                          "MMMM d, yyyy 'at' h:mm a"
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Virality Score */}
                  {video.virality_score && (
                    <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-2xl p-4 border border-pink-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Virality Score</span>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-pink-400" />
                          <span className="text-2xl font-bold text-white">
                            {video.virality_score}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Platform Captions */}
                  {video.captions && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                        Platform Captions
                      </h4>
                      <div className="grid gap-3">
                        {Object.entries(video.captions).map(
                          ([platform, caption]) => (
                            <PlatformCaption
                              key={platform}
                              platform={platform as PlatformType}
                              caption={caption}
                              onCopy={() =>
                                handleCopyCaption(platform, caption)
                              }
                              isCopied={copiedPlatform === platform}
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    {/* Download Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDownload}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-4 px-6 rounded-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-pink-500/25 transition-all"
                    >
                      <Download className="w-5 h-5" />
                      Download Video
                    </motion.button>

                    {/* YouTube Upload Section */}
                    {!isYouTubeConnected ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleYouTubeLogin}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-4 px-6 rounded-xl flex items-center justify-center gap-3 shadow-lg transition-all"
                      >
                        <Youtube className="w-5 h-5" />
                        Connect YouTube
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: isUploading ? 1 : 1.02 }}
                        whileTap={{ scale: isUploading ? 1 : 0.98 }}
                        onClick={handleUpload}
                        disabled={isUploading}
                        className={`w-full font-medium py-4 px-6 rounded-xl flex items-center justify-center gap-3 shadow-lg transition-all ${
                          isUploading
                            ? "bg-gray-700 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700 text-white"
                        }`}
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
                  </div>
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
