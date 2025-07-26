import { NextRequest, NextResponse } from "next/server";

const KLAP_API_KEY = process.env.KLAP_API_KEY as string;

export async function GET(
  request: NextRequest,
  { params }: { params: { task_id: string } }
) {
  try {
    const { task_id } = params;

    if (!task_id) {
      return NextResponse.json({ error: "Missing task_id" }, { status: 400 });
    }

    if (!KLAP_API_KEY) {
      return NextResponse.json(
        { error: "Missing KLAP_API_KEY" },
        { status: 500 }
      );
    }

    // Poll task status
    const pollRes = await fetch(`https://api.klap.app/v2/tasks/${task_id}`, {
      headers: {
        Authorization: `Bearer ${KLAP_API_KEY}`,
      },
    });

    // Check if polling response is JSON
    const pollContentType = pollRes.headers.get("content-type");
    if (!pollContentType || !pollContentType.includes("application/json")) {
      const pollTextResponse = await pollRes.text();
      console.error("Non-JSON polling response:", pollTextResponse);
      return NextResponse.json(
        { error: "Polling API returned non-JSON response" },
        { status: 500 }
      );
    }

    const pollData = await pollRes.json();

    if (!pollRes.ok) {
      console.error("Polling failed:", pollData);
      return NextResponse.json(
        { error: pollData.message || "Polling failed" },
        { status: pollRes.status }
      );
    }

    const status = pollData.status;

    // If still processing, return current status
    if (status === "processing") {
      return NextResponse.json({
        status: "processing",
        message: "Video is still being processed",
      });
    }

    // If failed, return error
    if (status === "failed") {
      return NextResponse.json(
        { error: "Task failed", details: pollData },
        { status: 500 }
      );
    }

    // If ready/done, return the output_id for next step
    if (status === "ready" || status === "done") {
      return NextResponse.json({
        status: status,
        output_id: pollData.details?.output_id || pollData.output_id,
        details: pollData.details || pollData,
        next_step: `/api/klap/ideas/${
          pollData.details?.output_id || pollData.output_id
        }`,
      });
    }

    // Unknown status
    return NextResponse.json({
      status: status,
      details: pollData,
    });
  } catch (error) {
    console.error("Status check error:", error);

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
