// components/VideoCard.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Film, TrendingUp, Play, Clock } from "lucide-react";
import { format } from "date-fns";
import { VideoShort } from "@/types"; // Adjust the import path as necessary

interface VideoCardProps {
  video: VideoShort;
  onClick: () => void;
  index: number;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -8 }}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="cursor-pointer group"
    >
      <div
        className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:shadow-pink-500/20 transition-all duration-500"
        style={{
          backgroundColor: "rgba(31, 31, 31, 0.2)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Video Thumbnail */}
        <div className="relative aspect-[9/16] overflow-hidden bg-black/40">
          {!thumbnailError ? (
            <video
              src={video.download_url}
              className="w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
              onError={() => setThumbnailError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                backgroundColor: "rgba(31, 31, 31, 0.3)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <Film className="w-16 h-16 text-gray-600" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Play Button Overlay */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.9, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div
                  className="rounded-full p-6 shadow-2xl"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <Play className="w-10 h-10 text-white fill-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Virality Score Badge */}
          {video.virality_score && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-4 right-4"
            >
              <div
                className="rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <TrendingUp className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-sm font-bold text-white">
                  {video.virality_score}%
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Video Info - Glass effect bottom section */}
        <div
          className="p-4 space-y-3 backdrop-blur-3xl bg-white/1 rounded-b-2xl"
          style={{
            // backgroundColor: "rgba(31, 31, 31, 0.3)",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <h3 className="font-medium text-gray-100 text-sm line-clamp-2 leading-relaxed">
            {video.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <Clock className="w-3.5 h-3.5" />
            <span>{format(new Date(video.created_at), "MMM d, yyyy")}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoCard;
