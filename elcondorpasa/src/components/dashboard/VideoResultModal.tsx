import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  TrendingUp,
  Copy,
  CheckCircle,
  Clock,
  Youtube,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import DownloadButton from "@/components/DownloadButton";
import { useYouTubeIntegration } from "@/hooks/useYouTubeIntegration";

interface VideoResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoData: {
    title: string;
    virality_score: number;
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

export const VideoResultModal: React.FC<VideoResultModalProps> = ({
  isOpen,
  onClose,
  videoData,
}) => {
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const router = useRouter();

  // YouTube integration
  const {
    isConnected: isYouTubeConnected,
    isUploading,
    uploadStatus,
    handleLogin: handleYouTubeLogin,
    handleUpload: handleYouTubeUpload,
  } = useYouTubeIntegration();

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

  const platformConfig = {
    tiktok: { icon: "🎵", color: "from-pink-500 to-red-500" },
    youtube: { icon: "📺", color: "from-red-500 to-red-600" },
    linkedin: { icon: "💼", color: "from-blue-600 to-blue-700" },
    instagram: { icon: "📸", color: "from-purple-500 to-pink-500" },
  };

  const handleUpload = () => {
    if (videoData) {
      // Convert to VideoShort format expected by YouTube integration
      const videoShort = {
        title: videoData.title,
        download_url: videoData.download_url,
        created_at: videoData.created_at || new Date().toISOString(),
        virality_score: videoData.virality_score,
        captions: videoData.captions,
      };
      handleYouTubeUpload(videoShort);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && videoData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
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
                  Your Clip is Ready! 🎉
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
              {/* Video Preview - Left Side */}
              <div className="lg:w-1/2 p-6 lg:p-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="aspect-[9/16] max-h-[600px] mx-auto rounded-2xl overflow-hidden shadow-2xl"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <video
                    src={videoData.download_url}
                    controls
                    className="w-full h-full object-contain"
                    autoPlay
                    loop
                  >
                    Your browser does not support the video tag.
                  </video>
                </motion.div>
              </div>

              {/* Info Panel - Right Side */}
              <div className="lg:w-1/2 p-6 lg:p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-sm font-semibold mb-2 text-gray-300 uppercase tracking-wider">
                    Title
                  </h3>
                  <p className="text-white text-2xl font-bold">
                    {videoData.title}
                  </p>
                </motion.div>

                {/* Virality Score */}
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
                  <h3 className="text-sm font-semibold mb-3 text-gray-300 uppercase tracking-wider">
                    Virality Score
                  </h3>
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <TrendingUp className="w-6 h-6 text-pink-400" />
                    </motion.div>
                    <span
                      className={`text-3xl font-bold ${getViralityColor(
                        videoData.virality_score
                      )}`}
                    >
                      {videoData.virality_score}%
                    </span>
                    <span className="text-gray-400">
                      {videoData.virality_score >= 80
                        ? "Excellent potential!"
                        : videoData.virality_score >= 60
                        ? "Good potential"
                        : "Moderate potential"}
                    </span>
                  </div>
                </motion.div>

                {/* Captions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">
                    Platform Captions
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(videoData.captions).map(
                      ([platform, caption], index) => (
                        <motion.div
                          key={platform}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className="rounded-xl p-4 transition-all duration-300 cursor-pointer group"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            backdropFilter: "blur(10px)",
                            WebkitBackdropFilter: "blur(10px)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                          }}
                          onClick={() => handleCopyCaption(platform, caption)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(255, 255, 255, 0.1)";
                            e.currentTarget.style.borderColor =
                              "rgba(255, 255, 255, 0.2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(255, 255, 255, 0.05)";
                            e.currentTarget.style.borderColor =
                              "rgba(255, 255, 255, 0.1)";
                          }}
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
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              className="text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {copiedPlatform === platform ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <Copy className="w-5 h-5" />
                              )}
                            </motion.div>
                          </div>
                          <p className="text-sm text-gray-300 line-clamp-2">
                            {caption}
                          </p>
                        </motion.div>
                      )
                    )}
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-3"
                >
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
                        style={{
                          width: "100%",
                          padding: "16px 24px",
                          background:
                            "linear-gradient(to right, #ec4899, #a855f7)",
                          color: "white",
                          borderRadius: "16px",
                          fontWeight: "600",
                          fontSize: "16px",
                          border: "none",
                          cursor: "pointer",
                          transition: "all 0.3s",
                          boxShadow: "0 10px 30px rgba(236, 72, 153, 0.3)",
                        }}
                        onStart={() => console.log("Download started")}
                        onSuccess={() => console.log("Download completed")}
                        onError={(error) =>
                          console.error("Download error:", error)
                        }
                        className="hover:shadow-lg hover:shadow-pink-500/40 transform hover:-translate-y-0.5"
                        onMouseEnter={(e: any) => {
                          e.currentTarget.style.boxShadow =
                            "0 15px 40px rgba(236, 72, 153, 0.4)";
                        }}
                        onMouseLeave={(e: any) => {
                          e.currentTarget.style.boxShadow =
                            "0 10px 30px rgba(236, 72, 153, 0.3)";
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "12px",
                          }}
                        >
                          <Download style={{ width: "20px", height: "20px" }} />
                          <span className="hidden sm:inline">
                            Download Video
                          </span>
                          <span className="sm:hidden">Download</span>
                        </div>
                      </DownloadButton>
                    </div>

                    {/* YouTube Upload Section */}
                    <div className="flex-1">
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
                          <span className="hidden sm:inline">
                            Connect YouTube
                          </span>
                          <span className="sm:hidden">YouTube</span>
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
                              <span className="hidden sm:inline">
                                {uploadStatus}
                              </span>
                              <span className="sm:hidden">Uploading</span>
                            </>
                          ) : (
                            <>
                              <Youtube className="w-5 h-5" />
                              <span className="hidden sm:inline">
                                Upload to YouTube
                              </span>
                              <span className="sm:hidden">Upload</span>
                            </>
                          )}
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Recent Clips Button - Full Width Below */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onClose();
                      router.push("/your-clip");
                    }}
                    className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-300 text-white"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(255, 255, 255, 0.15)";
                      e.currentTarget.style.borderColor =
                        "rgba(255, 255, 255, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.borderColor =
                        "rgba(255, 255, 255, 0.1)";
                    }}
                  >
                    <Clock className="w-5 h-5" />
                    View Recent Clips
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
