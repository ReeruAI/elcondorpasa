import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { preferenceSchema } from "@/schemas";
import { generateYouTubePodcastStream } from "@/services/gemini";
import { cookies } from "next/headers";
import HistoryModel from "@/db/models/HistoryModel";

// Enhanced output schema with reasoning
const youtubeVideoSchema = z.object({
  title: z.string(),
  thumbnailUrl: z.string(),
  videoUrl: z.string(),
  creator: z.string(),
  viewCount: z.number(),
  duration: z.string(),
  reasoning: z.string(),
});

const youtubeVideosResponseSchema = z.object({
  videos: z.array(youtubeVideoSchema).max(5),
});

export async function POST(request: NextRequest) {
  try {
    // Get userId from cookies
    const userId = request.headers.get("x-userId");

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "User ID not found in cookies",
        },
        { status: 401 }
      );
    }

    // Parse and validate request body (without userId)
    const body = await request.json();
    const validatedData = preferenceSchema.parse({
      ...body,
      userId, // Add userId from cookies to the validation
    });

    const { contentPreference, languagePreference } = validatedData;

    // Check for required environment variables
    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json(
        {
          error: "YouTube API key not configured",
          message: "YOUTUBE_API_KEY environment variable is required",
        },
        { status: 500 }
      );
    }

    // Set up streaming response
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const collectedVideos: any[] = [];

          // Use the enhanced YouTube API service for streaming
          const streamGenerator = generateYouTubePodcastStream(
            contentPreference,
            languagePreference
          );

          // Stream the response
          for await (const chunk of streamGenerator) {
            if (typeof chunk === "string") {
              // This is progress text
              let progressType = "general";
              if (chunk.includes("🧠 Generating"))
                progressType = "queryGeneration";
              else if (chunk.includes("🔍 Searching"))
                progressType = "youtubeSearch";
              else if (chunk.includes("🔄 Filtering"))
                progressType = "filtering";
              else if (chunk.includes("🤖 Analyzing"))
                progressType = "geminiAnalysis";
              else if (chunk.includes("--- Starting Gemini Analysis ---"))
                progressType = "analysisStarted";
              else if (chunk.includes("--- Streaming Video Results ---"))
                progressType = "videosStarted";

              const data = `data: ${JSON.stringify({
                type: "progress",
                progressType: progressType,
                message: chunk.trim(),
              })}\n\n`;
              controller.enqueue(encoder.encode(data));
            } else if (chunk.type === "video") {
              // This is an individual video result
              collectedVideos.push(chunk.data);

              // Send individual video to frontend
              const videoData = `data: ${JSON.stringify({
                type: "video",
                data: chunk.data,
                index: collectedVideos.length - 1,
                totalCount: 5, // We know we're getting 5 videos
              })}\n\n`;
              controller.enqueue(encoder.encode(videoData));
            }
          }

          // Save to history database before sending completion
          if (collectedVideos.length > 0) {
            try {
              const historyData = {
                userId,
                contentPreference,
                languagePreference,
                videos: collectedVideos,
                source: "YouTube Data API v3 + Gemini Analysis",
                timestamp: new Date(),
              };

              const historyId = await HistoryModel.createHistory(historyData);
              console.log("✅ History saved successfully with ID:", historyId);
              console.log(
                `✅ Saved ${collectedVideos.length} videos to history`
              );
            } catch (dbError) {
              console.error("❌ Failed to save history:", dbError);
              // Don't fail the whole request if history save fails
              // You might want to add a flag in the response to indicate save failure
            }
          } else {
            console.log("⚠️ No videos collected, skipping history save");
          }

          // Send completion message with all collected videos
          const completionData = `data: ${JSON.stringify({
            type: "complete",
            data: {
              videos: collectedVideos,
            },
            userId,
            source: "YouTube Data API v3 + Gemini Analysis",
            timestamp: new Date().toISOString(),
            contentPreference,
            languagePreference,
          })}\n\n`;
          controller.enqueue(encoder.encode(completionData));

          // Close the stream
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          const errorData = `data: ${JSON.stringify({
            type: "error",
            error: "Stream failed",
            message: error instanceof Error ? error.message : "Unknown error",
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    // Return streaming response
    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disable Nginx buffering
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("API Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
