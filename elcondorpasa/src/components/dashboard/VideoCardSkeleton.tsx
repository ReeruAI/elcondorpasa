import { motion } from "framer-motion";

export const VideoCardSkeleton: React.FC<{ index: number }> = ({ index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="flex-shrink-0 w-[300px] rounded-xl overflow-hidden"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      {/* Thumbnail skeleton */}
      <div className="relative h-[169px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer" />
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title skeleton - 2 lines */}
        <div className="space-y-2">
          <div className="h-4 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer rounded" />
          <div className="h-4 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer rounded w-3/4" />
        </div>

        {/* Channel info skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer rounded w-2/3" />
            <div className="flex gap-2">
              <div className="h-2.5 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer rounded w-16" />
              <div className="h-2.5 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer rounded w-20" />
            </div>
          </div>
        </div>

        {/* Button skeleton */}
        <div className="pt-2">
          <div className="h-10 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer rounded-lg" />
        </div>
      </div>
    </motion.div>
  );
};
