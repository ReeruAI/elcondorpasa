import { NextRequest, NextResponse } from "next/server";

const KLAP_API_KEY = process.env.KLAP_API_KEY as string;

interface Short {
  id: string;
  title?: string;
  virality_score?: number;
  duration?: number;
  transcript?: string;
  description?: string;
  // Add other properties if needed
}

// Create high resolution exports for ALL shorts and return ALL download URLs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json(
        { error: "Missing project_id" },
        { status: 400 }
      );
    }

    if (!KLAP_API_KEY) {
      return NextResponse.json(
        { error: "Missing KLAP_API_KEY" },
        { status: 500 }
      );
    }

    // First, get all shorts from the project
    const ideasRes = await fetch(
      `https://api.klap.app/v2/projects/${project_id}`,
      {
        headers: {
          Authorization: `Bearer ${KLAP_API_KEY}`,
        },
      }
    );

    const ideasData = await ideasRes.json();
    if (!ideasRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch shorts" },
        { status: ideasRes.status }
      );
    }

    const shorts = ideasData.shorts || [];

    // Create exports for ALL shorts and wait for ALL to complete
    const allShortsWithDownloads = await Promise.all(
      shorts.map(async (short: Short) => {
        try {
          // Create export for this short
          const exportRes = await fetch(
            `https://api.klap.app/v2/projects/${project_id}/${short.id}/exports`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${KLAP_API_KEY}`,
              },
            }
          );

          if (!exportRes.ok) {
            console.error(`Export creation failed for short ${short.id}`);
            return {
              ...short,
              export_status: "failed",
              download_url: null,
              error: "Failed to create export",
            };
          }

          const exportData = await exportRes.json();
          const exportId = exportData.id;

          // Poll until this export is done
          let exportStatus = "processing";
          let exportResult = null;
          const maxRetries = 30; // 5 minutes max
          const delay = (ms: number) =>
            new Promise((res) => setTimeout(res, ms));

          for (let attempt = 0; attempt < maxRetries; attempt++) {
            const statusRes = await fetch(
              `https://api.klap.app/v2/projects/${project_id}/${short.id}/exports/${exportId}`,
              {
                headers: {
                  Authorization: `Bearer ${KLAP_API_KEY}`,
                },
              }
            );

            if (statusRes.ok) {
              const statusData = await statusRes.json();
              exportStatus = statusData.status;

              if (exportStatus === "done") {
                exportResult = statusData;
                break;
              } else if (exportStatus === "failed") {
                break;
              }
            }

            await delay(10000); // Wait 10 seconds between polls
          }

          return {
            ...short,
            export_status: exportStatus,
            download_url: exportResult?.download_url || null,
            export_id: exportId,
            file_size: exportResult?.file_size || null,
            resolution: exportResult?.resolution || null,
          };
        } catch (error) {
          console.error(`Error processing short ${short.id}:`, error);
          return {
            ...short,
            export_status: "error",
            download_url: null,
            error:
              typeof error === "object" && error !== null && "message" in error
                ? (error as { message: string }).message
                : String(error),
          };
        }
      })
    );

    // Return ALL shorts with their download URLs
    return NextResponse.json({
      status: "all_exports_completed",
      project_id: project_id,
      total_shorts: allShortsWithDownloads.length,
      shorts: allShortsWithDownloads.map((short) => ({
        id: short.id,
        title: short.title,
        virality_score: short.virality_score,
        duration: short.duration,
        transcript: short.transcript,
        description: short.description,
        download_url: short.download_url, // Final edited video URL
        export_status: short.export_status,
        export_id: short.export_id,
        file_size: short.file_size,
        resolution: short.resolution,
      })),
    });
  } catch (error) {
    console.error("Bulk export creation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
