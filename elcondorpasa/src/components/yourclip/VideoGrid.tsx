// components/VideoGrid.tsx
import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { VideoShort } from "@/types"; // Adjust the import path as necessary
import VideoCard from "./VideoCard";

interface VideoGridProps {
  videos: VideoShort[];
  onVideoClick: (video: VideoShort) => void;
}

const VideoGrid: React.FC<VideoGridProps> = ({ videos, onVideoClick }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndicator, setActiveIndicator] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(2);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Check screen size and set cards per view
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640); // sm breakpoint

      // Set cards per view based on screen size
      if (width < 640) {
        setCardsPerView(2); // Mobile: 2 cards
      } else if (width < 768) {
        setCardsPerView(3); // Tablet: 3 cards
      } else if (width < 1024) {
        setCardsPerView(4); // Small desktop: 4 cards
      } else {
        setCardsPerView(5); // Large desktop: 5 cards
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Check scroll position for showing/hiding navigation buttons and updating indicators
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftButton(scrollLeft > 10);
    setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10);

    // Calculate active indicator based on scroll position
    const cardWidth = clientWidth / cardsPerView;
    const currentPage = Math.round(scrollLeft / (cardWidth * cardsPerView));
    setActiveIndicator(currentPage);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", checkScrollPosition);
    checkScrollPosition();

    return () => container.removeEventListener("scroll", checkScrollPosition);
  }, [cardsPerView]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth;
    const targetScroll =
      direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  // Mouse drag handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current!.offsetLeft);
    setScrollLeft(scrollContainerRef.current!.scrollLeft);
    scrollContainerRef.current!.style.cursor = "grabbing";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isMobile) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current!.offsetLeft;
    const walk = (x - startX) * 2; // Multiply by 2 for faster scrolling
    scrollContainerRef.current!.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = "grab";
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = "grab";
    }
  };

  // Calculate number of pages
  const numberOfPages = Math.ceil(videos.length / cardsPerView);

  // Calculate card width based on cards per view
  const getCardWidth = () => {
    const gap = 16; // 4 * 4px (gap-4)
    const totalGaps = (cardsPerView - 1) * gap;
    const containerPadding = 0; // No padding now since we're centering

    return `calc((100% - ${totalGaps}px) / ${cardsPerView})`;
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative flex items-center">
        {/* Left Navigation Button - Outside the grid */}
        {!isMobile && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: showLeftButton ? 1 : 0 }}
            className={`absolute -left-12 lg:-left-16 top-1/2 -translate-y-1/2 z-10 bg-black/80 backdrop-blur-sm rounded-full shadow-lg transition-all ${
              showLeftButton ? "pointer-events-auto" : "pointer-events-none"
            } p-3 hover:bg-black/90`}
            onClick={() => scroll("left")}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft className="text-white w-6 h-6" />
          </motion.button>
        )}

        {/* Right Navigation Button - Outside the grid */}
        {!isMobile && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: showRightButton ? 1 : 0 }}
            className={`absolute -right-12 lg:-right-16 top-1/2 -translate-y-1/2 z-10 bg-black/80 backdrop-blur-sm rounded-full shadow-lg transition-all ${
              showRightButton ? "pointer-events-auto" : "pointer-events-none"
            } p-3 hover:bg-black/90`}
            onClick={() => scroll("right")}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className="text-white w-6 h-6" />
          </motion.button>
        )}

        {/* Slider Container */}
        <div className="w-full py-8">
          <div
            ref={scrollContainerRef}
            className={`flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-8 pt-2 ${
              !isMobile ? "cursor-grab" : ""
            }`}
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
              scrollSnapType: "x mandatory",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {videos.map((video, index) => (
              <div
                key={`${video.created_at}-${index}`}
                className="flex-shrink-0 select-none"
                style={{
                  width: getCardWidth(),
                  scrollSnapAlign:
                    index % cardsPerView === 0 ? "start" : "none",
                }}
              >
                <VideoCard
                  video={video}
                  onClick={() => onVideoClick(video)}
                  index={index}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicators */}
      {numberOfPages > 1 && (
        <div className="flex justify-center gap-1.5 mt-6">
          {Array.from({ length: numberOfPages }).map((_, idx) => (
            <motion.div
              key={idx}
              className="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
              style={{
                width: activeIndicator === idx ? "24px" : "6px",
                backgroundColor:
                  activeIndicator === idx ? "#ec4899" : "#4b5563",
              }}
              onClick={() => {
                if (scrollContainerRef.current) {
                  const container = scrollContainerRef.current;
                  const targetScroll = idx * container.clientWidth;
                  container.scrollTo({
                    left: targetScroll,
                    behavior: "smooth",
                  });
                }
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      )}

      {/* Video count indicator */}
      <div className="text-center mt-4">
        <p className="text-sm text-gray-400">
          {videos.length} {videos.length === 1 ? "clip" : "clips"} available
        </p>
      </div>
    </div>
  );
};

export default VideoGrid;
