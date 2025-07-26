import { NextRequest, NextResponse } from "next/server";
const KLAP_API_KEY = process.env.KLAP_API_KEY as string;
// GET endpoint to check task status
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const task_id = url.pathname.split("/").pop();

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

    // If done, process exports
    if (status === "done") {
      if (!pollData.shorts) {
        return NextResponse.json(
          { error: "Invalid result format", details: pollData },
          { status: 500 }
        );
      }

      // Create high resolution exports for each short
      const shortsWithExports = await Promise.all(
        pollData.shorts.map(async (short: any) => {
          try {
            // Create high resolution export
            const exportResponse = await fetch(
              `https://api.klap.app/v2/projects/${pollData.id}/${short.id}/exports`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${KLAP_API_KEY}`,
                },
              }
            );

            if (!exportResponse.ok) {
              console.error("Export creation failed for short:", short.id);
              return {
                video_url: short.video_url,
                title: short.title,
                id: short.id,
                export_status: "failed",
              };
            }

            const exportData = await exportResponse.json();
            const exportId = exportData.id;

            // Poll for export completion (limited polling for immediate response)
            let exportStatus = "processing";
            let exportResult: any = null;
            const maxExportRetries = 3; // Reduced for immediate response
            const delay = (ms: number) =>
              new Promise((res) => setTimeout(res, ms));

            for (
              let exportAttempt = 0;
              exportAttempt < maxExportRetries;
              exportAttempt++
            ) {
              const exportPollRes = await fetch(
                `https://api.klap.app/v2/projects/${pollData.id}/${short.id}/exports/${exportId}`,
                {
                  headers: {
                    Authorization: `Bearer ${KLAP_API_KEY}`,
                  },
                }
              );

              if (!exportPollRes.ok) {
                console.error("Export polling failed");
                break;
              }

              const exportPollData = await exportPollRes.json();
              exportStatus = exportPollData.status;

              if (exportStatus === "done") {
                exportResult = exportPollData;
                break;
              } else if (exportStatus === "failed") {
                break;
              }

              await delay(2000); // wait 2 seconds for export
            }

            return {
              video_url: short.video_url,
              title: short.title,
              id: short.id,
              export_status: exportStatus,
              high_res_url: exportResult?.download_url || null,
              export_id: exportId,
            };
          } catch (exportError) {
            console.error("Export error for short:", short.id, exportError);
            return {
              video_url: short.video_url,
              title: short.title,
              id: short.id,
              export_status: "error",
            };
          }
        })
      );

      return NextResponse.json({
        status: "done",
        project_id: pollData.id,
        shorts: shortsWithExports,
      });
    }

    // Unknown status
    return NextResponse.json({
      status: status,
      details: pollData,
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
