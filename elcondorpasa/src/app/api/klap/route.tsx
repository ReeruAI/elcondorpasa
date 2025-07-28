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

    // Create a ReadableStream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Helper function to send SSE data
        const sendUpdate = (data: any) => {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        try {
          // Send initial progress
          sendUpdate({
            status: "starting",
            message: "Initializing video processing...",
            progress: 0,
          });

          // 1. Start video-to-shorts task
          sendUpdate({
            status: "creating_task",
            message: "Creating video-to-shorts task...",
            progress: 10,
          });

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
                // Request only 1 clip to minimize costs
                target_clip_count: 1,
                max_clip_count: 1,
                editing_options: {
                  captions: true,
                  reframe: true,
                  emojis: true,
                  intro_title: true,
                  remove_silences: false,
                  width: 1080,
                  height: 1920,
                },
              }),
            }
          );

          const contentType = taskResponse.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const textResponse = await taskResponse.text();
            sendUpdate({
              status: "error",
              message: "API returned non-JSON response",
              error: textResponse.substring(0, 200),
            });
            controller.close();
            return;
          }

          const taskData = await taskResponse.json();

          if (!taskResponse.ok) {
            sendUpdate({
              status: "error",
              message: "Task creation failed",
              error: taskData.message || JSON.stringify(taskData),
            });
            controller.close();
            return;
          }
          // Check if task_id is present
          const { id: task_id } = taskData;

          if (!task_id) {
            sendUpdate({
              status: "error",
              message: "No task_id returned from API",
            });
            controller.close();
            return;
          }

          sendUpdate({
            status: "task_created",
            message: `Task ${task_id} created successfully. Starting processing...`,
            progress: 20,
            task_id,
          });

          // 2. Poll for task completion
          let status = "processing";
          let result: any = null;
          const maxRetries = 120;
          const delay = (ms: number) =>
            new Promise((res) => setTimeout(res, ms));

          for (let attempt = 0; attempt < maxRetries; attempt++) {
            const progress = Math.min(20 + (attempt / maxRetries) * 50, 70);

            sendUpdate({
              status: "processing",
              message: `Processing video... (${attempt + 1}/${maxRetries})`,
              progress: Math.round(progress),
              task_id,
              attempt: attempt + 1,
              max_attempts: maxRetries,
            });

            const pollRes = await fetch(
              `https://api.klap.app/v2/tasks/${task_id}`,
              {
                headers: {
                  Authorization: `Bearer ${KLAP_API_KEY}`,
                },
              }
            );

            const pollContentType = pollRes.headers.get("content-type");
            if (
              !pollContentType ||
              !pollContentType.includes("application/json")
            ) {
              await delay(15000);
              continue;
            }

            const pollData = await pollRes.json();

            if (!pollRes.ok) {
              await delay(15000);
              continue;
            }

            status = pollData.status;

            if (
              status === "ready" ||
              status === "done" ||
              status === "completed"
            ) {
              result = pollData;
              sendUpdate({
                status: "processing_complete",
                message: "Video processing completed! Starting export...",
                progress: 75,
                task_id,
              });
              break;
            } else if (status === "failed" || status === "error") {
              sendUpdate({
                status: "error",
                message: "Task processing failed",
                error: pollData,
              });
              controller.close();
              return;
            }

            await delay(15000);
          }

          if (!["ready", "done", "completed"].includes(status)) {
            sendUpdate({
              status: "error",
              message: "Task not completed in time",
              final_status: status,
            });
            controller.close();
            return;
          }

          // Extract output_id (folder_id in this case)
          const output_id = result.output_id;

          if (!output_id) {
            sendUpdate({
              status: "error",
              message: "No output_id returned",
              result_data: result,
            });
            controller.close();
            return;
          }

          // 3. Fetch project data - IT RETURNS AN ARRAY!
          sendUpdate({
            status: "starting_export",
            message: "Fetching generated shorts...",
            progress: 80,
            project_id: output_id,
          });

          const projectRes = await fetch(
            `https://api.klap.app/v2/projects/${output_id}`,
            {
              headers: {
                Authorization: `Bearer ${KLAP_API_KEY}`,
              },
            }
          );

          if (!projectRes.ok) {
            const errorText = await projectRes.text();
            sendUpdate({
              status: "error",
              message: "Failed to fetch shorts after task completion",
              error: errorText,
            });
            controller.close();
            return;
          }

          // The API returns an array directly!
          const shorts = await projectRes.json();

          if (!Array.isArray(shorts) || shorts.length === 0) {
            sendUpdate({
              status: "error",
              message: "No shorts were generated",
              progress: 85,
              project_id: output_id,
            });
            controller.close();
            return;
          }

          // Sort by virality score and take the best one
          const sortedShorts = shorts.sort(
            (a: any, b: any) =>
              (b.virality_score || 0) - (a.virality_score || 0)
          );

          const bestShort = sortedShorts[0];

          sendUpdate({
            status: "found_shorts",
            message: `Found ${shorts.length} short. Exporting it...`,
            progress: 85,
            project_id: output_id,
            total_shorts: shorts.length,
            short_info: {
              title: bestShort.name,
              virality_score: bestShort.virality_score,
              id: bestShort.id,
            },
          });

          // 4. Export only the best short
          sendUpdate({
            status: "exporting_short",
            message: `Exporting "${bestShort.name}"...`,
            progress: 90,
            project_id: output_id,
            short_title: bestShort.name,
            virality_score: bestShort.virality_score,
          });

          try {
            // Note: The export endpoint uses folder_id/project_id format
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

            if (!exportRes.ok) {
              const errorText = await exportRes.text();
              throw new Error(`Export creation failed: ${errorText}`);
            }

            const exportData = await exportRes.json();
            const exportId = exportData.id;

            sendUpdate({
              status: "waiting_export",
              message: `Waiting for export to complete...`,
              progress: 92,
              export_id: exportId,
            });

            // Poll until export is done
            let exportStatus = "processing";
            let exportResult = null;
            const maxExportRetries = 40;

            for (
              let exportAttempt = 0;
              exportAttempt < maxExportRetries;
              exportAttempt++
            ) {
              const statusRes = await fetch(
                `https://api.klap.app/v2/projects/${bestShort.folder_id}/${bestShort.id}/exports/${exportId}`,
                {
                  headers: {
                    Authorization: `Bearer ${KLAP_API_KEY}`,
                  },
                }
              );

              if (statusRes.ok) {
                const statusData = await statusRes.json();
                exportStatus = statusData.status;

                if (
                  exportStatus === "ready" ||
                  exportStatus === "done" ||
                  exportStatus === "completed"
                ) {
                  exportResult = statusData;
                  sendUpdate({
                    status: "export_complete",
                    message: `Export completed!`,
                    progress: 95,
                    download_url: statusData.src_url || statusData.download_url,
                  });
                  break;
                } else if (
                  exportStatus === "failed" ||
                  exportStatus === "error"
                ) {
                  throw new Error("Export failed");
                }
              }

              await delay(10000);
            }

            // Send final completion with the single best short
            sendUpdate({
              status: "completed",
              message: "Successfully exported the best short!",
              progress: 100,
              project_id: output_id,
              short: {
                id: bestShort.id,
                title: bestShort.name,
                virality_score: bestShort.virality_score,
                duration: bestShort.duration,
                transcript: bestShort.transcript_text,
                description: bestShort.virality_score_explanation,
                captions: bestShort.publication_captions,
                export_status: exportStatus,
                download_url:
                  exportResult?.src_url || exportResult?.download_url || null,
                export_id: exportId,
              },
            });
          } catch (error) {
            sendUpdate({
              status: "error",
              message: "Export failed",
              error: error instanceof Error ? error.message : String(error),
              short_info: {
                id: bestShort.id,
                title: bestShort.name,
                virality_score: bestShort.virality_score,
              },
            });
          }

          controller.close();
        } catch (error) {
          sendUpdate({
            status: "error",
            message: "Internal server error occurred",
            error: error instanceof Error ? error.message : String(error),
          });
          controller.close();
        }
      },
    });

    // Return the stream as Server-Sent Events
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Klap processing error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
