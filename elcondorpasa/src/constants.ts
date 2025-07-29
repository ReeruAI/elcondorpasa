// constants.ts
import { PlatformType, PlatformConfig } from "./types";

export const PLATFORM_CONFIG: Record<PlatformType, PlatformConfig> = {
  tiktok: { icon: "🎵", color: "from-pink-500 to-red-500" },
  youtube: { icon: "📺", color: "from-red-500 to-red-600" },
  linkedin: { icon: "💼", color: "from-blue-600 to-blue-700" },
  instagram: { icon: "📸", color: "from-purple-500 to-pink-500" },
};

export const ANIMATION_VARIANTS = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
  },
};
