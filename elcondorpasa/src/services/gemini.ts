import { GoogleGenAI, FunctionCallingConfigMode } from "@google/genai";

// Initialize Gemini with your API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! }); // the `!` asserts it's not undefined

/**
 * Clean up common JSON issues from AI-generated output:
 * - Removes trailing commas (before `]` or `}`)
 * - Fixes escaped quotes in strings
 * - Removes any BOM or special characters
 */
function sanitizeJsonString(str: string): string {
  // Remove BOM if present
  let cleaned = str.replace(/^\uFEFF/, "");

  // Remove trailing commas
  cleaned = cleaned.replace(/,\s*([\]{}])/g, "$1");

  // Fix common quote escaping issues
  cleaned = cleaned.replace(/\\'/g, "'");

  // Remove any control characters
  cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

  return cleaned;
}

/**
 * Prompt Gemini with a structured schema and return parsed JSON.
 * @param promptText - The full prompt (e.g. requirements + code)
 * @param responseSchema - A JSON schema describing the expected response
 * @returns Parsed JSON response
 */
export async function generateStructured<T = any>(
  promptText: string,
  responseSchema: object
): Promise<T> {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: promptText,
    config: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const raw = response.text;

  if (!raw) {
    console.error("❌ Gemini returned empty response");
    throw {
      name: "GeminiOutputParseError",
      message: "Gemini returned empty response",
      original: new Error("Empty response"),
    };
  }

  try {
    const sanitized = sanitizeJsonString(raw);
    return JSON.parse(sanitized) as T;
  } catch (err) {
    console.error("❌ Failed to parse Gemini response:", raw);
    console.error("❌ Sanitized version:", sanitizeJsonString(raw));
    console.error("❌ Parse error:", err);
    throw {
      name: "GeminiOutputParseError",
      message: "Gemini returned invalid JSON format. Could not parse.",
      original: err,
    };
  }
}

/**
 * Stream text chunks from Gemini as an AsyncGenerator
 * @param promptText - The prompt to send to Gemini
 * @param model - The Gemini model to use (defaults to "gemini-2.5-flash")
 * @returns AsyncGenerator that yields string chunks
 */
export async function* generateStream(
  promptText: string,
  model: string = "gemini-2.5-flash"
): AsyncGenerator<string, void, unknown> {
  try {
    const response = await ai.models.generateContentStream({
      model,
      contents: promptText,
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    console.error("❌ Gemini streaming error:", error);
    throw {
      name: "GeminiStreamError",
      message: "Failed to stream content from Gemini",
      original: error,
    };
  }
}

/**
 * Stream structured JSON responses from Gemini as an AsyncGenerator
 * @param promptText - The prompt to send to Gemini
 * @param responseSchema - A JSON schema object (not Zod schema)
 * @param model - The Gemini model to use (defaults to "gemini-2.5-flash")
 * @returns AsyncGenerator that yields partial JSON strings
 */
export async function* generateStructuredStream(
  promptText: string,
  responseSchema: object, // Plain JSON schema object
  model: string = "gemini-2.5-flash"
): AsyncGenerator<string, void, unknown> {
  try {
    const response = await ai.models.generateContentStream({
      model,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    console.error("❌ Gemini structured streaming error:", error);
    throw {
      name: "GeminiStructuredStreamError",
      message: "Failed to stream structured content from Gemini",
      original: error,
    };
  }
}

/**
 * Generate smart YouTube search queries using Gemini
 * @param contentPreference - User's content preference
 * @param languagePreference - User's language preference
 * @returns Array of search queries
 */
export async function generateSearchQueries(
  contentPreference: string,
  languagePreference: string
): Promise<string[]> {
  const prompt = `You are helping generate smart YouTube search queries to find trending podcast content.

Input:
- contentPreference: ${contentPreference}
- languagePreference: ${languagePreference}

Your task:
Return 5 concise YouTube search phrases. Each should follow this structure:

    podcast 2025 [relevant, trending keyword based on contentPreference and language]

Requirements:
- Do NOT include celebrity names unless they are podcast hosts (e.g., Joe Rogan, Lex Fridman)
- Avoid generic terms like "AI sports analytics" or "interview with Messi"
- Pick domain-specific or viral terms (e.g., "nba", "saham", "openai", "f1", "finansial", "bitcoin", "startups", "ceo", etc.)
- Respond only with the final search lines, no explanation

Example output for contentPreference = "tech", languagePreference = "English":
podcast 2025 ai
podcast 2025 openai
podcast 2025 lex fridman
podcast 2025 startups
podcast 2025 tech news`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const queries =
    response.text
      ?.trim()
      .split("\n")
      .filter((q) => q.trim()) || [];
  return queries;
}

/**
 * Search YouTube directly using YouTube Data API v3
 * @param query - Search query (e.g., "podcast 2025 ai")
 * @param maxResults - Number of results to return (default: 10)
 * @returns Promise with YouTube search results
 */
async function searchYouTube(query: string, maxResults: number = 10) {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

  if (!YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY environment variable is required");
  }

  // Search for videos from the last month with high engagement
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const publishedAfter = oneMonthAgo.toISOString();

  const searchUrl =
    `https://www.googleapis.com/youtube/v3/search?` +
    `part=snippet&type=video&videoDuration=long&order=viewCount&maxResults=${maxResults}` +
    `&publishedAfter=${publishedAfter}&q=${encodeURIComponent(
      query
    )}&key=${YOUTUBE_API_KEY}`;

  const response = await fetch(searchUrl);

  if (!response.ok) {
    throw new Error(
      `YouTube API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Get additional video details (duration, view count, etc.)
 * @param videoIds - Array of YouTube video IDs
 * @returns Promise with detailed video information
 */
async function getVideoDetails(videoIds: string[]) {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

  if (!YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY environment variable is required");
  }

  const detailsUrl =
    `https://www.googleapis.com/youtube/v3/videos?` +
    `part=contentDetails,statistics,snippet&id=${videoIds.join(
      ","
    )}&key=${YOUTUBE_API_KEY}`;

  const response = await fetch(detailsUrl);

  if (!response.ok) {
    throw new Error(
      `YouTube API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Convert ISO 8601 duration to minutes
 * @param duration - ISO 8601 duration (e.g., "PT1H30M45S")
 * @returns Duration in minutes
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
 * Enhanced YouTube podcast search with Gemini analysis and streaming
 * @param contentPreference - The content preference for searching
 * @param languagePreference - The language preference
 * @returns AsyncGenerator that yields analysis and individual video objects
 */
export async function* generateYouTubePodcastStream(
  contentPreference: string,
  languagePreference: string
): AsyncGenerator<string | { type: "video"; data: any }, void, unknown> {
  try {
    // Step 1: Generate smart search queries with Gemini
    yield `🧠 Generating smart search queries for ${contentPreference} content in ${languagePreference}...\n\n`;

    const searchQueries = await generateSearchQueries(
      contentPreference,
      languagePreference
    );
    yield `✅ Generated ${searchQueries.length} search queries:\n`;
    for (const [index, query] of searchQueries.entries()) {
      yield `${index + 1}. "${query}"\n`;
    }
    yield `\n`;

    // Step 2: Search YouTube with each query
    const allVideos = [];

    for (const [index, query] of searchQueries.entries()) {
      yield `🔍 Searching YouTube for: "${query}"\n`;

      try {
        const searchResults = await searchYouTube(query, 10);
        yield `   Found ${searchResults.length} videos\n`;

        if (searchResults.length > 0) {
          const videoIds = searchResults.map((video: any) => video.id.videoId);
          const videoDetails = await getVideoDetails(videoIds);

          // Combine search results with detailed info
          const videosWithDetails = searchResults.map((video: any) => {
            const details = videoDetails.find(
              (d: any) => d.id === video.id.videoId
            );
            return {
              videoId: video.id.videoId,
              title: video.snippet.title,
              creator: video.snippet.channelTitle,
              thumbnailUrl:
                video.snippet.thumbnails.high?.url ||
                video.snippet.thumbnails.default.url,
              videoUrl: `https://www.youtube.com/watch?v=${video.id.videoId}`,
              publishedAt: video.snippet.publishedAt,
              description: video.snippet.description,
              duration: details?.contentDetails?.duration || "PT0M",
              viewCount: parseInt(details?.statistics?.viewCount || "0"),
              likeCount: parseInt(details?.statistics?.likeCount || "0"),
              searchQuery: query,
            };
          });

          allVideos.push(...videosWithDetails);
          console.log(allVideos);
        }
      } catch (error) {
        yield `   ❌ Error searching "${query}": ${
          error instanceof Error ? error.message : "Unknown error"
        }\n`;
      }
    }

    yield `\n📊 Total videos found: ${allVideos.length}\n\n`;

    // Step 3: Filter and sort videos
    yield `🔄 Filtering videos (30+ minutes, 100k+ views, last month)...\n`;

    const filteredVideos = allVideos.filter((video) => {
      const durationMinutes = parseDurationToMinutes(video.duration);
      const publishedDate = new Date(video.publishedAt);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      return (
        durationMinutes >= 30 &&
        video.viewCount >= 100000 &&
        publishedDate >= oneMonthAgo
      );
    });

    // Sort by view count (descending)
    filteredVideos.sort((a, b) => b.viewCount - a.viewCount);

    yield `✅ ${filteredVideos.length} videos passed filters\n\n`;

    // Step 4: Use Gemini to analyze and reason about top videos
    const topVideos = filteredVideos.slice(0, 5);

    if (topVideos.length === 0) {
      yield `❌ No videos found matching criteria. Try adjusting filters.\n`;
      return;
    }

    yield `🤖 Analyzing videos with Gemini for insights...\n\n`;

    // Step 5: Analyze each video individually with Gemini
    yield `--- Starting Gemini Analysis ---\n`;

    const analyzedVideos = [];

    // Analyze videos one by one for better reliability
    for (let i = 0; i < topVideos.length; i++) {
      const video = topVideos[i];

      try {
        yield `🤖 Analyzing video ${i + 1}/${topVideos.length}: "${
          video.title
        }"...\n`;

        const singleVideoPrompt = `Analyze this YouTube podcast video and explain why it's interesting and relevant for someone interested in ${contentPreference} content.

Video details:
- Title: "${video.title}"
- Creator: ${video.creator}
- Views: ${video.viewCount.toLocaleString()}
- Duration: ${Math.floor(parseDurationToMinutes(video.duration))} minutes
- Description: ${video.description.substring(0, 200)}...

Provide a compelling explanation (2-3 sentences) covering:
1. Why it's interesting (host/guest expertise, trending topics, unique insights)
2. What makes it valuable for ${contentPreference} enthusiasts
3. Key appeal factors

Respond with ONLY the reasoning text, no JSON formatting.`;

        const reasoningResponse = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: singleVideoPrompt,
        });

        const reasoning =
          reasoningResponse.text?.trim() ||
          `This video from ${
            video.creator
          } has garnered ${video.viewCount.toLocaleString()} views, indicating strong viewer interest in ${contentPreference} content. The ${Math.floor(
            parseDurationToMinutes(video.duration)
          )}-minute duration suggests comprehensive coverage of the topic.`;

        const finalVideo = {
          title: video.title,
          creator: video.creator,
          thumbnailUrl: video.thumbnailUrl,
          videoUrl: video.videoUrl,
          viewCount: video.viewCount,
          duration: `${Math.floor(
            parseDurationToMinutes(video.duration)
          )} minutes`,
          reasoning: reasoning,
        };

        analyzedVideos.push(finalVideo);

        // Stream the video immediately after analysis
        yield {
          type: "video",
          data: finalVideo,
        };

        // Small delay for streaming effect
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Failed to analyze video ${i + 1}:`, error);

        // Use fallback reasoning
        const fallbackVideo = {
          title: video.title,
          creator: video.creator,
          thumbnailUrl: video.thumbnailUrl,
          videoUrl: video.videoUrl,
          viewCount: video.viewCount,
          duration: `${Math.floor(
            parseDurationToMinutes(video.duration)
          )} minutes`,
          reasoning: `This trending video from ${
            video.creator
          } has attracted ${video.viewCount.toLocaleString()} views. As a ${Math.floor(
            parseDurationToMinutes(video.duration)
          )}-minute ${contentPreference.toLowerCase()} content piece, it offers substantial value for enthusiasts seeking quality podcast content.`,
        };

        analyzedVideos.push(fallbackVideo);

        yield {
          type: "video",
          data: fallbackVideo,
        };

        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    yield `\n✅ Analysis complete. Streamed ${analyzedVideos.length} videos.\n`;
  } catch (error) {
    console.error("❌ Enhanced YouTube streaming error:", error);
    yield `\n❌ Error: ${
      error instanceof Error ? error.message : "Unknown error"
    }\n`;
    throw {
      name: "EnhancedYouTubeStreamError",
      message: "Failed to stream enhanced YouTube podcast content",
      original: error,
    };
  }
}
