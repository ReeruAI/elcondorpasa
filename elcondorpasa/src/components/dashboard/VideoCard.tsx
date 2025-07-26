import { motion, AnimatePresence } from "framer-motion";
import { Play, Eye, Clock } from "lucide-react";
import { VideoCardProps } from "@/types";

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onClick,
  index = 0,
  isVisible = true,
}) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{
          delay: index * 0.2,
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
