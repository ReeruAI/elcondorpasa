import { NextRequest, NextResponse } from "next/server";

const KLAP_API_KEY = process.env.KLAP_API_KEY as string;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { video_url } = body;

    if (!video_url) {
      return NextResponse.json({ error: "Missing video_url" }, { status: 400 });
    }

    if (!KLAP_API_KEY) {
      return NextResponse.json(
        { error: "Missing KLAP_API_KEY" },
        { status: 500 }
      );
    }

    // 1. Start video-to-shorts task with enhanced options
    const taskResponse = await fetch(
      "https://api.klap.app/v2/tasks/video-to-shorts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${KLAP_API_KEY}`,
        },
        body: JSON.stringify({
          source_video_url: video_url,
          language: "en",
          target_clip_count: 1,
          max_clip_count: 1,
          editing_options: {
            captions: true,
            reframe: true,
            emojis: true,
            remove_silences: true,
            intro_title: false,
          },
          min_duration: 15,
          max_duration: 60,
          target_duration: 30,
        }),
      }
    );

    // Check if response is JSON before parsing
    const contentType = taskResponse.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const textResponse = await taskResponse.text();
      console.error("Non-JSON response:", textResponse);
      return NextResponse.json(
        {
          error: "API returned non-JSON response",
          details: textResponse.substring(0, 200),
        },
        { status: 500 }
      );
    }

    const taskData = await taskResponse.json();

    if (!taskResponse.ok) {
      console.error("Task creation failed:", taskData);
      return NextResponse.json(
        { error: taskData.message || "Task creation failed" },
        { status: taskResponse.status }
      );
    }

    const { id: task_id } = taskData;

    if (!task_id) {
      return NextResponse.json(
        { error: "No task_id returned from API", details: taskData },
        { status: 500 }
      );
    }

    // 2. Return task_id immediately for client-side polling
    // Video processing can take 5-15 minutes, too long for a single HTTP request
    return NextResponse.json({
      status: "processing",
      task_id: task_id,
      polling_url: `/api/klap/status/${task_id}`,
    });
  } catch (error) {
    console.error("Klap error:", error);

    // More specific error handling
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json(
        { error: "API returned invalid JSON response" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
