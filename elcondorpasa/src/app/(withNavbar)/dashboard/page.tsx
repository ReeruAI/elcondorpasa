"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios from "axios";
import { TrendingUp, Loader2, History } from "lucide-react";

// Components
import { LoadingModal } from "@/components/dashboard/LoadingModal";
import { VideoOptionsModal } from "@/components/dashboard/VideoOptionsModal";
import { VideoResultModal } from "@/components/dashboard/VideoResultModal";
import { PreferenceSetup } from "@/components/dashboard/PreferenceSetup";
import { StreamingProgress } from "@/components/dashboard/StreamingProgress";
import { UrlInputSection } from "@/components/dashboard/UrlInputSection";
import { VideoCarousel } from "@/components/dashboard/VideoCarousel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import ParticleBackground from "@/components/yourclip/ParticleBackground";

// Types
import {
  TrendingVideo,
  UserPreferences,
  KlapStreamData,
  ProcessingState,
  VideoResult,
} from "@/types";

// Utils
import {
  convertToTrendingVideo,
  parseStreamingMessage,
  scrollSlider,
} from "@/utils/dashboard";
import {
  saveProcessingState,
  getProcessingState,
  clearProcessingState,
  processKlapStream,
} from "@/utils/klap";

export default function Dashboard() {
  // State management
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<TrendingVideo | null>(
    null
  );
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [trendingVideos, setTrendingVideos] = useState<TrendingVideo[]>([]);
  const [historyVideos, setHistoryVideos] = useState<TrendingVideo[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyStreamIndex, setHistoryStreamIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasPreferences, setHasPreferences] = useState<boolean | null>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreamingVideos, setIsStreamingVideos] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
  const [streamedVideos, setStreamedVideos] = useState<TrendingVideo[]>([]);
  const [showVideos, setShowVideos] = useState(false);
  const [canRefreshRecommendations, setCanRefreshRecommendations] =
    useState(true);
  const [refreshLimitMessage, setRefreshLimitMessage] = useState("");

  // Klap processing states
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    message: "",
    status: "idle",
  });

  // Video result state
  const [videoResult, setVideoResult] = useState<VideoResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const router = useRouter();
  const trendingSliderRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const historySliderRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;

  // Fetch history videos with simulated streaming
  const fetchHistoryVideos = async () => {
    try {
      setIsLoadingHistory(true);
      setHistoryVideos([]);
      setHistoryStreamIndex(0);

      const response = await axios.get("/api/history", {
        withCredentials: true,
      });

      if (response.data?.data?.[0]?.videos) {
        const videos = response.data.data[0].videos;

        for (let i = 0; i < videos.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          const video = convertToTrendingVideo(videos[i]);
          setHistoryVideos((prev) => [...prev, video]);
          setHistoryStreamIndex(i + 1);
        }
      }
    } catch (error) {
      console.error("Error fetching history videos:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Process streaming response
  const processStreamingResponse = useCallback(
    async (
      response: Response,
      onComplete: (videos: TrendingVideo[]) => void
    ) => {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      let buffer = "";
      const tempStreamedVideos: TrendingVideo[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === "") continue;

          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();

            if (data === "[DONE]") {
              setIsStreamingVideos(false);
              setStreamingMessage("");
              onComplete(tempStreamedVideos);
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === "progress") {
                const cleanMessage = parseStreamingMessage(parsed.message);
                if (cleanMessage) {
                  setStreamingMessage(cleanMessage);

                  // Check for the daily limit message
                  if (
                    cleanMessage.includes(
                      "These are your videos for today! Come back tomorrow for fresh content."
                    )
                  ) {
                    setCanRefreshRecommendations(false);
                    setRefreshLimitMessage(
                      "You've reached your daily refresh limit. Come back tomorrow for fresh content!"
                    );
                  }
                }
              } else if (parsed.type === "video" && parsed.data) {
                const newVideo = convertToTrendingVideo(parsed.data);
                tempStreamedVideos.push(newVideo);
                setStreamedVideos((prev) => [...prev, newVideo]);
                if (!showVideos) {
                  setShowVideos(true);
                }
              } else if (parsed.type === "complete") {
                setIsStreamingVideos(false);
                setStreamingMessage("");
                if (parsed.data?.videos) {
                  onComplete(parsed.data.videos.map(convertToTrendingVideo));
                }
              }
            } catch (e) {
              console.error("Error parsing streaming data:", e);
            }
          }
        }
      }
    },
    [showVideos]
  );

  // Load recommendations
  const loadRecommendations = useCallback(
    async (preferences: UserPreferences, isRefresh: boolean = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
        setTrendingVideos([]);
      }

      setIsStreamingVideos(true);
      setStreamingMessage(
        isRefresh
          ? "🔄 Refreshing recommendations..."
          : "🧠 Initializing AI recommendation engine..."
      );
      setStreamedVideos([]);
      setShowVideos(false);

      try {
        const response = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(preferences),
        });

        if (!response.ok) throw new Error("Failed to fetch recommendations");

        await processStreamingResponse(response, (videos) => {
          setTrendingVideos(videos);
        });

        // If it's a refresh, also refresh history after recommendations complete
        if (isRefresh) {
          await fetchHistoryVideos();
        }
      } catch (error) {
        console.error("Error streaming videos:", error);
        setIsStreamingVideos(false);
        setStreamingMessage("");

        if (isRefresh && trendingVideos.length > 0) {
          const shuffled = [...trendingVideos].sort(() => Math.random() - 0.5);
          setTrendingVideos(shuffled);
        }
      } finally {
        if (isRefresh) {
          setIsRefreshing(false);
        }
      }
    },
    [processStreamingResponse, fetchHistoryVideos, trendingVideos]
  );

  // Check user preferences and load trending videos
  useEffect(() => {
    // Check for existing processing state
    const savedState = getProcessingState();
    if (savedState && savedState.isProcessing) {
      setProcessingState(savedState);
    }

    const checkPreferencesAndLoadVideos = async () => {
      try {
        setLoadingPreferences(true);

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

          if (contentPreference && languagePreference) {
            setLoadingPreferences(false);
            await loadRecommendations({
              contentPreference,
              languagePreference,
            });
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
    fetchHistoryVideos();
  }, []); // Empty dependency array - only run once on mount

  const handleSubmitUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || processingState.isProcessing) return;

    setIsLoading(true);
    setShowLoadingModal(true);

    const newProcessingState: ProcessingState = {
      isProcessing: true,
      progress: 0,
      message: "Initializing video processing...",
      status: "starting",
    };

    setProcessingState(newProcessingState);
    saveProcessingState(newProcessingState);

    try {
      const response = await fetch("/api/klap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ video_url: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to start processing");
      }

      await processKlapStream(
        response,
        // onProgress
        (data: KlapStreamData) => {
          const updatedState: ProcessingState = {
            isProcessing: true,
            taskId: data.task_id,
            projectId: data.project_id,
            progress: data.progress,
            message: data.message,
            status: data.status,
          };
          setProcessingState(updatedState);
          saveProcessingState(updatedState);
        },
        // onComplete
        (data: KlapStreamData) => {
          clearProcessingState();
          setProcessingState({
            isProcessing: false,
            progress: 100,
            message: "Successfully completed!",
            status: "completed",
          });

          // Save the result if needed
          if (data.short) {
            const result: VideoResult = {
              title: data.short.title,
              virality_score: data.short.virality_score,
              captions: data.short.captions,
              download_url: data.short.download_url,
            };
            setVideoResult(result);
            setShowLoadingModal(false);
            setShowResultModal(true);
          }
        },
        // onError
        (error: string) => {
          clearProcessingState();
          setProcessingState({
            isProcessing: false,
            progress: 0,
            message: error,
            status: "error",
          });
          console.error("Klap processing error:", error);
        }
      );
    } catch (error) {
      console.error("Error generating clips:", error);
      clearProcessingState();
      setProcessingState({
        isProcessing: false,
        progress: 0,
        message: "Failed to process video",
        status: "error",
      });
      setShowLoadingModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateClip = async (videoUrl: string) => {
    if (processingState.isProcessing) return;

    setUrl(videoUrl);
    setShowLoadingModal(true);

    const newProcessingState: ProcessingState = {
      isProcessing: true,
      progress: 0,
      message: "Initializing video processing...",
      status: "starting",
    };

    setProcessingState(newProcessingState);
    saveProcessingState(newProcessingState);

    try {
      const response = await fetch("/api/klap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ video_url: videoUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to start processing");
      }

      await processKlapStream(
        response,
        // onProgress
        (data: KlapStreamData) => {
          const updatedState: ProcessingState = {
            isProcessing: true,
            taskId: data.task_id,
            projectId: data.project_id,
            progress: data.progress,
            message: data.message,
            status: data.status,
          };
          setProcessingState(updatedState);
          saveProcessingState(updatedState);
        },
        // onComplete
        (data: KlapStreamData) => {
          clearProcessingState();
          setProcessingState({
            isProcessing: false,
            progress: 100,
            message: "Successfully completed!",
            status: "completed",
          });

          if (data.short) {
            const result: VideoResult = {
              title: data.short.title,
              virality_score: data.short.virality_score,
              captions: data.short.captions,
              download_url: data.short.download_url,
            };
            setVideoResult(result);
            setShowLoadingModal(false);
            setShowResultModal(true);
          }
        },
        // onError
        (error: string) => {
          clearProcessingState();
          setProcessingState({
            isProcessing: false,
            progress: 0,
            message: error,
            status: "error",
          });
          console.error("Klap processing error:", error);
        }
      );
    } catch (error) {
      console.error("Error generating clips:", error);
      clearProcessingState();
      setProcessingState({
        isProcessing: false,
        progress: 0,
        message: "Failed to process video",
        status: "error",
      });
      setShowLoadingModal(false);
    }
  };

  const handleCheckProgress = () => {
    const savedState = getProcessingState();
    if (savedState) {
      setProcessingState(savedState);
      setShowLoadingModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowLoadingModal(false);
    // Don't clear processing state when closing, just hide the modal
  };

  const handleRefreshRecommendations = async () => {
    if (
      !hasPreferences ||
      !userPreferences.contentPreference ||
      !userPreferences.languagePreference ||
      !canRefreshRecommendations
    )
      return;

    await loadRecommendations(userPreferences, true);
    await fetchHistoryVideos();
  };

  const handleVideoClick = (video: TrendingVideo) => {
    setSelectedVideo(video);
    setShowOptionsModal(true);
  };

  const displayVideos = showVideos ? streamedVideos : trendingVideos;

  return (
    <>
      <LoadingModal
        isOpen={showLoadingModal}
        progress={processingState.progress}
        message={processingState.message}
        status={processingState.status}
        onClose={handleCloseModal}
        canClose={true}
      />
      <VideoOptionsModal
        isOpen={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        video={selectedVideo}
        onGenerateClip={handleGenerateClip}
        isProcessing={processingState.isProcessing}
      />
      <VideoResultModal
        isOpen={showResultModal}
        onClose={() => {
          setShowResultModal(false);
          setVideoResult(null);
        }}
        videoData={videoResult}
      />

      <div className="min-h-screen bg-gradient-to-b from-[#1D1D1D] to-black text-white relative">
        <ParticleBackground />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          {/* Header */}
          <div className="relative overflow-hidden lg:pt-8">
            <div className="absolute inset-0" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
                  Dash
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-pink-400">
                    board
                  </span>
                </h1>
                <p className="text-gray-400 text-lg">
                  Create viral shorts in seconds
                </p>
              </motion.div>
            </div>
          </div>

          {/* URL Input Section */}
          <UrlInputSection
            url={url}
            setUrl={setUrl}
            isLoading={isLoading}
            onSubmit={handleSubmitUrl}
            onCheckProgress={handleCheckProgress}
            isProcessing={processingState.isProcessing}
          />

          {/* Trending Videos Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            {loadingPreferences ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#D68CB8]" />
              </div>
            ) : isStreamingVideos && !showVideos ? (
              <StreamingProgress message={streamingMessage} />
            ) : hasPreferences ? (
              displayVideos.length === 0 && !isStreamingVideos ? (
                <EmptyState
                  icon={TrendingUp}
                  title="No Recommendations Today"
                  description="Check back later for AI-powered video recommendations"
                />
              ) : (
                <VideoCarousel
                  videos={displayVideos}
                  onVideoClick={handleVideoClick}
                  sliderRef={trendingSliderRef}
                  onScroll={(direction) =>
                    scrollSlider(trendingSliderRef, direction)
                  }
                  isStreaming={isStreamingVideos}
                  streamingMessage={streamingMessage}
                  showStreamingOverlay={showVideos}
                  showRefreshButton={
                    hasPreferences && canRefreshRecommendations
                  }
                  onRefresh={handleRefreshRecommendations}
                  isRefreshing={isRefreshing}
                  title="AI-Recommended Trending Videos"
                  icon={TrendingUp}
                  refreshDisabledMessage={refreshLimitMessage}
                  isLoading={isStreamingVideos && !showVideos}
                  skeletonCount={6}
                />
              )
            ) : hasPreferences === false ? (
              <PreferenceSetup />
            ) : (
              <StreamingProgress message="Checking your preferences..." />
            )}
          </motion.div>

          {/* History Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {(isLoadingHistory && historyVideos.length === 0) ||
            (isRefreshing && isLoadingHistory) ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#D68CB8] mx-auto mb-4" />
                  <p className="text-gray-400">
                    {isRefreshing
                      ? "Updating your history..."
                      : "Loading your history..."}
                  </p>
                </div>
              </div>
            ) : historyVideos.length === 0 ? (
              <EmptyState
                icon={History}
                title="No History Yet"
                description="Your generated clips will appear here"
              />
            ) : (
              <VideoCarousel
                videos={historyVideos}
                onVideoClick={handleVideoClick}
                sliderRef={historySliderRef}
                onScroll={(direction) =>
                  scrollSlider(historySliderRef, direction)
                }
                title="Your Video History"
                icon={History}
                isLoading={isLoadingHistory && historyVideos.length === 0}
                skeletonCount={4}
              />
            )}
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
