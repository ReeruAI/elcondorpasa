import { TrendingVideo } from "@/types";

// Helper function to format view count
export const formatViewCount = (viewCount: string | number): string => {
  if (typeof viewCount === "number") {
    if (viewCount > 1000000) return (viewCount / 1000000).toFixed(1) + "M";
    if (viewCount > 1000) return (viewCount / 1000).toFixed(1) + "K";
    return viewCount.toString();
  }
  return viewCount;
};

// Define a type for the video input object
interface VideoInput {
  videoUrl?: string;
  id?: string;
  title: string;
  thumbnailUrl?: string;
  thumbnail?: string;
  reasoning?: string;
  description?: string;
  url?: string;
  viewCount?: string | number;
  views?: string | number;
  duration?: string;
  creator?: string;
  channel?: string;
}

// Helper function to convert video data
export const convertToTrendingVideo = (video: VideoInput): TrendingVideo => ({
  id: video.videoUrl?.split("v=")[1] || video.id || Math.random().toString(),
  title: video.title,
  thumbnail: video.thumbnailUrl || video.thumbnail || "",
  description: video.reasoning || video.description || "",
  url: video.videoUrl || video.url || "",
  views: formatViewCount(video.viewCount || video.views || "0"),
  duration: video.duration || "0:00",
  channel: video.creator || video.channel || "Unknown",
});

// Helper function to parse streaming messages
export const parseStreamingMessage = (message: string): string => {
  const lines = message.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return "";

  const indicators = ["🧠", "✅", "🔍", "📊", "🔄", "🤖", "---", "❌", "⚠️"];

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (indicators.some((indicator) => line.includes(indicator))) {
      return line;
    }
  }

  return lines[lines.length - 1];
};

// Helper function to scroll slider
export const scrollSlider = (
  ref: React.RefObject<HTMLDivElement>,
  direction: "left" | "right"
) => {
  if (!ref.current) return;

  const scrollAmount = 340; // Card width + gap
  const targetScroll =
    ref.current.scrollLeft +
    (direction === "left" ? -scrollAmount : scrollAmount);

  ref.current.scrollTo({
    left: targetScroll,
    behavior: "smooth",
  });
};
