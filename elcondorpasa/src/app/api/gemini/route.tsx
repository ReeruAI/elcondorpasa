import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { preferenceSchema } from "@/schemas";
import { generateYouTubePodcastStream } from "@/services/gemini";

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
    // Parse and validate request body
    const body = await request.json();
    const validatedData = preferenceSchema.parse(body);

    const { userId, contentPreference, languagePreference } = validatedData;

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
          let jsonContent = "";
          let finalJsonStarted = false;
          let searchProgress = "";

          // Use the enhanced YouTube API service for streaming
          const streamGenerator = generateYouTubePodcastStream(
            contentPreference,
            languagePreference
          );

          // Stream the response
          for await (const chunk of streamGenerator) {
            if (chunk) {
              // Check if we've reached the final results JSON
              if (chunk.includes("--- Final Results with Real Data ---")) {
                finalJsonStarted = true;

                // Send analysis completion message
                const analysisData = `data: ${JSON.stringify({
                  analysisComplete: true,
                  message:
                    "Gemini analysis completed, sending final results...",
                  searchSummary: searchProgress.substring(0, 500) + "...",
                })}\n\n`;
                controller.enqueue(encoder.encode(analysisData));
                continue;
              }

              if (finalJsonStarted) {
                // This is the final JSON content with reasoning
                jsonContent += chunk;

                // Send JSON chunk to client
                const data = `data: ${JSON.stringify({
                  chunk: chunk,
                  accumulated: jsonContent,
                  isFinalJson: true,
                })}\n\n`;
                controller.enqueue(encoder.encode(data));
              } else {
                // This is search/analysis process content
                searchProgress += chunk;

                // Determine the type of progress
                let progressType = "general";
                if (chunk.includes("🧠 Generating"))
                  progressType = "queryGeneration";
                else if (chunk.includes("🔍 Searching"))
                  progressType = "youtubeSearch";
                else if (chunk.includes("🔄 Filtering"))
                  progressType = "filtering";
                else if (chunk.includes("🤖 Analyzing"))
                  progressType = "geminiAnalysis";

                const data = `data: ${JSON.stringify({
                  chunk: chunk,
                  progressType: progressType,
                })}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
            }
          }

          // Try to parse final accumulated JSON content
          try {
            const cleanJsonContent = jsonContent.trim();
            const finalResponse = JSON.parse(cleanJsonContent);
            const validatedResponse =
              youtubeVideosResponseSchema.parse(finalResponse);

            // Send final validated response with metadata
            const finalData = `data: ${JSON.stringify({
              final: true,
              data: validatedResponse,
              userId,
              source: "YouTube Data API v3 + Gemini Analysis",
              timestamp: new Date().toISOString(),
              contentPreference,
              languagePreference,
            })}\n\n`;
            controller.enqueue(encoder.encode(finalData));
          } catch (parseError) {
            console.error("Failed to parse final response:", parseError);
            console.error("JSON content was:", jsonContent);

            const errorData = `data: ${JSON.stringify({
              error: "Failed to parse complete response",
              accumulated: jsonContent,
              details:
                parseError instanceof Error
                  ? parseError.message
                  : String(parseError),
            })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
          }

          // Close the stream
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          const errorData = `data: ${JSON.stringify({
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
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
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
