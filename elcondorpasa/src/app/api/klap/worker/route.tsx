// src/app/api/klap/worker/route.ts

import { NextRequest, NextResponse } from "next/server";
import JobModel from "@/db/models/JobModel";
import KlapModel from "@/db/models/KlapModel";
import { KlapShort } from "@/types";

const KLAP_API_KEY = process.env.KLAP_API_KEY!;

// Helper function to send Telegram message
async function sendTelegramMessage(chatId: number, message: string) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      }
    );

    if (!response.ok) {
      console.error("Failed to send Telegram message:", await response.text());
    }
  } catch (error) {
    console.error("Error sending Telegram message:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify internal secret or QStash signature
    const secret = request.headers.get("x-internal-secret");
    const qstashSignature = request.headers.get("upstash-signature");

    if (!secret && !qstashSignature) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (secret && secret !== process.env.INTERNAL_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    const { jobId } = await request.json();

    // Get job details
    const job = await JobModel.getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "pending") {
      return NextResponse.json(
        {
          message: "Job already processed or processing",
        },
        { status: 200 }
      );
    }

    // Start processing
    await JobModel.updateJob(jobId, { status: "processing", progress: 0 });

    try {
      // Get user language preference
      const language = await KlapModel.getUserLanguagePreference(job.userId);
      console.log(`User language preference: ${language}`);

      // 1. Create Klap task
      await JobModel.updateJob(jobId, { progress: 10 });

      const taskPayload = {
        source_video_url: job.videoUrl,
        target_clip_count: 1,
        max_clip_count: 1,
        min_duration: 15,
        max_duration: 60,
        target_duration: 50,
        editing_options: {
          captions: true,
          reframe: true,
          emojis: true,
          intro_title: true,
          remove_silences: false,
          width: 1080,
          height: 1920,
        },
      };

      const taskResponse = await fetch(
        "https://api.klap.app/v2/tasks/video-to-shorts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${KLAP_API_KEY}`,
          },
          body: JSON.stringify(taskPayload),
        }
      );

      if (!taskResponse.ok) {
        throw new Error(`Task creation failed: ${await taskResponse.text()}`);
      }

      const taskData = await taskResponse.json();
      const taskId = taskData.id;

      await JobModel.updateJob(jobId, { progress: 20 });

      // 2. Poll for task completion
      let taskCompleted = false;
      let taskResult = null;

      for (let i = 0; i < 120; i++) {
        await new Promise((resolve) => setTimeout(resolve, 15000)); // 15 seconds

        const pollRes = await fetch(`https://api.klap.app/v2/tasks/${taskId}`, {
          headers: {
            Authorization: `Bearer ${KLAP_API_KEY}`,
          },
        });

        const pollData = await pollRes.json();

        if (["ready", "done", "completed"].includes(pollData.status)) {
          taskCompleted = true;
          taskResult = pollData;
          break;
        } else if (["failed", "error"].includes(pollData.status)) {
          throw new Error("Task processing failed");
        }

        await JobModel.updateJob(jobId, {
          progress: 20 + Math.floor((i / 120) * 50),
        });
      }

      if (!taskCompleted || !taskResult) {
        throw new Error("Task timeout");
      }

      // 3. Get shorts with retries
      await JobModel.updateJob(jobId, { progress: 75 });

      let shorts: KlapShort[] = [];
      for (let attempt = 0; attempt < 5; attempt++) {
        const projectRes = await fetch(
          `https://api.klap.app/v2/projects/${taskResult.output_id}`,
          {
            headers: {
              Authorization: `Bearer ${KLAP_API_KEY}`,
            },
          }
        );

        if (projectRes.ok) {
          const data = await projectRes.json();
          if (Array.isArray(data) && data.length > 0) {
            shorts = data;
            break;
          }
        }

        if (attempt < 4) {
          await new Promise((resolve) => setTimeout(resolve, 20000));
        }
      }

      if (shorts.length === 0) {
        throw new Error("No shorts generated");
      }

      const bestShort = shorts[0];

      // 4. Export short
      await JobModel.updateJob(jobId, { progress: 85 });

      const exportRes = await fetch(
        `https://api.klap.app/v2/projects/${bestShort.folder_id}/${bestShort.id}/exports`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${KLAP_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const exportData = await exportRes.json();
      const exportId = exportData.id;

      // 5. Wait for export
      let _exportCompleted = false;
      let exportResult = null;

      for (let i = 0; i < 60; i++) {
        await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 seconds

        const statusRes = await fetch(
          `https://api.klap.app/v2/projects/${bestShort.folder_id}/${bestShort.id}/exports/${exportId}`,
          {
            headers: {
              Authorization: `Bearer ${KLAP_API_KEY}`,
            },
          }
        );

        const statusData = await statusRes.json();

        if (["ready", "done", "completed"].includes(statusData.status)) {
          _exportCompleted = true;
          exportResult = statusData;
          break;
        }

        await JobModel.updateJob(jobId, {
          progress: 85 + Math.floor((i / 60) * 10),
        });
      }

      const downloadUrl = exportResult?.src_url || exportResult?.download_url;

      // 6. Save to database
      await KlapModel.addUserShort(job.userId, {
        title: bestShort.name,
        virality_score: bestShort.virality_score,
        captions: {
          tiktok: bestShort.publication_captions?.tiktok || "",
          youtube: bestShort.publication_captions?.youtube || "",
          linkedin: bestShort.publication_captions?.linkedin || "",
          instagram: bestShort.publication_captions?.instagram || "",
        },
        download_url: downloadUrl,
        description: bestShort.virality_score_explanation || "",
      });

      // 7. Update job as completed
      await JobModel.updateJob(jobId, {
        status: "completed",
        progress: 100,
        result: {
          short: bestShort,
          downloadUrl,
        },
        completedAt: new Date(),
      });

      // 8. Send notifications
      if (job.chatId) {
        await sendTelegramMessage(
          job.chatId,
          `✅ *Video Ready!*\n\n` +
            `🎬 *Title:* ${bestShort.name}\n` +
            `🎯 *Virality Score:* ${bestShort.virality_score}/100\n` +
            `💡 *Analysis:*\n_${bestShort.virality_score_explanation}_\n\n` +
            `📝 *Caption:*\n${
              bestShort.publication_captions?.tiktok || ""
            }\n\n` +
            `💾 *Download:* ${downloadUrl}\n\n` +
            `🌐 *View in Dashboard:* ${process.env.API_BASE_URL}/your-clip`
        );
      }

      // Reset user processing status
      await KlapModel.setUserProcessingStatus(job.userId, false);

      return NextResponse.json({ success: true });
    } catch (error) {
      // Handle errors
      await JobModel.updateJob(jobId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      if (job.chatId) {
        await sendTelegramMessage(
          job.chatId,
          `❌ *Processing Failed*\n\n` +
            `Error: ${
              error instanceof Error ? error.message : "Unknown error"
            }\n\n` +
            `Please try again later.`
        );
      }

      await KlapModel.setUserProcessingStatus(job.userId, false);

      throw error;
    }
  } catch (error) {
    console.error("Worker error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Worker error" },
      { status: 500 }
    );
  }
}
