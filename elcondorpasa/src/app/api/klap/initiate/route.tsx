// src/app/api/klap/initiate/route.ts

import { NextRequest, NextResponse } from "next/server";
import KlapModel from "@/db/models/KlapModel";
import JobModel from "@/db/models/JobModel";

// Simple ID generator function instead of nanoid
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { video_url } = body;

    if (!video_url) {
      return NextResponse.json({ error: "Missing video_url" }, { status: 400 });
    }

    // Validasi YouTube URL
    const youtubeRegex =
      /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w\-]+(&[\w=]*)?$/;
    if (!youtubeRegex.test(video_url)) {
      return NextResponse.json(
        { error: "Currently only YouTube videos are supported" },
        { status: 400 }
      );
    }

    // Get user authentication
    const userId = request.headers.get("x-userId");
    const chatId = request.headers.get("x-telegram-chat-id");

    let finalUserId: string;

    if (userId) {
      finalUserId = userId;
    } else if (chatId) {
      const foundUserId = await KlapModel.getUserIdFromChatId(parseInt(chatId));
      if (!foundUserId) {
        return NextResponse.json(
          { error: "Telegram account not linked" },
          { status: 401 }
        );
      }
      finalUserId = foundUserId;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check token balance
    const tokenCount = await KlapModel.getUserTokenCount(finalUserId);
    if (tokenCount <= 0) {
      return NextResponse.json(
        { error: "Insufficient tokens" },
        { status: 402 }
      );
    }

    // Check if already processing
    const canProcess = await KlapModel.setUserProcessingStatus(
      finalUserId,
      true
    );
    if (!canProcess) {
      return NextResponse.json(
        { error: "Already processing a video" },
        { status: 429 }
      );
    }

    // Create job
    const jobId = generateJobId();
    await JobModel.createJob({
      jobId,
      userId: finalUserId,
      videoUrl: video_url,
      chatId: chatId ? parseInt(chatId) : undefined,
    });

    // Deduct token
    await KlapModel.deductUserToken(finalUserId);

    // Trigger background processing
    triggerBackgroundJob(jobId);

    return NextResponse.json({
      success: true,
      jobId,
      message: "Video processing started",
      checkStatusUrl: `/api/klap/status/${jobId}`,
    });
  } catch (error) {
    // Make sure to reset processing status on error
    const userId = request.headers.get("x-userId");
    if (userId) {
      await KlapModel.setUserProcessingStatus(userId, false);
    }

    console.error("Error in initiate:", error);
    return NextResponse.json(
      { error: "Failed to initiate processing" },
      { status: 500 }
    );
  }
}

// Helper function to trigger background processing
async function triggerBackgroundJob(jobId: string) {
  try {
    // Option 1: Use QStash V2 (Upstash) for reliable background jobs
    if (process.env.QSTASH_TOKEN) {
      const response = await fetch("https://qstash.upstash.io/v2/publish", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
          "Content-Type": "application/json",
          "Upstash-Delay": "1s", // Optional: delay before execution
          "Upstash-Retries": "3",
        },
        body: JSON.stringify({
          url: `${process.env.API_BASE_URL}/api/klap/worker`,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ jobId }),
        }),
      });

      if (!response.ok) {
        console.error("QStash error:", await response.text());
      } else {
        const result = await response.json();
        console.log("QStash job queued:", result);
      }
    }
    // Option 2: Direct call (less reliable but works for testing)
    else {
      fetch(`${process.env.API_BASE_URL}/api/klap/worker`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.INTERNAL_SECRET || "default-secret",
        },
        body: JSON.stringify({ jobId }),
      }).catch((error) => {
        console.error("Failed to trigger background job:", error);
      });
    }
  } catch (error) {
    console.error("Error triggering background job:", error);
  }
}
