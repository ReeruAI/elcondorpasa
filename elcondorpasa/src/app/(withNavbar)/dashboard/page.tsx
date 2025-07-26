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
  Settings,
  History,
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
  index?: number;
  isVisible?: boolean;
}> = ({ video, onClick, index = 0, isVisible = true }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{
          delay: index * 0.2, // Staggered animation
          duration: 0.4,
          ease: "easeOut",
        }}
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
    )}
  </AnimatePresence>
);

// Preference Setup Component
const PreferenceSetup: React.FC = () => {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#2A2A2A] rounded-2xl p-8 text-center"
    >
      <Settings className="w-16 h-16 text-[#D68CB8] mx-auto mb-4" />
      <h3 className="text-2xl font-bold mb-3">Set Your Preferences</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        To get personalized AI video recommendations, please set up your content
        preferences first.
      </p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push("/preferences")}
        className="px-8 py-3 bg-gradient-to-r from-[#D68CB8] to-pink-400 rounded-xl font-semibold hover:shadow-lg hover:shadow-pink-500/25 transition-all duration-300"
      >
        Set Your Preferences
      </motion.button>
    </motion.div>
  );
};

// Streaming Progress Component
const StreamingProgress: React.FC<{ message: string }> = ({ message }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="bg-[#2A2A2A] rounded-2xl p-8"
  >
    <div className="flex items-center justify-center mb-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
        className="w-16 h-16"
      >
        <Sparkles className="w-full h-full text-[#D68CB8]" />
      </motion.div>
    </div>
    <AnimatePresence mode="wait">
      <motion.p
        key={message}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="text-center text-gray-300 font-medium"
      >
        {message}
      </motion.p>
    </AnimatePresence>
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
  const [trendingVideos, setTrendingVideos] = useState<TrendingVideo[]>([]);
  const [historyVideos, setHistoryVideos] =
    useState<TrendingVideo[]>(MOCK_TRENDING_VIDEOS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasPreferences, setHasPreferences] = useState<boolean | null>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreamingVideos, setIsStreamingVideos] = useState(false);
  const [userPreferences, setUserPreferences] = useState<{
    contentPreference?: string;
    languagePreference?: string;
  }>({});
  const [streamedVideos, setStreamedVideos] = useState<TrendingVideo[]>([]);
  const [showVideos, setShowVideos] = useState(false);

  const router = useRouter();
  const trendingSliderRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const historySliderRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;

  // Helper function to parse streaming messages
  const parseStreamingMessage = (message: string): string => {
    // Extract the last meaningful line from the message
    const lines = message.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return "";

    // Get the last line that contains actual progress info
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (
        line.includes("🧠") ||
        line.includes("✅") ||
        line.includes("🔍") ||
        line.includes("📊") ||
        line.includes("🔄") ||
        line.includes("🤖") ||
        line.includes("---") ||
        line.includes("❌") ||
        line.includes("⚠️")
      ) {
        return line;
      }
    }

    return lines[lines.length - 1];
  };

  // Function to handle video streaming
  const processVideoStream = async (parsed: any) => {
    if (parsed.type === "video" && parsed.data) {
      const newVideo: TrendingVideo = {
        id: parsed.data.videoUrl.split("v=")[1] || Math.random().toString(),
        title: parsed.data.title,
        thumbnail: parsed.data.thumbnailUrl,
        description: parsed.data.reasoning,
        url: parsed.data.videoUrl,
        views:
          typeof parsed.data.viewCount === "number"
            ? parsed.data.viewCount > 1000000
              ? (parsed.data.viewCount / 1000000).toFixed(1) + "M"
              : parsed.data.viewCount > 1000
              ? (parsed.data.viewCount / 1000).toFixed(1) + "K"
              : parsed.data.viewCount.toString()
            : parsed.data.viewCount,
        duration: parsed.data.duration,
        channel: parsed.data.creator,
      };

      setStreamedVideos((prev) => [...prev, newVideo]);

      // Show videos container when first video arrives
      if (!showVideos) {
        setShowVideos(true);
      }
    }
  };

  // Check user preferences and load trending videos
  useEffect(() => {
    const checkPreferencesAndLoadVideos = async () => {
      try {
        setLoadingPreferences(true);

        // Check if user has preferences
        const preferencesResponse = await axios.get("/api/preferences", {
          withCredentials: true,
        });

        const userHasPreferences =
          preferencesResponse.data?.hasPreference === true;
        setHasPreferences(userHasPreferences);

        if (userHasPreferences && preferencesResponse.data?.preference) {
          const { contentPreference, languagePreference } =
            preferencesResponse.data.preference;
          setUserPreferences({ contentPreference, languagePreference });

          console.log(
            "User Preferences:",
            contentPreference,
            languagePreference
          );

          if (contentPreference && languagePreference) {
            // Don't wait for loading to complete - show UI immediately
            setLoadingPreferences(false);

            // Start streaming from Gemini API
            setIsStreamingVideos(true);
            setStreamingMessage("🧠 Initializing AI recommendation engine...");
            setStreamedVideos([]);
            setShowVideos(false);

            try {
              const response = await fetch("/api/gemini", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                  contentPreference,
                  languagePreference,
                }),
              });

              if (!response.ok) {
                throw new Error("Failed to fetch recommendations");
              }

              const reader = response.body?.getReader();
              const decoder = new TextDecoder();

              if (reader) {
                let buffer = "";

                // Process stream chunk by chunk
                const processStream = async () => {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    // Decode the chunk
                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;

                    // Process all complete lines in the buffer
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || ""; // Keep incomplete line in buffer

                    for (const line of lines) {
                      if (line.trim() === "") continue; // Skip empty lines

                      if (line.startsWith("data: ")) {
                        const data = line.slice(6).trim();

                        if (data === "[DONE]") {
                          setIsStreamingVideos(false);
                          setStreamingMessage("");
                          setTrendingVideos(streamedVideos);
                          continue;
                        }

                        try {
                          const parsed = JSON.parse(data);

                          // Handle progress messages
                          if (parsed.type === "progress") {
                            const cleanMessage = parseStreamingMessage(
                              parsed.message
                            );
                            if (cleanMessage) {
                              setStreamingMessage(cleanMessage);
                            }
                          }

                          // Handle video data
                          else if (parsed.type === "video") {
                            await processVideoStream(parsed);
                          }

                          // Handle completion
                          else if (parsed.type === "complete") {
                            setIsStreamingVideos(false);
                            setStreamingMessage("");
                            if (parsed.data?.videos) {
                              setTrendingVideos(
                                parsed.data.videos.map((video: any) => ({
                                  id:
                                    video.videoUrl.split("v=")[1] ||
                                    Math.random().toString(),
                                  title: video.title,
                                  thumbnail: video.thumbnailUrl,
                                  description: video.reasoning,
                                  url: video.videoUrl,
                                  views:
                                    typeof video.viewCount === "number"
                                      ? video.viewCount > 1000000
                                        ? (video.viewCount / 1000000).toFixed(
                                            1
                                          ) + "M"
                                        : video.viewCount > 1000
                                        ? (video.viewCount / 1000).toFixed(1) +
                                          "K"
                                        : video.viewCount.toString()
                                      : video.viewCount,
                                  duration: video.duration,
                                  channel: video.creator,
                                }))
                              );
                            }
                          }
                        } catch (e) {
                          console.error("Error parsing streaming data:", e);
                        }
                      }
                    }
                  }
                };

                await processStream();
              }
            } catch (error) {
              console.error("Error streaming videos:", error);
              setIsStreamingVideos(false);
              setStreamingMessage("");
              // Fallback to mock data
              setTrendingVideos(MOCK_TRENDING_VIDEOS);
            }

            // Return early to prevent setting loadingPreferences to false at the end
            return;
          }
        }
      } catch (error) {
        console.error("Error checking preferences:", error);
        setHasPreferences(false);
      } finally {
        setLoadingPreferences(false);
      }
    };

    checkPreferencesAndLoadVideos();

    // Load history videos separately (mock for now)
    setHistoryVideos(MOCK_TRENDING_VIDEOS);
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
    if (
      !hasPreferences ||
      !userPreferences.contentPreference ||
      !userPreferences.languagePreference
    )
      return;

    setIsRefreshing(true);
    setIsStreamingVideos(true);
    setStreamingMessage("🔄 Refreshing recommendations...");
    setTrendingVideos([]); // Clear existing videos
    setStreamedVideos([]);
    setShowVideos(false);

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          contentPreference: userPreferences.contentPreference,
          languagePreference: userPreferences.languagePreference,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = "";

        // Process stream chunk by chunk
        const processStream = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode the chunk
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Process all complete lines in the buffer
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.trim() === "") continue; // Skip empty lines

              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();

                if (data === "[DONE]") {
                  setIsStreamingVideos(false);
                  setStreamingMessage("");
                  setTrendingVideos(streamedVideos);
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);

                  // Handle progress messages
                  if (parsed.type === "progress") {
                    const cleanMessage = parseStreamingMessage(parsed.message);
                    if (cleanMessage) {
                      setStreamingMessage(cleanMessage);
                    }
                  }

                  // Handle video data
                  else if (parsed.type === "video") {
                    await processVideoStream(parsed);
                  }

                  // Handle completion
                  else if (parsed.type === "complete") {
                    setIsStreamingVideos(false);
                    setStreamingMessage("");
                    if (parsed.data?.videos) {
                      setTrendingVideos(
                        parsed.data.videos.map((video: any) => ({
                          id:
                            video.videoUrl.split("v=")[1] ||
                            Math.random().toString(),
                          title: video.title,
                          thumbnail: video.thumbnailUrl,
                          description: video.reasoning,
                          url: video.videoUrl,
                          views:
                            typeof video.viewCount === "number"
                              ? video.viewCount > 1000000
                                ? (video.viewCount / 1000000).toFixed(1) + "M"
                                : video.viewCount > 1000
                                ? (video.viewCount / 1000).toFixed(1) + "K"
                                : video.viewCount.toString()
                              : video.viewCount,
                          duration: video.duration,
                          channel: video.creator,
                        }))
                      );
                    }
                  }
                } catch (e) {
                  console.error("Error parsing streaming data:", e);
                }
              }
            }
          }
        };

        await processStream();
      }
    } catch (error) {
      console.error("Error refreshing recommendations:", error);
      setIsStreamingVideos(false);
      setStreamingMessage("");
      // Fallback to shuffling existing videos
      const shuffled = [...trendingVideos].sort(() => Math.random() - 0.5);
      setTrendingVideos(shuffled);
    } finally {
      setIsRefreshing(false);
    }
  };

  const scrollSlider = (
    ref: React.RefObject<HTMLDivElement>,
    direction: "left" | "right"
  ) => {
    if (ref.current) {
      const scrollAmount = 340; // Card width + gap
      const scrollLeft = ref.current.scrollLeft;
      const targetScroll =
        direction === "left"
          ? scrollLeft - scrollAmount
          : scrollLeft + scrollAmount;

      ref.current.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    }
  };

  // Use either streamed videos or trending videos
  const displayVideos = showVideos ? streamedVideos : trendingVideos;

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
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-[#D68CB8]" />
                <h2 className="text-xl sm:text-2xl font-semibold">
                  AI-Recommended Trending Videos
                </h2>
              </div>

              {hasPreferences && (
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleRefreshRecommendations}
                    disabled={isRefreshing || isStreamingVideos}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Refresh recommendations"
                  >
                    <RefreshCw
                      className={`w-5 h-5 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => scrollSlider(trendingSliderRef, "left")}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => scrollSlider(trendingSliderRef, "right")}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>
              )}
            </div>

            {loadingPreferences ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#D68CB8]" />
              </div>
            ) : isStreamingVideos && !showVideos ? (
              <StreamingProgress message={streamingMessage} />
            ) : hasPreferences ? (
              <div className="relative">
                <AnimatePresence>
                  {isStreamingVideos && showVideos && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute -top-8 left-0 right-0 text-center"
                    >
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#2A2A2A] rounded-full text-sm text-gray-300">
                        <Loader2 className="w-4 h-4 animate-spin text-[#D68CB8]" />
                        {streamingMessage || "Loading more videos..."}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div
                  ref={trendingSliderRef}
                  className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {displayVideos.map((video, index) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onClick={() => {
                        setSelectedVideo(video);
                        setShowOptionsModal(true);
                      }}
                      index={index}
                      isVisible={true}
                    />
                  ))}
                </div>
              </div>
            ) : hasPreferences === false ? (
              <PreferenceSetup />
            ) : (
              // Show streaming progress while checking preferences
              <StreamingProgress message="Checking your preferences..." />
            )}
          </motion.div>

          {/* History Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-[#D68CB8]" />
                <h2 className="text-xl sm:text-2xl font-semibold">History</h2>
              </div>

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => scrollSlider(historySliderRef, "left")}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => scrollSlider(historySliderRef, "right")}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            <div className="relative">
              <div
                ref={historySliderRef}
                className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {historyVideos.map((video, index) => (
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
