import { motion, AnimatePresence } from "framer-motion";
import { X, Download, TrendingUp, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";
import DownloadButton from "@/components/DownloadButton";

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
  } | null;
}

export const VideoResultModal: React.FC<VideoResultModalProps> = ({
  isOpen,
  onClose,
  videoData,
}) => {
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

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

  return (
    <AnimatePresence>
      {isOpen && videoData && (
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
              <h2 className="text-2xl font-bold">Your Clip is Ready! 🎉</h2>
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
                    src={videoData.download_url}
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
                  <p className="text-white text-xl">{videoData.title}</p>
                </div>

                {/* Virality Score */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-300">
                    Virality Score
                  </h3>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-[#D68CB8]" />
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
                </div>

                {/* Captions */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-300">
                    Platform Captions
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(videoData.captions).map(
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

                {/* Download Button */}
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
                    background: "linear-gradient(to right, #D68CB8, #ec4899)",
                    color: "white",
                    borderRadius: "12px",
                    fontWeight: "600",
                    fontSize: "16px",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    boxShadow: "0 0 0 rgba(236, 72, 153, 0)",
                  }}
                  onStart={() => console.log("Download started")}
                  onSuccess={() => console.log("Download completed")}
                  onError={(error) => console.error("Download error:", error)}
                  className="hover:shadow-lg hover:shadow-pink-500/25"
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
                    Download Video
                  </div>
                </DownloadButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
