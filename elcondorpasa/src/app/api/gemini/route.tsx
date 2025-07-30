import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { preferenceSchema } from "@/schemas";

import HistoryModel from "@/db/models/HistoryModel";
import { getYouTubeRecommendations } from "@/lib/gemini";

const encoder = new TextEncoder();

export async function POST(request: NextRequest) {
  try {
    // Validate request method
    // Get userId from headers
    const userId = request.headers.get("x-userId");

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "User ID not found in headers",
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = preferenceSchema.parse({
      ...body,
      userId,
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
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const collectedVideos: any[] = [];
          let isExhaustedRefresh = false; // Track if this is an exhausted refresh

          // Get recommendations (with caching and deduplication)
          const streamGenerator = getYouTubeRecommendations(
            userId,
            contentPreference,
            languagePreference
          );

          // Stream the response
          for await (const chunk of streamGenerator) {
            if (typeof chunk === "string") {
              // Check if this is an exhausted refresh response
              if (
                chunk.includes(
                  "Daily limit reached. Returning your previous selection"
                )
              ) {
                isExhaustedRefresh = true;
              }

              // Progress updates
              let progressType = "general";
              if (chunk.includes("Cache hit!")) progressType = "cacheHit";
              else if (chunk.includes("Checking refresh limit"))
                progressType = "refreshCheck";
              else if (chunk.includes("Daily limit reached"))
                progressType = "limitReached";
              else if (chunk.includes("Generating"))
                progressType = "queryGeneration";
              else if (chunk.includes("Searching"))
                progressType = "youtubeSearch";
              else if (chunk.includes("Processing"))
                progressType = "processing";
              else if (chunk.includes("Analyzing"))
                progressType = "geminiAnalysis";
              else if (chunk.includes("Caching")) progressType = "caching";

              const data = `data: ${JSON.stringify({
                type: "progress",
                progressType: progressType,
                message: chunk.trim(),
              })}\n\n`;
              controller.enqueue(encoder.encode(data));
            } else if (chunk.type === "video") {
              // Individual video result
              collectedVideos.push(chunk.data);

              const videoData = `data: ${JSON.stringify({
                type: "video",
                data: chunk.data,
                index: collectedVideos.length - 1,
                totalCount: 5,
              })}\n\n`;
              controller.enqueue(encoder.encode(videoData));
            }
          }

          // Save to history database ONLY if NOT exhausted refresh
          if (collectedVideos.length > 0 && !isExhaustedRefresh) {
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
              console.log("History saved successfully with ID:", historyId);
            } catch (dbError) {
              console.error("Failed to save history:", dbError);
            }
          } else if (isExhaustedRefresh) {
            console.log("Skipped history save - exhausted refresh request");
          }

          // Send completion message
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
            isExhaustedRefresh, // Include this flag in response
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
        "X-Accel-Buffering": "no",
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
