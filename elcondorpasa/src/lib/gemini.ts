import { redis } from "@/db/config/redis";
import { GoogleGenAI } from "@google/genai";
import {
  CachedVideo,
  VideoPool,
  UserDayCache,
  RefreshStatus,
  VideoSearchResult,
  YouTubeSearchResponse,
  YouTubeVideoDetailsResponse,
  YouTubeSearchItem,
  YouTubeVideoDetails,
  HtmlEntities,
} from "@/types";

// Initialize services
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Constants
const CACHE_TTL = 5 * 24 * 60 * 60; // 5 days in seconds
const USER_HISTORY_TTL = 5 * 24 * 60 * 60; // 5 days for seen videos (match your requirement)
const DAILY_REFRESH_LIMIT = 2; // Initial load + 1 refresh = 10 videos total
const VIDEOS_PER_REQUEST = 5;
const MIN_DURATION_MINUTES = 30;
const MAX_DURATION_MINUTES = 150; // Maximum 2.5 hours
const MIN_VIEW_COUNT = 100000;
const MAX_API_RESULTS = 40;
const POOL_REFRESH_THRESHOLD = 10; // Minimum videos needed in pool
const MAX_SEARCH_ATTEMPTS = 3; // Maximum attempts to find new videos
const MIN_ACCEPTABLE_VIDEOS = 3; // Minimum videos to return (relax if needed)

/**
 * Decode HTML entities in text
 */
function decodeHtmlEntities(text: string): string {
  const entities: HtmlEntities = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&#x27;": "'",
    "&#x2F;": "/",
    "&#x60;": "`",
    "&#x3D;": "=",
  };

  return text.replace(/&[#\w]+;/g, (entity) => {
    return entities[entity] || entity;
  });
}
/**
 * Check if content is likely from India based on various indicators
 */
function isLikelyIndianContent(video: VideoSearchResult): boolean {
  const indicators = [
    // Hindi/Indian language indicators
    "hindi",
    "bollywood",
    "desi",
    "bharat",
    "hindustan",
    // Common Indian names/terms
    "sharma",
    "gupta",
    "singh",
    "kumar",
    "verma",
    "patel",
    // Indian cities
    "mumbai",
    "delhi",
    "bangalore",
    "kolkata",
    "chennai",
    "hyderabad",
    // Common Indian YouTube channel patterns
    "india",
    "indian",
    "bharat",
    "desi",
    "hindustani",
    // Hindi words commonly in titles
    "aur",
    "hai",
    "mein",
    "kya",
    "kaise",
    "kaun",
    "jab",
    "tak",
  ];

  const textToCheck =
    `${video.title} ${video.creator} ${video.description}`.toLowerCase();

  const indianScripts = [
    /[\u0900-\u097F]/, // Devanagari (Hindi, Marathi, Sanskrit)
    /[\u0980-\u09FF]/, // Bengali
    /[\u0A00-\u0A7F]/, // Gurmukhi (Punjabi)
    /[\u0A80-\u0AFF]/, // Gujarati
    /[\u0B00-\u0B7F]/, // Odia
    /[\u0B80-\u0BFF]/, // Tamil
    /[\u0C00-\u0C7F]/, // Telugu
    /[\u0C80-\u0CFF]/, // Kannada
    /[\u0D00-\u0D7F]/, // Malayalam
  ];

  // Check for any Indian script
  const hasIndianScript = indianScripts.some((script) =>
    script.test(video.title + video.creator + (video.description || ""))
  );

  if (hasIndianScript) return true;

  // Check for indicators
  return indicators.some((indicator) => textToCheck.includes(indicator));
}

/**
 * Generate a cache key for content/language combination
 */
function getPoolKey(
  contentPreference: string,
  languagePreference: string
): string {
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
    todayCache: `user:${userId}:today:${today}`, // Cache today's delivered videos
  };
}

/**
 * Acquire lock to prevent race conditions
 */
async function acquireUserLock(
  userId: string,
  ttl: number = 10
): Promise<boolean> {
  const lockKey = `lock:${userId}:recommendations`;
  const result = await redis.set(lockKey, "1", "EX", ttl, "NX");
  return result === "OK";
}

/**
 * Release user lock
 */
async function releaseUserLock(userId: string): Promise<void> {
  const lockKey = `lock:${userId}:recommendations`;
  await redis.del(lockKey);
}

/**
 * Validate and fix TTL for seen videos
 */
async function validateSeenVideos(userId: string): Promise<void> {
  const { seenVideos } = getUserKeys(userId);
  const ttl = await redis.ttl(seenVideos);

  // If TTL is missing or too low, reset it
  if (ttl < 0 || ttl < USER_HISTORY_TTL / 2) {
    await redis.expire(seenVideos, USER_HISTORY_TTL);
  }
}

/**
 * Get or set today's cache for user (handles the reroll scenario)
 */
async function getUserTodayCache(userId: string): Promise<UserDayCache | null> {
  const { todayCache } = getUserKeys(userId);
  const cached = await redis.get(todayCache);
  if (!cached) return null;

  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

async function setUserTodayCache(
  userId: string,
  videos: CachedVideo[],
  refreshCount: number
): Promise<void> {
  const { todayCache } = getUserKeys(userId);
  const cache: UserDayCache = {
    videos,
    refreshCount,
    date: new Date().toISOString().split("T")[0],
  };

  // Expire at end of day
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const ttl = Math.floor((tomorrow.getTime() - Date.now()) / 1000);

  await redis.set(todayCache, JSON.stringify(cache), "EX", ttl);
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

  if (current === 1) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const ttl = Math.floor((tomorrow.getTime() - Date.now()) / 1000);
    await redis.expire(refreshCount, ttl);
  }
}

/**
 * Get videos the user has seen in the last 5 days
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
 * Append videos to existing pool
 */
async function appendToVideoPool(
  poolKey: string,
  newVideos: CachedVideo[]
): Promise<void> {
  const existingPool = await getCachedPool(poolKey);
  if (!existingPool) return;

  // Add new videos, avoiding duplicates
  const existingIds = new Set(existingPool.videos.map((v) => v.videoId));
  const uniqueNewVideos = newVideos.filter((v) => !existingIds.has(v.videoId));

  existingPool.videos.push(...uniqueNewVideos);

  await redis.set(poolKey, JSON.stringify(existingPool), "EX", CACHE_TTL);
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
  languagePreference: string,
  modifier: string = ""
): Promise<string> {
  // If Indonesian language is selected, don't add English terms
  const excludeTerms =
    languagePreference === "Indonesian" ? "" : "-hindi -india";

  const prompt = `Generate ONE concise YouTube search query for finding trending podcast content.

Input:
- Content: ${contentPreference} ${modifier}
- Language: ${languagePreference}

Requirements:
- Include "podcast 2025" in the query
- Add 1-2 relevant trending keywords based on content preference
- Keep it short (4-6 words max)
- Focus on quality content creators if applicable
- If language is not Indonesian, prefer international/western content

Example outputs:
- For Tech/English: "podcast 2025 ai startups"
- For Entertainment/Indonesian: "podcast 2025 komedi indonesia"
- For Business/English: "podcast 2025 entrepreneurship silicon valley"

Return ONLY the search query, no explanation.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: prompt,
  });

  const baseQuery =
    response.text?.trim() || `podcast 2025 ${contentPreference.toLowerCase()}`;

  // Add exclusion terms if not Indonesian content
  return languagePreference === "Indonesian"
    ? baseQuery
    : `${baseQuery} ${excludeTerms}`;
}

/**
 * Search YouTube with relaxed criteria if needed
 */
async function searchYouTubeWithRelaxedCriteria(
  query: string,
  attemptNumber: number = 1
): Promise<VideoSearchResult[]> {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY environment variable is required");
  }

  // Progressively relax criteria based on attempt number
  const monthsBack = attemptNumber; // 1 month, then 2, then 3
  const minDuration = Math.max(20, MIN_DURATION_MINUTES - attemptNumber * 5); // 30, 25, 20
  const minViews = Math.max(
    10000,
    MIN_VIEW_COUNT / Math.pow(10, attemptNumber)
  ); // 100k, 10k, 1k

  const searchDate = new Date();
  searchDate.setMonth(searchDate.getMonth() - monthsBack);
  const publishedAfter = searchDate.toISOString();

  // Add region parameter to prefer non-Indian content
  const searchUrl =
    `https://www.googleapis.com/youtube/v3/search?` +
    `part=snippet&type=video&videoDuration=long&order=viewCount` +
    `&maxResults=${MAX_API_RESULTS}&publishedAfter=${publishedAfter}` +
    `&regionCode=US` + // Add region code to get more international content
    `&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;

  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    throw new Error(`YouTube API error: ${searchResponse.status}`);
  }

  const searchData: YouTubeSearchResponse = await searchResponse.json();
  const videos = searchData.items || [];

  if (videos.length === 0) return [];

  const videoIds = videos.map((v: YouTubeSearchItem) => v.id.videoId).join(",");
  const detailsUrl =
    `https://www.googleapis.com/youtube/v3/videos?` +
    `part=contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;

  const detailsResponse = await fetch(detailsUrl);
  if (!detailsResponse.ok) {
    throw new Error(`YouTube API error: ${detailsResponse.status}`);
  }

  const detailsData: YouTubeVideoDetailsResponse = await detailsResponse.json();
  const videoDetails = detailsData.items || [];

  return videos
    .map((video: YouTubeSearchItem): VideoSearchResult => {
      const details = videoDetails.find(
        (d: YouTubeVideoDetails) => d.id === video.id.videoId
      );
      const durationMinutes = details
        ? parseDurationToMinutes(details.contentDetails?.duration || "PT0M")
        : 0;
      const viewCount = parseInt(details?.statistics?.viewCount || "0");

      return {
        videoId: video.id.videoId,
        title: decodeHtmlEntities(video.snippet.title), // DECODE HTML ENTITIES
        creator: decodeHtmlEntities(video.snippet.channelTitle), // DECODE HTML ENTITIES
        thumbnailUrl:
          video.snippet.thumbnails.high?.url ||
          video.snippet.thumbnails.default.url,
        videoUrl: `https://www.youtube.com/watch?v=${video.id.videoId}`,
        duration: details?.contentDetails?.duration || "PT0M",
        viewCount,
        durationMinutes,
        publishedAt: video.snippet.publishedAt,
        description: decodeHtmlEntities(
          video.snippet.description.substring(0, 200)
        ), // DECODE HTML ENTITIES
      };
    })
    .filter(
      (video: VideoSearchResult) =>
        video.durationMinutes >= minDuration &&
        video.durationMinutes <= MAX_DURATION_MINUTES &&
        video.viewCount >= minViews &&
        !isLikelyIndianContent(video) // EXCLUDE INDIAN CONTENT
    );
}

/**
 * Analyze videos with Gemini
 */
async function analyzeVideoWithGemini(
  video: VideoSearchResult,
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
  } catch {
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
  // Acquire lock to prevent race conditions
  const lockAcquired = await acquireUserLock(userId);
  if (!lockAcquired) {
    yield ` Another request is in progress. Please wait a moment and try again.\n`;
    return;
  }

  try {
    // Validate seen videos TTL
    await validateSeenVideos(userId);

    // Check if we already served videos today (handles reroll case)
    const todayCache = await getUserTodayCache(userId);
    if (todayCache && todayCache.refreshCount >= DAILY_REFRESH_LIMIT) {
      yield ` Daily limit reached. Returning your previous selection...\n\n`;

      // When refresh is exhausted, always return the last 5 videos
      // Don't filter by seen status - user explicitly wants their last selection
      const lastVideos = todayCache.videos.slice(-5);

      if (lastVideos.length === 0) {
        yield ` No videos found in today's cache. This shouldn't happen!\n`;
        return;
      }

      yield ` Returning your last ${lastVideos.length} video recommendations.\n\n`;

      for (const video of lastVideos) {
        yield {
          type: "video",
          data: video,
        };
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      yield `\n These are your videos for today! Come back tomorrow for fresh content.\n`;
      return;
    }

    // Check refresh limit
    yield ` Checking refresh limit for today...\n`;
    const { canRefresh, count } = await canUserRefresh(userId);

    if (!canRefresh) {
      yield `❌ Daily refresh limit reached (${count}/${DAILY_REFRESH_LIMIT}). Try again tomorrow!\n`;
      return;
    }

    yield ` Refresh ${count + 1}/${DAILY_REFRESH_LIMIT} for today\n\n`;

    // Get pool key and user's seen videos
    const poolKey = getPoolKey(contentPreference, languagePreference);
    const seenVideoIds = await getUserSeenVideos(userId);

    yield `🔍 Checking for unseen content...\n`;
    yield `📚 You've seen ${seenVideoIds.size} videos in the last 5 days\n\n`;

    // Get cached pool
    let videoPool = await getCachedPool(poolKey);

    // Calculate available unseen videos
    let unseenVideos: CachedVideo[] = [];
    if (videoPool) {
      unseenVideos = videoPool.videos.filter(
        (video) => !seenVideoIds.has(video.videoId)
      );
    }

    // Check if we need to fetch more videos
    const needMoreVideos =
      !videoPool || unseenVideos.length < POOL_REFRESH_THRESHOLD;

    if (needMoreVideos) {
      yield ` Need more videos. Fetching fresh content...\n\n`;

      let searchAttempt = 1;
      const totalAnalyzedVideos: CachedVideo[] = [];
      const allSeenVideoIds = new Set(seenVideoIds);

      while (
        searchAttempt <= MAX_SEARCH_ATTEMPTS &&
        totalAnalyzedVideos.length < POOL_REFRESH_THRESHOLD
      ) {
        // Generate search query with variations
        yield ` Generating search query (attempt ${searchAttempt}/${MAX_SEARCH_ATTEMPTS})...\n`;

        const queryModifiers = ["", "trending", "popular", "best", "viral"];
        const modifier = queryModifiers[searchAttempt - 1] || "";

        const searchQuery = await generateSearchQuery(
          contentPreference,
          languagePreference,
          modifier
        );
        yield ` Search query: "${searchQuery}"\n\n`;

        // Search YouTube with progressively relaxed criteria
        yield ` Searching YouTube for trending podcasts...\n`;
        const searchResults = await searchYouTubeWithRelaxedCriteria(
          searchQuery,
          searchAttempt
        );

        if (searchAttempt > 1) {
          yield ` Relaxed criteria: ${Math.max(
            20,
            MIN_DURATION_MINUTES - searchAttempt * 5
          )}-${MAX_DURATION_MINUTES} minutes, ${Math.max(
            10000,
            MIN_VIEW_COUNT / Math.pow(10, searchAttempt)
          ).toLocaleString()}+ views\n`;
        }

        yield ` Found ${searchResults.length} videos matching criteria\n\n`;

        if (searchResults.length === 0) {
          if (searchAttempt < MAX_SEARCH_ATTEMPTS) {
            yield ` No results. Trying with different criteria...\n\n`;
            searchAttempt++;
            continue;
          } else {
            yield ` No videos found after ${MAX_SEARCH_ATTEMPTS} attempts.\n`;
            break;
          }
        }

        // Filter out already seen videos
        const newSearchResults = searchResults.filter(
          (video) => !allSeenVideoIds.has(video.videoId)
        );

        yield ` Found ${newSearchResults.length} new videos you haven't seen\n\n`;

        if (newSearchResults.length === 0) {
          if (searchAttempt < MAX_SEARCH_ATTEMPTS) {
            yield ` All videos already seen. Trying different search...\n\n`;
            searchAttempt++;
            continue;
          } else {
            yield ` No new unique videos found.\n`;
            break;
          }
        }

        // Sort by view count and analyze
        newSearchResults.sort((a, b) => b.viewCount - a.viewCount);
        const topVideos = newSearchResults.slice(
          0,
          Math.min(15, newSearchResults.length)
        );

        // Analyze videos with Gemini
        yield ` Analyzing ${topVideos.length} videos for quality insights...\n\n`;

        for (const video of topVideos) {
          // Skip if we already have enough
          if (totalAnalyzedVideos.length >= POOL_REFRESH_THRESHOLD) break;

          const reasoning = await analyzeVideoWithGemini(
            video,
            contentPreference
          );

          totalAnalyzedVideos.push({
            videoId: video.videoId,
            title: video.title,
            creator: video.creator,
            thumbnailUrl: video.thumbnailUrl,
            videoUrl: video.videoUrl,
            viewCount: video.viewCount,
            duration: formatDuration(video.duration),
            reasoning,
          });

          // Add to seen set to avoid duplicates in next iteration
          allSeenVideoIds.add(video.videoId);
        }

        yield ` Analyzed ${totalAnalyzedVideos.length} total videos so far\n\n`;
        searchAttempt++;
      }

      // Update cache with whatever we found
      if (totalAnalyzedVideos.length > 0) {
        if (!videoPool) {
          yield ` Creating new video pool with ${totalAnalyzedVideos.length} videos...\n`;
          await cacheVideoPool(poolKey, totalAnalyzedVideos, "multi-search");
        } else {
          yield ` Adding ${totalAnalyzedVideos.length} new videos to pool...\n`;
          await appendToVideoPool(poolKey, totalAnalyzedVideos);
        }
      } else {
        yield ` Unable to find any suitable videos for this preference combination.\n`;
        yield ` Consider trying different preferences or checking back later.\n`;
      }

      // Refresh our pool reference
      videoPool = await getCachedPool(poolKey);
      yield ` Pool now contains ${videoPool?.videos.length || 0} videos\n\n`;

      // Recalculate unseen videos
      unseenVideos = videoPool
        ? videoPool.videos.filter((video) => !seenVideoIds.has(video.videoId))
        : [];
    } else {
      yield ` Found ${unseenVideos.length} unseen videos in cache\n\n`;
    }

    // Select videos to return
    let videosToReturn: CachedVideo[] = [];

    // Handle insufficient unseen videos
    if (unseenVideos.length < VIDEOS_PER_REQUEST) {
      yield ` Only ${unseenVideos.length} unseen videos available.\n`;

      // Check if we can accept fewer videos
      if (unseenVideos.length >= MIN_ACCEPTABLE_VIDEOS) {
        yield ` Proceeding with ${unseenVideos.length} videos (minimum ${MIN_ACCEPTABLE_VIDEOS} met).\n`;
        videosToReturn = unseenVideos;
      } else {
        yield ` Attempting emergency search for more content...\n`;

        // Try multiple emergency searches with very relaxed criteria
        const emergencyQueries = [
          `${contentPreference} podcast discussion`,
          `podcast ${
            languagePreference === "Indonesian" ? "indonesia" : "english"
          } talk`,
          `${contentPreference} interview show`,
          `trending podcast ${new Date().getFullYear()}`,
        ];

        for (const emergencyQuery of emergencyQueries) {
          yield ` Emergency search: "${emergencyQuery}"\n`;

          // Search with very relaxed criteria
          const emergencyResults = await searchYouTubeWithRelaxedCriteria(
            emergencyQuery,
            3
          );
          const newEmergencyVideos = emergencyResults.filter(
            (video) =>
              !seenVideoIds.has(video.videoId) &&
              !unseenVideos.some((v) => v.videoId === video.videoId) &&
              !isLikelyIndianContent(video) // EXCLUDE INDIAN CONTENT IN EMERGENCY SEARCH
          );

          if (newEmergencyVideos.length > 0) {
            yield ` Found ${newEmergencyVideos.length} emergency videos\n`;

            // Quick analysis
            for (const video of newEmergencyVideos.slice(0, 5)) {
              const reasoning = await analyzeVideoWithGemini(
                video,
                contentPreference
              );
              unseenVideos.push({
                videoId: video.videoId,
                title: video.title,
                creator: video.creator,
                thumbnailUrl: video.thumbnailUrl,
                videoUrl: video.videoUrl,
                viewCount: video.viewCount,
                duration: formatDuration(video.duration),
                reasoning,
              });

              if (unseenVideos.length >= MIN_ACCEPTABLE_VIDEOS) break;
            }

            if (unseenVideos.length >= MIN_ACCEPTABLE_VIDEOS) break;
          }
        }

        // Update pool with emergency videos
        if (unseenVideos.length > 0) {
          await appendToVideoPool(poolKey, unseenVideos);
        }

        videosToReturn = unseenVideos;
      }
    } else {
      // We have enough videos
      videosToReturn = unseenVideos.slice(0, VIDEOS_PER_REQUEST);
    }

    // Final deduplication check
    const finalVideos: CachedVideo[] = [];
    const returnedIds = new Set<string>();

    for (const video of videosToReturn) {
      if (!returnedIds.has(video.videoId)) {
        finalVideos.push(video);
        returnedIds.add(video.videoId);
      }
    }

    if (finalVideos.length < videosToReturn.length) {
      yield ` Removed ${
        videosToReturn.length - finalVideos.length
      } duplicate(s) from selection.\n`;
    }

    if (finalVideos.length === 0) {
      yield ` Unable to find any unique videos for this preference combination.\n`;
      yield `\n Suggestions:\n`;
      yield `• Try a different content preference\n`;
      yield `• Switch language preference\n`;
      yield `• Check back tomorrow for new content\n`;
      yield `• Contact support if this persists\n`;

      // Log this scenario for monitoring
      console.error(
        `No videos found for user ${userId} with ${contentPreference}/${languagePreference}`
      );

      return;
    }

    // Warn if returning fewer than requested
    if (finalVideos.length < VIDEOS_PER_REQUEST) {
      yield `\n Note: Only ${finalVideos.length} unique videos available (requested ${VIDEOS_PER_REQUEST}).\n`;
      yield `This combination has limited content on YouTube.\n`;
    }

    yield `\n Streaming ${finalVideos.length} personalized recommendations...\n\n`;

    // Stream videos
    for (const video of finalVideos) {
      yield {
        type: "video",
        data: video,
      };
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Update user's seen videos
    const returnedVideoIds = finalVideos.map((v) => v.videoId);
    await markVideosAsSeen(userId, returnedVideoIds);

    // Update today's cache (for reroll handling)
    const existingToday = await getUserTodayCache(userId);
    const allTodayVideos = existingToday
      ? [...existingToday.videos, ...finalVideos]
      : finalVideos;

    await setUserTodayCache(userId, allTodayVideos, count + 1);

    // Increment refresh count
    await incrementRefreshCount(userId);

    yield `\n Recommendations delivered successfully!\n`;
    yield ` You've now seen ${
      seenVideoIds.size + returnedVideoIds.length
    } unique videos total\n`;
  } catch (error) {
    console.error("Recommendation error:", error);
    yield `\n Error: ${
      error instanceof Error ? error.message : "Unknown error"
    }\n`;
    throw error;
  } finally {
    // Always release lock
    await releaseUserLock(userId);
  }
}
