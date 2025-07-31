// components/EmptyState.tsx
import React from "react";
import { motion } from "framer-motion";
import { Film } from "lucide-react";

const EmptyState: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-[50vh] text-center"
    >
      <div className="w-20 h-20 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-full flex items-center justify-center mb-6">
        <Film className="w-10 h-10 text-pink-400" />
      </div>
      <h3 className="text-2xl font-semibold text-white mb-3">No Clips Yet</h3>
      <p className="text-gray-400 max-w-md">
        Start creating viral shorts and they&apos;ll appear here. Your video
        collection is waiting to be filled!
      </p>
    </motion.div>
  );
};

export default EmptyState;
