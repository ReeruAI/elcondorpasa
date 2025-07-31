import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  TrendingUp,
  Copy,
  CheckCircle,
  Youtube,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import DownloadButton from "@/components/DownloadButton";
import { useYouTubeIntegration } from "@/hooks/useYouTubeIntegration";

interface VideoResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoData: {
    title: string;
    virality_score: number;
    description: string;
    captions: {
      tiktok: string;
      youtube: string;
      linkedin: string;
      instagram: string;
    };
    download_url: string;
    created_at?: string;
  } | null;
}

const platformConfig = {
  tiktok: { icon: "🎵", color: "from-pink-500 to-red-500" },
  youtube: { icon: "📺", color: "from-red-500 to-red-600" },
  linkedin: { icon: "💼", color: "from-blue-600 to-blue-700" },
  instagram: { icon: "📸", color: "from-purple-500 to-pink-500" },
};

export const VideoResultModal: React.FC<VideoResultModalProps> = ({
  isOpen,
  onClose,
  videoData,
}) => {
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const router = useRouter();

  const {
    isConnected: isYouTubeConnected,
    isUploading,
    handleLogin: handleYouTubeLogin,
    handleUpload: handleYouTubeUpload,
  } = useYouTubeIntegration();

  const handleCopyCaption = useCallback((platform: string, caption: string) => {
    navigator.clipboard.writeText(caption);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
  }, []);

  const viralityInfo = useMemo(() => {
    if (!videoData) return { color: "", text: "" };
    const score = videoData.virality_score;
    if (score >= 80)
      return { color: "text-green-400", text: "Excellent potential!" };
    if (score >= 60)
      return { color: "text-yellow-400", text: "Good potential" };
    return { color: "text-orange-400", text: "Moderate potential" };
  }, [videoData?.virality_score]);

  const handleUpload = useCallback(() => {
    if (videoData) {
      const videoShort = {
        title: videoData.title,
        download_url: videoData.download_url,
        created_at: videoData.created_at || new Date().toISOString(),
        virality_score: videoData.virality_score,
        captions: videoData.captions,
      };
      handleYouTubeUpload(videoShort);
    }
  }, [videoData, handleYouTubeUpload]);

  // const handleViewRecentClips = useCallback(() => {
  //   onClose();
  //   router.push("/your-clip");
  // }, [onClose, router]);

  if (!videoData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl modal-glass-bg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 lg:p-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg sparkle-shadow">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white">
                  Your Clip is Ready! 🎉
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
              {/* Video Preview - Left Side */}
              <div className="lg:w-1/2 p-6 lg:p-8">
                <div className="aspect-[9/16] max-h-[600px] mx-auto rounded-2xl overflow-hidden shadow-2xl video-container">
                  <video
                    src={videoData.download_url}
                    controls
                    className="w-full h-full object-contain"
                    autoPlay
                    loop
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>

                {/* Video Description */}
                <div className="mt-4 p-4 rounded-xl glass-panel">
                  <h3 className="text-sm font-semibold mb-2 text-gray-300 uppercase tracking-wider">
                    Description
                  </h3>
                  <p className="text-gray-200 text-sm leading-relaxed">
                    {videoData.description}
                  </p>
                </div>
              </div>

              {/* Info Panel - Right Side */}
              <div className="lg:w-1/2 p-6 lg:p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Title */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-300 uppercase tracking-wider">
                    Title
                  </h3>
                  <p className="text-white text-2xl font-bold">
                    {videoData.title}
                  </p>
                </div>

                {/* Virality Score */}
                <div className="rounded-2xl p-5 virality-card">
                  <h3 className="text-sm font-semibold mb-3 text-gray-300 uppercase tracking-wider">
                    Virality Score
                  </h3>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-pink-400 trending-icon" />
                    <span
                      className={`text-3xl font-bold ${viralityInfo.color}`}
                    >
                      {videoData.virality_score}%
                    </span>
                    <span className="text-gray-400">{viralityInfo.text}</span>
                  </div>
                </div>

                {/* Captions */}
                <div>
                  <h3 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">
                    Platform Captions
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(videoData.captions).map(
                      ([platform, caption]) => (
                        <div
                          key={platform}
                          className="rounded-xl p-4 cursor-pointer group caption-card"
                          onClick={() => handleCopyCaption(platform, caption)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium capitalize flex items-center gap-2 text-white">
                              <span className="text-xl">
                                {
                                  platformConfig[
                                    platform as keyof typeof platformConfig
                                  ]?.icon
                                }
                              </span>
                              {platform}
                            </span>
                            <div className="text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              {copiedPlatform === platform ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <Copy className="w-5 h-5" />
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-300 line-clamp-2">
                            {caption}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Download and YouTube Buttons - Side by Side */}
                  <div className="flex gap-3">
                    {/* Download Button */}
                    <div className="flex-1">
                      <DownloadButton
                        url={videoData.download_url}
                        filename={`${videoData.title
                          .replace(/[^a-z0-9]/gi, "_")
                          .toLowerCase()}.mp4`}
                        downloadMethod="direct"
                        showProgress={false}
                        className="download-button"
                      >
                        <div className="flex items-center justify-center gap-3">
                          <Download className="w-5 h-5" />
                          <span>Download</span>
                        </div>
                      </DownloadButton>
                    </div>

                    {/* YouTube Upload Section */}
                    <div className="flex-1">
                      {!isYouTubeConnected ? (
                        <button
                          onClick={handleYouTubeLogin}
                          className="w-full h-14 font-semibold px-6 rounded-2xl flex items-center justify-center gap-3 youtube-button hover:bg-red-700 transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                          <Youtube className="w-5 h-5" />
                          <span>Connect</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleUpload}
                          disabled={isUploading}
                          className={`w-full h-14 font-semibold px-6 rounded-2xl flex items-center justify-center gap-3 transform transition-all duration-200 ${
                            isUploading
                              ? "cursor-not-allowed opacity-70 bg-gray-600 text-white"
                              : "youtube-button hover:bg-red-700 hover:-translate-y-0.5 text-white"
                          }`}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Uploading</span>
                            </>
                          ) : (
                            <>
                              <Youtube className="w-5 h-5" />
                              <span>Upload</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Recent Clips Button - Full Width Below */}
                  {/* <button
                    onClick={handleViewRecentClips}
                    className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl font-semibold glass-button hover:bg-white/15 transform hover:-translate-y-0.5 transition-all duration-200 text-white"
                  >
                    <Clock className="w-5 h-5" />
                    View Recent Clips
                  </button> */}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
