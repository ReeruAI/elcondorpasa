"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Link,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Play,
  Zap,
  X,
  ExternalLink,
  TrendingUp,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { ModalProps, TrendingVideo } from "@/types";

// Mock data for trending videos
const MOCK_TRENDING_VIDEOS: TrendingVideo[] = [
  {
    id: "1",
    title: "10 Mind-Blowing AI Tools You Need to Try in 2025",
    thumbnail: "https://placehold.co/320x180",
    description:
      "Discover the latest AI tools that are revolutionizing content creation and productivity in 2025.",
    url: "https://youtube.com/watch?v=example1",
    views: "2.3M",
    duration: "12:45",
    channel: "Tech Insider",
  },
  {
    id: "2",
    title: "The Ultimate Morning Routine for Success",
    thumbnail: "https://placehold.co/320x180",
    description:
      "Transform your mornings with this science-backed routine used by top performers.",
    url: "https://youtube.com/watch?v=example2",
    views: "1.8M",
    duration: "8:32",
    channel: "Productivity Pro",
  },
  {
    id: "3",
    title: "How to Start a Faceless YouTube Channel in 2025",
    thumbnail: "https://placehold.co/320x180",
    description:
      "Complete guide to creating a successful faceless YouTube channel from scratch.",
    url: "https://youtube.com/watch?v=example3",
    views: "3.1M",
    duration: "15:20",
    channel: "Creator Academy",
  },
  {
    id: "4",
    title: "Top 5 Investment Strategies for Beginners",
    thumbnail: "https://placehold.co/320x180",
    description:
      "Learn the fundamental investment strategies that every beginner should know.",
    url: "https://youtube.com/watch?v=example4",
    views: "1.2M",
    duration: "10:15",
    channel: "Finance Freedom",
  },
  {
    id: "5",
    title: "The Science of Going Viral on Social Media",
    thumbnail: "https://placehold.co/320x180",
    description:
      "Understanding the psychology and algorithms behind viral content.",
    url: "https://youtube.com/watch?v=example5",
    views: "2.7M",
    duration: "13:48",
    channel: "Social Media Lab",
  },
];

// Loading Modal Component
const LoadingModal: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#2A2A2A] rounded-2xl p-8 max-w-sm w-full mx-4 text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-6"
          >
            <Sparkles className="w-full h-full text-[#D68CB8]" />
          </motion.div>
          <h3 className="text-2xl font-bold mb-2">Creating Your Clips</h3>
          <p className="text-gray-400 mb-6">
            Our AI is analyzing the video and generating amazing shorts...
          </p>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#D68CB8]" />
            <span className="text-sm text-gray-300">
              This may take up to 60 seconds
            </span>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Video Options Modal
const VideoOptionsModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  video,
  onGenerateClip,
}) => (
  <AnimatePresence>
    {isOpen && video && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-[#2A2A2A] rounded-2xl p-6 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold pr-4">{video.title}</h3>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          <p className="text-sm text-gray-400 mb-6">{video.channel}</p>

          <div className="space-y-3">
            <motion.a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300"
            >
              <ExternalLink className="w-5 h-5" />
              <span className="font-medium">View on YouTube</span>
            </motion.a>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onGenerateClip(video.url);
                onClose();
              }}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-gradient-to-r from-[#D68CB8] to-pink-400 hover:shadow-lg hover:shadow-pink-500/25 rounded-xl transition-all duration-300 font-medium"
            >
              <Zap className="w-5 h-5" />
              <span>Generate Clips</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Video Card Component
const VideoCard: React.FC<{
  video: TrendingVideo;
  onClick: () => void;
}> = ({ video, onClick }) => (
  <motion.div
    whileHover={{ y: -5 }}
    onClick={onClick}
    className="flex-shrink-0 w-80 cursor-pointer group"
  >
    <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
      <img
        src={video.thumbnail}
        alt={video.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 rounded text-xs">
        {video.duration}
      </div>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1, opacity: 1 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="bg-[#D68CB8] rounded-full p-3">
          <Play className="w-6 h-6 text-white ml-0.5" />
        </div>
      </motion.div>
    </div>

    <div className="px-1">
      <h3 className="font-semibold text-white line-clamp-2 mb-2 group-hover:text-[#D68CB8] transition-colors">
        {video.title}
      </h3>
      <p className="text-sm text-gray-400 line-clamp-2 mb-3">
        {video.description}
      </p>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {video.views} views
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {video.duration}
        </span>
      </div>
    </div>
  </motion.div>
);

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<TrendingVideo | null>(
    null
  );
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [trendingVideos, setTrendingVideos] =
    useState<TrendingVideo[]>(MOCK_TRENDING_VIDEOS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const router = useRouter();
  const sliderRef = useRef<HTMLDivElement>(null);

  // Load trending videos (mock implementation)
  useEffect(() => {
    // In a real implementation, this would fetch from your backend
    setTrendingVideos(MOCK_TRENDING_VIDEOS);
  }, []);

  const handleSubmitUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setShowLoadingModal(true);

    try {
      // Replace with your actual API endpoint
      await axios.post("/api/generate-clips", { url });

      // Simulate processing time
      setTimeout(() => {
        router.push("/clips"); // Redirect to clips page or wherever you want
      }, 2000);
    } catch (error) {
      console.error("Error generating clips:", error);
      setShowLoadingModal(false);
      // Handle error - show toast or error message
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateClip = async (videoUrl: string) => {
    setShowLoadingModal(true);

    try {
      await axios.post("/api/generate-clips", { url: videoUrl });
      setTimeout(() => {
        router.push("/clips");
      }, 2000);
    } catch (error) {
      console.error("Error generating clips:", error);
      setShowLoadingModal(false);
    }
  };

  const handleRefreshRecommendations = async () => {
    setIsRefreshing(true);

    try {
      // Replace with your actual API endpoint to get new recommendations
      const response = await axios.get("/api/trending-videos");

      // For demo purposes, we'll simulate an API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In real implementation, you would use: setTrendingVideos(response.data);
      // For now, we'll shuffle the existing videos to simulate new recommendations
      const shuffled = [...MOCK_TRENDING_VIDEOS].sort(
        () => Math.random() - 0.5
      );
      setTrendingVideos(shuffled);
    } catch (error) {
      console.error("Error refreshing recommendations:", error);
      // Handle error - show toast or error message
    } finally {
      setIsRefreshing(false);
    }
  };

  const scrollSlider = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const scrollAmount = 340; // Card width + gap
      const scrollLeft = sliderRef.current.scrollLeft;
      const targetScroll =
        direction === "left"
          ? scrollLeft - scrollAmount
          : scrollLeft + scrollAmount;

      sliderRef.current.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <LoadingModal isOpen={showLoadingModal} />
      <VideoOptionsModal
        isOpen={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        video={selectedVideo}
        onGenerateClip={handleGenerateClip}
      />

      <div className="min-h-screen bg-[#1D1D1D] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-400">Create viral shorts in seconds</p>
          </motion.div>

          {/* URL Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#2A2A2A] rounded-2xl p-6 sm:p-8 mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <Link className="w-6 h-6 text-[#D68CB8]" />
              <h2 className="text-xl sm:text-2xl font-semibold">
                Generate from YouTube URL
              </h2>
            </div>

            <form onSubmit={handleSubmitUrl} className="space-y-4">
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste YouTube URL here..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D68CB8] focus:border-transparent transition-all duration-300"
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#D68CB8] to-pink-400 rounded-xl font-semibold hover:shadow-lg hover:shadow-pink-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Generate Clips
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Trending Videos Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-[#D68CB8]" />
                <h2 className="text-xl sm:text-2xl font-semibold">
                  AI-Recommended Trending Videos
                </h2>
              </div>

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleRefreshRecommendations}
                  disabled={isRefreshing}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh recommendations"
                >
                  <RefreshCw
                    className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => scrollSlider("left")}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => scrollSlider("right")}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            <div className="relative">
              <div
                ref={sliderRef}
                className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {trendingVideos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <VideoCard
                      video={video}
                      onClick={() => {
                        setSelectedVideo(video);
                        setShowOptionsModal(true);
                      }}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Gradient fade edges */}
              {/* <div className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-[#1D1D1D] to-transparent pointer-events-none" />
              <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-[#1D1D1D] to-transparent pointer-events-none" /> */}
            </div>
          </motion.div>

          {/* History AI-GEN */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6 mt-10">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-[#D68CB8]" />
                <h2 className="text-xl sm:text-2xl font-semibold">History</h2>
              </div>

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => scrollSlider("left")}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => scrollSlider("right")}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            <div className="relative">
              <div
                ref={sliderRef}
                className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {trendingVideos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <VideoCard
                      video={video}
                      onClick={() => {
                        setSelectedVideo(video);
                        setShowOptionsModal(true);
                      }}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Gradient fade edges */}
              {/* <div className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-[#1D1D1D] to-transparent pointer-events-none" />
              <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-[#1D1D1D] to-transparent pointer-events-none" /> */}
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}
