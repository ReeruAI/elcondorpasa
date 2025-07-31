// components/PlatformCaption.tsx
import React from "react";
import { motion } from "framer-motion";
import { Copy, CheckCircle } from "lucide-react";
import { PlatformType } from "@/types"; // Adjust the import path as necessary
import { PLATFORM_CONFIG } from "@/constants"; // Adjust the import path as necessary

interface PlatformCaptionProps {
  platform: PlatformType;
  caption: string;
  onCopy: () => void;
  isCopied: boolean;
}

const PlatformCaption: React.FC<PlatformCaptionProps> = ({
  platform,
  caption,
  onCopy,
  isCopied,
}) => {
  const config = PLATFORM_CONFIG[platform];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all cursor-pointer group"
      onClick={onCopy}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <span className="font-medium text-white capitalize">{platform}</span>
        </div>
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isCopied ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </motion.div>
      </div>
      <p className="text-sm text-gray-300 line-clamp-2">{caption}</p>
    </motion.div>
  );
};

export default PlatformCaption;
