import { redis } from "@/db/config/redis";
import { GoogleGenAI } from "@google/genai";

// Initialize services
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Constants
const CACHE_TTL = 5 * 24 * 60 * 60; // 5 days in seconds
const USER_HISTORY_TTL = 2 * 24 * 60 * 60; // 2 days for seen videos
const DAILY_REFRESH_LIMIT = 2; // Initial load + 1 refresh = 10 videos total
const VIDEOS_PER_REQUEST = 5;
const MIN_DURATION_MINUTES = 30;
const MIN_VIEW_COUNT = 100000;
const MAX_API_RESULTS = 40; // Your API limit constraint

// Types
interface CachedVideo {
  title: string;
  creator: string;
  thumbnailUrl: string;
  videoUrl: string;
  viewCount: number;
  duration: string;
  reasoning: string;
  videoId: string;
}

interface VideoPool {
  videos: CachedVideo[];
  timestamp: number;
  query: string;
}

/**
 * Generate a cache key for content/language combination
 */
function getPoolKey(
  contentPreference: string,
  languagePreference: string
): string {
  // Simple combination: "Tech_EN" or "Entertainment_ID"
  const content = contentPreference.substring(0, 3);
  const lang = languagePreference === "English" ? "EN" : "ID";
  return `pool:${content}${lang}`;
}

/**
 * Get user-specific keys
 */
function getUserKeys(userId: string) {
  const today = new Date().toISOString().split("T")[0];
  return {
    refreshCount: `user:${userId}:refresh:${today}`,
    seenVideos: `user:${userId}:seen`,
  };
}

/**
 * Check if user can refresh (max 2 times per day)
 */
async function canUserRefresh(
  userId: string
): Promise<{ canRefresh: boolean; count: number }> {
  const { refreshCount } = getUserKeys(userId);
  const count = await redis.get(refreshCount);
  const currentCount = count ? parseInt(count) : 0;

  return {
    canRefresh: currentCount < DAILY_REFRESH_LIMIT,
    count: currentCount,
  };
}

/**
 * Increment user's daily refresh count
 */
async function incrementRefreshCount(userId: string): Promise<void> {
  const { refreshCount } = getUserKeys(userId);
  const current = await redis.incr(refreshCount);

  // Set expiry to end of day if this is the first refresh
  if (current === 1) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const ttl = Math.floor((tomorrow.getTime() - Date.now()) / 1000);
    await redis.expire(refreshCount, ttl);
  }
}

/**
 * Get videos the user has seen in the last 2 days
 */
async function getUserSeenVideos(userId: string): Promise<Set<string>> {
  const { seenVideos } = getUserKeys(userId);
  const videos = await redis.smembers(seenVideos);
  return new Set(videos);
}

/**
 * Mark videos as seen by the user
 */
async function markVideosAsSeen(
  userId: string,
  videoIds: string[]
): Promise<void> {
  const { seenVideos } = getUserKeys(userId);

  if (videoIds.length > 0) {
    await redis.sadd(seenVideos, ...videoIds);
    await redis.expire(seenVideos, USER_HISTORY_TTL);
  }
}

/**
 * Get cached video pool
 */
async function getCachedPool(poolKey: string): Promise<VideoPool | null> {
  const cached = await redis.get(poolKey);
  if (!cached) return null;

  try {
    return JSON.parse(cached);
  } catch (error) {
    console.error("Failed to parse cached pool:", error);
    return null;
  }
}

/**
 * Save video pool to cache
 */
async function cacheVideoPool(
  poolKey: string,
  videos: CachedVideo[],
  query: string
): Promise<void> {
  const pool: VideoPool = {
    videos,
    timestamp: Date.now(),
    query,
  };

  await redis.set(poolKey, JSON.stringify(pool), "EX", CACHE_TTL);
}

/**
 * Convert ISO 8601 duration to minutes
 */
function parseDurationToMinutes(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;

  return hours * 60 + minutes + seconds / 60;
}

/**
 * Format duration for display
 */
function formatDuration(duration: string): string {
  const minutes = Math.floor(parseDurationToMinutes(duration));
  return `${minutes} minutes`;
}

/**
 * Generate smart search query using preferences
 */
async function generateSearchQuery(
  contentPreference: string,
  languagePreference: string
): Promise<string> {
  const prompt = `Generate ONE concise YouTube search query for finding trending podcast content.

Input:
- Content: ${contentPreference}
- Language: ${languagePreference}

Requirements:
- Include "podcast 2025" in the query
- Add 1-2 relevant trending keywords based on content preference
- Keep it short (4-6 words max)
- Focus on quality content creators if applicable

Example outputs:
- For Tech/English: "podcast 2025 ai startups"
- For Entertainment/Indonesian: "podcast 2025 komedi indonesia"

Return ONLY the search query, no explanation.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: prompt,
  });

  return (
    response.text?.trim() || `podcast 2025 ${contentPreference.toLowerCase()}`
  );
}

/**
 * Search YouTube and get video details in one go
 */
async function searchYouTubeWithDetails(query: string): Promise<any[]> {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY environment variable is required");
  }

  // Search parameters
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const publishedAfter = oneMonthAgo.toISOString();

  // Step 1: Search for videos
  const searchUrl =
    `https://www.googleapis.com/youtube/v3/search?` +
    `part=snippet&type=video&videoDuration=long&order=viewCount` +
    `&maxResults=${MAX_API_RESULTS}&publishedAfter=${publishedAfter}` +
    `&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;

  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    throw new Error(`YouTube API error: ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json();
  const videos = searchData.items || [];

  if (videos.length === 0) return [];

  // Step 2: Get video details
  const videoIds = videos.map((v: any) => v.id.videoId).join(",");
  const detailsUrl =
    `https://www.googleapis.com/youtube/v3/videos?` +
    `part=contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;

  const detailsResponse = await fetch(detailsUrl);
  if (!detailsResponse.ok) {
    throw new Error(`YouTube API error: ${detailsResponse.status}`);
  }

  const detailsData = await detailsResponse.json();
  const videoDetails = detailsData.items || [];

  // Combine and filter results
  return videos
    .map((video: any) => {
      const details = videoDetails.find((d: any) => d.id === video.id.videoId);
      const durationMinutes = details
        ? parseDurationToMinutes(details.contentDetails.duration)
        : 0;
      const viewCount = parseInt(details?.statistics?.viewCount || "0");

      return {
        videoId: video.id.videoId,
        title: video.snippet.title,
        creator: video.snippet.channelTitle,
        thumbnailUrl:
          video.snippet.thumbnails.high?.url ||
          video.snippet.thumbnails.default.url,
        videoUrl: `https://www.youtube.com/watch?v=${video.id.videoId}`,
        duration: details?.contentDetails?.duration || "PT0M",
        viewCount,
        durationMinutes,
        publishedAt: video.snippet.publishedAt,
        description: video.snippet.description.substring(0, 200),
      };
    })
    .filter(
      (video: any) =>
        video.durationMinutes >= MIN_DURATION_MINUTES &&
        video.viewCount >= MIN_VIEW_COUNT
    );
}

/**
 * Analyze videos with Gemini
 */
async function analyzeVideoWithGemini(
  video: any,
  contentPreference: string
): Promise<string> {
  const prompt = `Analyze this YouTube podcast and explain why it's valuable for someone interested in ${contentPreference}.

Video: "${video.title}" by ${video.creator}
Views: ${video.viewCount.toLocaleString()}
Duration: ${video.durationMinutes} minutes

Provide a compelling 2-3 sentence explanation covering:
1. What makes this content valuable
2. Key topics or insights covered
3. Why the high view count indicates quality

Be specific and enthusiastic. Response only with the reasoning text.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return (
      response.text?.trim() ||
      `This ${video.durationMinutes}-minute podcast from ${
        video.creator
      } has attracted ${video.viewCount.toLocaleString()} views, indicating strong audience engagement with ${contentPreference} content.`
    );
  } catch (error) {
    // Fallback reasoning
    return `This trending podcast from ${video.creator} offers ${
      video.durationMinutes
    } minutes of ${contentPreference} content, with ${video.viewCount.toLocaleString()} views demonstrating its popularity and relevance.`;
  }
}

/**
 * Main function to get YouTube recommendations with caching and deduplication
 */
export async function* getYouTubeRecommendations(
  userId: string,
  contentPreference: string,
  languagePreference: string
): AsyncGenerator<
  string | { type: "video"; data: CachedVideo },
  void,
  unknown
> {
  try {
    // Check refresh limit
    yield `📊 Checking refresh limit for today...\n`;
    const { canRefresh, count } = await canUserRefresh(userId);

    if (!canRefresh) {
      yield `❌ Daily refresh limit reached (${count}/${DAILY_REFRESH_LIMIT}). Try again tomorrow!\n`;
      return;
    }

    yield `✅ Refresh ${count + 1}/${DAILY_REFRESH_LIMIT} for today\n\n`;

    // Get pool key and check cache
    const poolKey = getPoolKey(contentPreference, languagePreference);
    yield `🔍 Checking cache for ${contentPreference}/${languagePreference} content...\n`;

    let videoPool = await getCachedPool(poolKey);

    if (videoPool && videoPool.videos.length >= VIDEOS_PER_REQUEST) {
      yield `🎯 Cache hit! Found ${videoPool.videos.length} videos in pool\n\n`;
    } else {
      // Need to fetch new videos
      yield `💫 Cache miss or insufficient videos. Fetching fresh content...\n\n`;

      // Generate search query
      yield `🧠 Generating optimized search query...\n`;
      const searchQuery = await generateSearchQuery(
        contentPreference,
        languagePreference
      );
      yield `✅ Search query: "${searchQuery}"\n\n`;

      // Search YouTube (single API call)
      yield `🔍 Searching YouTube for trending podcasts...\n`;
      const searchResults = await searchYouTubeWithDetails(searchQuery);
      yield `✅ Found ${searchResults.length} videos matching criteria\n\n`;

      if (searchResults.length === 0) {
        yield `❌ No videos found matching criteria. Try different preferences.\n`;
        return;
      }

      // Sort by view count and take more than needed for variety
      searchResults.sort((a, b) => b.viewCount - a.viewCount);
      const topVideos = searchResults.slice(
        0,
        Math.min(20, searchResults.length)
      );

      // Analyze videos with Gemini
      yield `🤖 Analyzing videos for quality insights...\n\n`;
      const analyzedVideos: CachedVideo[] = [];

      for (const video of topVideos) {
        const reasoning = await analyzeVideoWithGemini(
          video,
          contentPreference
        );

        analyzedVideos.push({
          videoId: video.videoId,
          title: video.title,
          creator: video.creator,
          thumbnailUrl: video.thumbnailUrl,
          videoUrl: video.videoUrl,
          viewCount: video.viewCount,
          duration: formatDuration(video.duration),
          reasoning,
        });
      }

      // Cache the pool
      yield `💾 Caching ${analyzedVideos.length} videos for future use...\n`;
      await cacheVideoPool(poolKey, analyzedVideos, searchQuery);

      videoPool = {
        videos: analyzedVideos,
        timestamp: Date.now(),
        query: searchQuery,
      };

      yield `✅ Cache updated successfully\n\n`;
    }

    // Get user's seen videos
    yield `🔄 Processing personalization...\n`;
    const seenVideoIds = await getUserSeenVideos(userId);

    // Filter out seen videos
    const unseenVideos = videoPool.videos.filter(
      (video) => !seenVideoIds.has(video.videoId)
    );

    if (unseenVideos.length < VIDEOS_PER_REQUEST) {
      yield `⚠️ Not enough unseen videos. Showing some recent videos.\n`;
      // If not enough unseen videos, just take from the pool
    }

    // Select videos to return
    const videosToReturn = unseenVideos.slice(0, VIDEOS_PER_REQUEST);

    // If still not enough, fill with any videos from pool
    if (videosToReturn.length < VIDEOS_PER_REQUEST) {
      const needed = VIDEOS_PER_REQUEST - videosToReturn.length;
      const fillerVideos = videoPool.videos
        .filter((v) => !videosToReturn.some((vr) => vr.videoId === v.videoId))
        .slice(0, needed);
      videosToReturn.push(...fillerVideos);
    }

    yield `\n🎬 Streaming ${videosToReturn.length} personalized recommendations...\n\n`;

    // Stream videos
    for (const video of videosToReturn) {
      yield {
        type: "video",
        data: video,
      };
      // Small delay for streaming effect
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Update user's seen videos and refresh count
    const returnedVideoIds = videosToReturn.map((v) => v.videoId);
    await markVideosAsSeen(userId, returnedVideoIds);
    await incrementRefreshCount(userId);

    yield `\n✅ Recommendations delivered successfully!\n`;
  } catch (error) {
    console.error("Recommendation error:", error);
    yield `\n❌ Error: ${
      error instanceof Error ? error.message : "Unknown error"
    }\n`;
    throw error;
  }
}
