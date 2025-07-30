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
              className="rounded-3xl max-w-6xl w-full shadow-2xl modal-glass-bg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 lg:p-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg sparkle-shadow">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-white">
                    Your Creation
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center glass-button hover:bg-white/20"
                >
                  <X className="w-6 h-6 text-gray-300" />
                </button>
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-gradient-divider" />

              {/* Content */}
              <div className="flex flex-col lg:flex-row">
                {/* Video Player */}
                <div className="lg:w-1/2 p-6 lg:p-8 lg:pr-4">
                  <div className="aspect-[9/16] max-h-[70vh] lg:max-h-[600px] mx-auto rounded-2xl overflow-hidden shadow-2xl video-container">
                    <video
                      src={video.download_url}
                      controls
                      className="w-full h-full object-contain"
                      autoPlay
                      loop
                      playsInline
                    />
                  </div>
                  {/* Video Description */}
                  <div className="mt-4 p-4 rounded-xl glass-panel">
                    <h3 className="text-sm font-semibold mb-2 text-gray-300 uppercase tracking-wider">
                      Description
                    </h3>
                    <p className="text-gray-200 text-sm leading-relaxed">
                      {video.description}
                    </p>
                  </div>
                </div>

                {/* Info Panel */}
                <div className="lg:w-1/2 p-6 lg:p-8 lg:pl-4 space-y-6">
                  {/* Title */}
                  <div>
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
                  </div>

                  {/* Virality Score */}
                  {video.virality_score && (
                    <div className="rounded-2xl p-5 virality-card">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-200 font-medium">
                          Virality Score
                        </span>
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-6 h-6 text-pink-400 trending-icon" />
                          <span className="text-3xl font-bold text-white">
                            {video.virality_score}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Platform Captions */}
                  {video.captions && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
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
                    <button
                      onClick={handleDownload}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <Download className="w-5 h-5" />
                      Download Video
                    </button>

                    {/* YouTube Upload Section */}
                    {!isYouTubeConnected ? (
                      <button
                        onClick={handleYouTubeLogin}
                        className="w-full font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 text-white youtube-button hover:bg-red-700 transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <Youtube className="w-5 h-5" />
                        Connect YouTube
                      </button>
                    ) : (
                      <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className={`w-full font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 text-white transform transition-all duration-200 ${
                          isUploading
                            ? "cursor-not-allowed opacity-70 bg-gray-600"
                            : "youtube-button hover:bg-red-700 hover:-translate-y-0.5"
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
                      </button>
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
