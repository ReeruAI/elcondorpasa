import { NextRequest, NextResponse } from "next/server";
import KlapModel from "@/db/models/KlapModel";

const KLAP_API_KEY = process.env.KLAP_API_KEY as string;

export async function POST(request: NextRequest) {
  console.log("🚀 Klap API route called");

  try {
    // Add this after parsing the request body
    const body = await request.json();
    const { video_url } = body;

    console.log("📹 Video URL received:", video_url);

    if (!video_url) {
      return NextResponse.json({ error: "Missing video_url" }, { status: 400 });
    }

    const youtubeRegex =
      /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w\-]+(&[\w=]*)?$/;

    if (!youtubeRegex.test(video_url)) {
      console.warn("⚠️ Non-YouTube URL provided:", video_url);
      return NextResponse.json(
        {
          error:
            "Currently only YouTube videos are supported. Please provide a valid YouTube URL.",
        },
        { status: 400 }
      );
    }

    // Move KLAP_API_KEY check here
    if (!KLAP_API_KEY) {
      console.error("❌ KLAP_API_KEY not found in environment");
      return NextResponse.json(
        { error: "Missing KLAP_API_KEY" },
        { status: 500 }
      );
    }
    // Get userId from headers (web) or chatId (telegram)
    const userId = request.headers.get("x-userId");
    const chatId = request.headers.get("x-telegram-chat-id");

    console.log("👤 User ID from headers:", userId);
    console.log("📱 Telegram Chat ID from headers:", chatId);

    let finalUserId: string;

    if (userId) {
      // Web user - use userId from JWT
      finalUserId = userId;
      console.log("🌐 Processing as web user:", finalUserId);
    } else if (chatId) {
      // Telegram user - get userId from chatId
      console.log("📱 Processing as Telegram user, looking up userId...");

      try {
        const foundUserId = await KlapModel.getUserIdFromChatId(
          parseInt(chatId)
        );

        if (!foundUserId) {
          console.error("❌ Telegram account not linked:", chatId);
          return NextResponse.json(
            {
              error:
                "Telegram account not linked. Please send your email to the bot first.",
            },
            { status: 401 }
          );
        }

        finalUserId = foundUserId; // Now TypeScript knows it's not null
        console.log(
          "✅ Found linked user:",
          finalUserId,
          "for chatId:",
          chatId
        );
      } catch (error) {
        console.error("❌ Error looking up userId from chatId:", error);
        return NextResponse.json(
          { error: "Error validating Telegram account" },
          { status: 500 }
        );
      }
    } else {
      // No authentication provided
      console.error("❌ No userId or chatId provided");
      return NextResponse.json(
        { error: "Unauthorized - No authentication provided" },
        { status: 401 }
      );
    }

    // Check user token balance
    const tokenCount = await KlapModel.getUserTokenCount(finalUserId);
    console.log("🪙 User token count:", tokenCount);

    if (tokenCount <= 0) {
      return NextResponse.json(
        {
          error:
            "Insufficient tokens. Please purchase more tokens to continue.",
        },
        { status: 402 } // Payment Required
      );
    }

    // Check if user is already processing a video
    const canProcess = await KlapModel.setUserProcessingStatus(
      finalUserId,
      true
    );
    if (!canProcess) {
      return NextResponse.json(
        {
          error:
            "You already have a video being processed. Please wait for it to complete.",
        },
        { status: 429 } // Too Many Requests
      );
    }

    console.log("🌊 Creating ReadableStream for SSE");

    // Create a ReadableStream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        console.log("📡 Stream started for user:", finalUserId);
        const encoder = new TextEncoder();
        let isProcessingFlagCleared = false;

        // Helper function to clear processing flag
        const clearProcessingFlag = async () => {
          if (!isProcessingFlagCleared) {
            await KlapModel.setUserProcessingStatus(finalUserId, false);
            isProcessingFlagCleared = true;
            console.log("🔓 Processing flag cleared for user:", finalUserId);
          }
        };

        // Helper function to send SSE data with proper await
        const sendUpdate = async (data: any) => {
          try {
            const timestamp = new Date().toISOString();
            const message = `data: ${JSON.stringify({
              ...data,
              timestamp,
              user_type: userId ? "web" : "telegram", // Add user type for debugging
            })}\n\n`;
            console.log(
              `📤 [${timestamp}] Sending update to ${finalUserId}:`,
              data
            );

            controller.enqueue(encoder.encode(message));

            // Force flush by yielding control
            await new Promise((resolve) => setTimeout(resolve, 10));

            return true;
          } catch (error) {
            console.error("❌ Error sending update:", error);
            return false;
          }
        };

        try {
          // Send initial progress
          console.log("📝 Sending initial progress");
          await sendUpdate({
            status: "starting",
            message: "Initializing video processing...",
            progress: 0,
            tokens_remaining: tokenCount,
          });

          // Deduct token
          const tokenDeducted = await KlapModel.deductUserToken(finalUserId);
          if (!tokenDeducted) {
            await sendUpdate({
              status: "error",
              message: "Failed to deduct token. Please try again.",
            });
            await clearProcessingFlag();
            controller.close();
            return;
          }

          console.log("🪙 Token deducted successfully for user:", finalUserId);
          await sendUpdate({
            status: "token_deducted",
            message: "Token deducted. Processing video...",
            progress: 2,
            tokens_remaining: tokenCount - 1,
          });

          // Get user's language preference
          console.log("🔍 Fetching user preferences for userId:", finalUserId);
          await sendUpdate({
            status: "fetching_preferences",
            message: "Fetching user preferences...",
            progress: 5,
          });

          const language = await KlapModel.getUserLanguagePreference(
            finalUserId
          );
          console.log("🌐 Language set to:", language);

          await sendUpdate({
            status: "preferences_loaded",
            message: `Language set to: ${
              language === "id" ? "Indonesian" : "English"
            }`,
            progress: 8,
          });

          // 1. Start video-to-shorts task
          console.log("🎬 Creating video-to-shorts task");
          await sendUpdate({
            status: "creating_task",
            message: "Creating video-to-shorts task...",
            progress: 10,
          });

          const taskPayload = {
            source_video_url: video_url,
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
          console.log("📦 Task payload:", taskPayload);

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

          console.log("📨 Task response status:", taskResponse.status);

          const contentType = taskResponse.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const textResponse = await taskResponse.text();
            console.error("❌ Non-JSON response:", textResponse);
            await sendUpdate({
              status: "error",
              message: "API returned non-JSON response",
              error: textResponse.substring(0, 200),
            });
            await clearProcessingFlag();
            controller.close();
            return;
          }

          const taskData = await taskResponse.json();
          console.log("📋 Task data received:", taskData);

          if (!taskResponse.ok) {
            console.error("❌ Task creation failed:", taskData);

            // Handle specific error cases
            let errorMessage = "Task creation failed";
            if (taskData.error_code === "video_too_long") {
              errorMessage =
                "Video is too long for processing. Please use a shorter video (recommended: under 10 minutes).";
            } else if (taskData.error_code === "invalid_url") {
              errorMessage =
                "Invalid video URL. Please make sure the YouTube video is public and accessible.";
            } else if (taskData.error_code === "unsupported_platform") {
              errorMessage = "Only YouTube videos are supported currently.";
            } else if (
              taskData.message &&
              taskData.message !== "unprocessable-entity"
            ) {
              errorMessage = taskData.message;
            }

            await sendUpdate({
              status: "error",
              message: errorMessage,
              error_code: taskData.error_code || "unknown",
              error_details: taskData.message || JSON.stringify(taskData),
            });
            await clearProcessingFlag();
            controller.close();
            return;
          }
          // Check if task_id is present
          const { id: task_id } = taskData;

          if (!task_id) {
            console.error("❌ No task_id in response");
            await sendUpdate({
              status: "error",
              message: "No task_id returned from API",
            });
            await clearProcessingFlag();
            controller.close();
            return;
          }

          console.log("✅ Task created with ID:", task_id);
          await sendUpdate({
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

          console.log("🔄 Starting polling loop");

          for (let attempt = 0; attempt < maxRetries; attempt++) {
            const progress = Math.min(20 + (attempt / maxRetries) * 50, 70);

            console.log(`🔄 Polling attempt ${attempt + 1}/${maxRetries}`);
            await sendUpdate({
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

            console.log(`📊 Poll response status: ${pollRes.status}`);

            const pollContentType = pollRes.headers.get("content-type");
            if (
              !pollContentType ||
              !pollContentType.includes("application/json")
            ) {
              console.warn("⚠️ Non-JSON poll response, retrying...");
              await delay(15000);
              continue;
            }

            const pollData = await pollRes.json();
            console.log(`📊 Poll data status: ${pollData.status}`);

            if (!pollRes.ok) {
              console.warn("⚠️ Poll request not OK, retrying...");
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
              console.log("✅ Task completed!", status);
              await sendUpdate({
                status: "processing_complete",
                message: "Video processing completed! Starting export...",
                progress: 75,
                task_id,
              });
              break;
            } else if (status === "failed" || status === "error") {
              console.error("❌ Task failed:", pollData);
              await sendUpdate({
                status: "error",
                message: "Task processing failed",
                error: pollData,
              });
              await clearProcessingFlag();
              controller.close();
              return;
            }

            await delay(15000);
          }

          if (!["ready", "done", "completed"].includes(status)) {
            console.error("❌ Task timeout, final status:", status);
            await sendUpdate({
              status: "error",
              message: "Task not completed in time",
              final_status: status,
            });
            await clearProcessingFlag();
            controller.close();
            return;
          }

          // Extract output_id (folder_id in this case)
          const output_id = result.output_id;
          console.log("📁 Output ID:", output_id);

          if (!output_id) {
            console.error("❌ No output_id in result:", result);
            await sendUpdate({
              status: "error",
              message: "No output_id returned",
              result_data: result,
            });
            await clearProcessingFlag();
            controller.close();
            return;
          }

          // 3. Fetch project data - IT RETURNS AN ARRAY!
          console.log("🎥 Fetching project data for:", output_id);
          await sendUpdate({
            status: "starting_export",
            message: "Fetching generated shorts...",
            progress: 80,
            project_id: output_id,
          });

          // Sometimes shorts generation takes extra time, let's retry a few times
          let shorts: any[] = [];
          let rawResponse: any = null;
          const maxFetchRetries = 5; // Increase retries

          for (
            let fetchAttempt = 0;
            fetchAttempt < maxFetchRetries;
            fetchAttempt++
          ) {
            console.log(
              `🔄 Fetch attempt ${fetchAttempt + 1}/${maxFetchRetries}`
            );

            const projectRes = await fetch(
              `https://api.klap.app/v2/projects/${output_id}`,
              {
                headers: {
                  Authorization: `Bearer ${KLAP_API_KEY}`,
                },
              }
            );

            console.log("📽️ Project response status:", projectRes.status);
            console.log(
              "📽️ Project response headers:",
              Object.fromEntries(projectRes.headers.entries())
            );

            if (!projectRes.ok) {
              const errorText = await projectRes.text();
              console.error("❌ Failed to fetch shorts:", errorText);

              if (fetchAttempt === maxFetchRetries - 1) {
                // Last attempt failed
                await sendUpdate({
                  status: "error",
                  message: "Failed to fetch shorts after task completion",
                  error: errorText,
                });
                await clearProcessingFlag();
                controller.close();
                return;
              }

              // Wait before retry
              await delay(15000);
              continue;
            }

            // The API returns an array directly!
            const fetchedShorts = await projectRes.json();
            rawResponse = fetchedShorts; // Store raw response for debugging

            console.log("🎬 Raw response type:", typeof fetchedShorts);
            console.log(
              "🎬 Raw response is array:",
              Array.isArray(fetchedShorts)
            );
            console.log(
              "🎬 Raw response length:",
              Array.isArray(fetchedShorts) ? fetchedShorts.length : "N/A"
            );
            console.log(
              "📋 Complete raw response:",
              JSON.stringify(fetchedShorts, null, 2)
            );

            // Check if it's an object with shorts array inside
            if (fetchedShorts && typeof fetchedShorts === "object") {
              // Maybe it's wrapped in an object?
              if (fetchedShorts.shorts && Array.isArray(fetchedShorts.shorts)) {
                console.log("🔍 Found shorts in .shorts property");
                shorts = fetchedShorts.shorts;
                break;
              }
              // Maybe it's in data property?
              else if (
                fetchedShorts.data &&
                Array.isArray(fetchedShorts.data)
              ) {
                console.log("🔍 Found shorts in .data property");
                shorts = fetchedShorts.data;
                break;
              }
              // Maybe it's in results property?
              else if (
                fetchedShorts.results &&
                Array.isArray(fetchedShorts.results)
              ) {
                console.log("🔍 Found shorts in .results property");
                shorts = fetchedShorts.results;
                break;
              }
              // Maybe it's in items property?
              else if (
                fetchedShorts.items &&
                Array.isArray(fetchedShorts.items)
              ) {
                console.log("🔍 Found shorts in .items property");
                shorts = fetchedShorts.items;
                break;
              }
            }

            if (Array.isArray(fetchedShorts) && fetchedShorts.length > 0) {
              console.log("🔍 Response is direct array with items");
              shorts = fetchedShorts;
              break; // Success, exit retry loop
            }

            if (fetchAttempt < maxFetchRetries - 1) {
              const waitTime = 20000 + fetchAttempt * 10000; // Increase wait time each retry
              console.log(
                `⏳ No shorts yet, waiting ${waitTime}ms before retry...`
              );
              await sendUpdate({
                status: "waiting_for_shorts",
                message: `Waiting for shorts generation... (attempt ${
                  fetchAttempt + 1
                }/${maxFetchRetries})`,
                progress: 82 + fetchAttempt,
                project_id: output_id,
                wait_time: waitTime,
              });
              await delay(waitTime);
            }
          }

          if (!Array.isArray(shorts) || shorts.length === 0) {
            console.error("❌ No shorts generated after all retries");
            console.log(
              "📋 Final raw response:",
              JSON.stringify(rawResponse, null, 2)
            );

            await sendUpdate({
              status: "error",
              message:
                "Unable to retrieve generated shorts. The video was processed successfully but we couldn't fetch the results.",
              error_code: "fetch_shorts_failed",
              progress: 85,
              project_id: output_id,
              debug_info: {
                response_type: typeof rawResponse,
                response_keys:
                  rawResponse && typeof rawResponse === "object"
                    ? Object.keys(rawResponse)
                    : null,
                is_array: Array.isArray(rawResponse),
                response_sample: rawResponse,
              },
              suggestion:
                "Please check your Klap dashboard at https://app.klap.app - your shorts may be available there. Contact support with this project ID: " +
                output_id,
            });
            await clearProcessingFlag();
            controller.close();
            return;
          }

          // Sort by virality score and take the best one
          const sortedShorts = shorts.sort(
            (a: any, b: any) =>
              (b.virality_score || 0) - (a.virality_score || 0)
          );

          const bestShort = sortedShorts[0];
          console.log(
            "🏆 Best short selected:",
            bestShort.name,
            "Score:",
            bestShort.virality_score
          );

          await sendUpdate({
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
          console.log("📤 Starting export for short:", bestShort.id);
          await sendUpdate({
            status: "exporting_short",
            message: `Exporting "${bestShort.name}"...`,
            progress: 90,
            project_id: output_id,
            short_title: bestShort.name,
            virality_score: bestShort.virality_score,
          });

          try {
            // Note: The export endpoint uses folder_id/project_id format
            const exportUrl = `https://api.klap.app/v2/projects/${bestShort.folder_id}/${bestShort.id}/exports`;
            console.log("📤 Export URL:", exportUrl);

            const exportRes = await fetch(exportUrl, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${KLAP_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({}),
            });

            console.log("📤 Export response status:", exportRes.status);

            if (!exportRes.ok) {
              const errorText = await exportRes.text();
              console.error("❌ Export creation failed:", errorText);
              throw new Error(`Export creation failed: ${errorText}`);
            }

            const exportData = await exportRes.json();
            const exportId = exportData.id;
            console.log("✅ Export created with ID:", exportId);

            await sendUpdate({
              status: "waiting_export",
              message: `Waiting for export to complete...`,
              progress: 92,
              export_id: exportId,
            });

            // Poll until export is done
            let exportStatus = "processing";
            let exportResult = null;
            const maxExportRetries = 60;

            console.log("🔄 Starting export polling");

            for (
              let exportAttempt = 0;
              exportAttempt < maxExportRetries;
              exportAttempt++
            ) {
              console.log(
                `🔄 Export poll attempt ${
                  exportAttempt + 1
                }/${maxExportRetries}`
              );

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
                console.log(`📊 Export status: ${exportStatus}`);

                if (
                  exportStatus === "ready" ||
                  exportStatus === "done" ||
                  exportStatus === "completed"
                ) {
                  exportResult = statusData;
                  console.log("✅ Export completed!");
                  await sendUpdate({
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
                  console.error("❌ Export failed");
                  throw new Error("Export failed");
                }
              }

              await delay(10000);
            }

            // Save to database before sending final completion
            const downloadUrl =
              exportResult?.src_url || exportResult?.download_url || null;
            console.log("💾 Download URL:", downloadUrl);

            if (downloadUrl) {
              console.log("💾 Saving to database for user:", finalUserId);
              await sendUpdate({
                status: "saving_to_database",
                message: "Saving short to database...",
                progress: 98,
              });

              try {
                // Format captions for all platforms
                const formattedCaptions = {
                  tiktok: bestShort.publication_captions?.tiktok || "",
                  youtube: bestShort.publication_captions?.youtube || "",
                  linkedin: bestShort.publication_captions?.linkedin || "",
                  instagram: bestShort.publication_captions?.instagram || "",
                };

                await KlapModel.addUserShort(finalUserId, {
                  title: bestShort.name,
                  virality_score: bestShort.virality_score,
                  captions: formattedCaptions,
                  download_url: downloadUrl,
                  description: bestShort.virality_score_explanation || "", // Added description here
                });

                console.log(
                  "✅ Database save successful for user:",
                  finalUserId
                );
                await sendUpdate({
                  status: "database_saved",
                  message: "Successfully saved to database!",
                  progress: 99,
                });
              } catch (dbError) {
                console.error("❌ Database save error:", dbError);
                await sendUpdate({
                  status: "database_error",
                  message:
                    "Warning: Could not save to database, but export was successful",
                  error:
                    dbError instanceof Error
                      ? dbError.message
                      : "Unknown database error",
                });
              }
            }

            // Send final completion with the single best short
            console.log("🎉 Sending final completion");
            await sendUpdate({
              status: "completed",
              message: "Successfully exported the best short!",
              progress: 100,
              project_id: output_id,
              tokens_remaining: tokenCount - 1,
              short: {
                id: bestShort.id,
                title: bestShort.name,
                virality_score: bestShort.virality_score,
                duration: bestShort.duration,
                transcript: bestShort.transcript_text,
                description: bestShort.virality_score_explanation,
                captions: bestShort.publication_captions,
                export_status: exportStatus,
                download_url: downloadUrl,
                export_id: exportId,
              },
            });
          } catch (error) {
            console.error("❌ Export error:", error);
            await sendUpdate({
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

          console.log("🏁 Clearing processing flag and closing stream");
          await clearProcessingFlag();
          controller.close();
        } catch (error) {
          console.error("❌ Stream error:", error);
          await sendUpdate({
            status: "error",
            message: "Internal server error occurred",
            error: error instanceof Error ? error.message : String(error),
          });
          await clearProcessingFlag();
          controller.close();
        }
      },
    });

    console.log("📡 Returning SSE response");
    // Return the stream as Server-Sent Events with improved headers
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disable nginx buffering
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, x-userId, x-telegram-chat-id",
      },
    });
  } catch (error) {
    console.error("❌ Klap processing error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
