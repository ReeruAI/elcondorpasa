import { RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { TrendingVideo } from "@/types";
import { VideoCard } from "./VideoCard";

interface VideoCarouselProps {
  videos: TrendingVideo[];
  onVideoClick: (video: TrendingVideo) => void;
  sliderRef: RefObject<HTMLDivElement>;
  onScroll: (direction: "left" | "right") => void;
  isStreaming?: boolean;
  streamingMessage?: string;
  showStreamingOverlay?: boolean;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const VideoCarousel: React.FC<VideoCarouselProps> = ({
  videos,
  onVideoClick,
  sliderRef,
  onScroll,
  isStreaming = false,
  streamingMessage = "",
  showStreamingOverlay = false,
  showRefreshButton = false,
  onRefresh,
  isRefreshing = false,
}) => (
  <div className="relative">
    <AnimatePresence>
      {isStreaming && showStreamingOverlay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
        >
          <div
            className="px-8 py-4 rounded-2xl shadow-2xl"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <span className="inline-flex items-center gap-3 text-sm text-white font-medium">
              <Loader2 className="w-5 h-5 animate-spin text-pink-400" />
              {streamingMessage || "Loading more videos..."}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <div className="flex gap-3 justify-end mb-6">
      {showRefreshButton && onRefresh && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRefresh}
          disabled={isRefreshing || isStreaming}
          className="p-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
            e.currentTarget.style.boxShadow =
              "0 10px 30px rgba(214, 140, 184, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.boxShadow = "";
          }}
          title="Refresh recommendations"
        >
          <RefreshCw
            className={`w-5 h-5 text-white ${
              isRefreshing ? "animate-spin" : ""
            }`}
          />
        </motion.button>
      )}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onScroll("left")}
        className="p-3 rounded-xl transition-all duration-300 shadow-lg"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
          e.currentTarget.style.boxShadow =
            "0 10px 30px rgba(214, 140, 184, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.boxShadow = "";
        }}
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onScroll("right")}
        className="p-3 rounded-xl transition-all duration-300 shadow-lg"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
          e.currentTarget.style.boxShadow =
            "0 10px 30px rgba(214, 140, 184, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.boxShadow = "";
        }}
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </motion.button>
    </div>

    <div
      className="rounded-2xl p-6"
      style={{
        backgroundColor: "rgba(31, 31, 31, 0.2)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <div
        ref={sliderRef}
        className={`flex gap-6 overflow-x-auto scrollbar-hide pb-2 transition-opacity duration-300 ${
          isStreaming && showStreamingOverlay ? "opacity-50" : "opacity-100"
        }`}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {videos.map((video, index) => (
          <VideoCard
            key={video.id}
            video={video}
            onClick={() => onVideoClick(video)}
            index={index}
          />
        ))}
      </div>
    </div>
  </div>
);
