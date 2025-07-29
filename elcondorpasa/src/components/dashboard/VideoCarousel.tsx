import { RefObject, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { TrendingVideo } from "@/types";
import { VideoCard } from "./VideoCard";
import { VideoCardSkeleton } from "./VideoCardSkeleton";

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
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
  refreshDisabledMessage?: string;
  isLoading: boolean;
  skeletonCount?: number;
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
  title = "AI-Recommended Trending Videos",
  icon: Icon = TrendingUp,
  isLoading,
  skeletonCount = 4,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position to enable/disable buttons
  const checkScrollPosition = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      checkScrollPosition();
      slider.addEventListener("scroll", checkScrollPosition);

      // Check on resize
      const resizeObserver = new ResizeObserver(checkScrollPosition);
      resizeObserver.observe(slider);

      return () => {
        slider.removeEventListener("scroll", checkScrollPosition);
        resizeObserver.disconnect();
      };
    }
  }, [sliderRef, videos]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
    sliderRef.current.style.cursor = "grabbing";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Multiply by 2 for faster scrolling
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (sliderRef.current) {
      sliderRef.current.style.cursor = "grab";
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (sliderRef.current) {
      sliderRef.current.style.cursor = "grab";
    }
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !sliderRef.current) return;
    const x = e.touches[0].pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
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

      {/* Header with title and controls in one line */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-[#D68CB8]" />
          <h2 className="text-xl sm:text-2xl font-semibold">{title}</h2>
        </div>

        <div className="flex items-center gap-3">
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
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px rgba(214, 140, 184, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.1)";
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
            whileHover={{ scale: canScrollLeft ? 1.05 : 1 }}
            whileTap={{ scale: canScrollLeft ? 0.95 : 1 }}
            onClick={() => canScrollLeft && onScroll("left")}
            disabled={!canScrollLeft}
            className="p-3 rounded-xl transition-all duration-300 shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
            onMouseEnter={(e) => {
              if (canScrollLeft) {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px rgba(214, 140, 184, 0.2)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.boxShadow = "";
            }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>

          <motion.button
            whileHover={{ scale: canScrollRight ? 1.05 : 1 }}
            whileTap={{ scale: canScrollRight ? 0.95 : 1 }}
            onClick={() => canScrollRight && onScroll("right")}
            disabled={!canScrollRight}
            className="p-3 rounded-xl transition-all duration-300 shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
            onMouseEnter={(e) => {
              if (canScrollRight) {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px rgba(214, 140, 184, 0.2)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.boxShadow = "";
            }}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </motion.button>
        </div>
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
          } ${isDragging ? "select-none" : ""}`}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            cursor: isDragging ? "grabbing" : "grab",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {isLoading || (videos.length === 0 && isStreaming)
            ? // Show skeletons when loading
              Array.from({ length: skeletonCount }).map((_, index) => (
                <VideoCardSkeleton key={`skeleton-${index}`} index={index} />
              ))
            : // Show actual videos
              videos.map((video, index) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => !isDragging && onVideoClick(video)}
                  index={index}
                />
              ))}
        </div>
      </div>
    </div>
  );
};
