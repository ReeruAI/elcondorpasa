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
          <div className="bg-black/90 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 shadow-2xl">
            <span className="inline-flex items-center gap-2 text-sm text-white">
              <Loader2 className="w-4 h-4 animate-spin text-[#D68CB8]" />
              {streamingMessage || "Loading more videos..."}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <div className="flex gap-2 justify-end mb-4">
      {showRefreshButton && onRefresh && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onRefresh}
          disabled={isRefreshing || isStreaming}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh recommendations"
        >
          <RefreshCw
            className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </motion.button>
      )}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onScroll("left")}
        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onScroll("right")}
        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>

    <div
      ref={sliderRef}
      className={`flex gap-6 overflow-x-auto scrollbar-hide pb-4 transition-opacity duration-300 ${
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
);
