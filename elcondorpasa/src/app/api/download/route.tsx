// src/app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const filename = searchParams.get("filename") || "download";

  // Validate required parameters
  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return NextResponse.json(
      { error: "Invalid URL provided" },
      { status: 400 }
    );
  }

  try {
    console.log(`[Download API] Streaming: ${url}`);

    // Fetch the file from the external URL
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
      },
    });

    if (!response.ok) {
      console.error(
        `[Download API] HTTP ${response.status}: ${response.statusText}`
      );
      return NextResponse.json(
        {
          error: `Failed to fetch file: HTTP ${response.status}`,
          details: response.statusText,
        },
        { status: response.status }
      );
    }

    // Get content information
    const contentType =
      response.headers.get("Content-Type") || "application/octet-stream";
    const contentLength = response.headers.get("Content-Length");

    console.log(
      `[Download API] Streaming file: ${
        contentLength
          ? `${Math.round(parseInt(contentLength) / 1024)}KB`
          : "unknown size"
      }, Type: ${contentType}`
    );

    // Create a streaming response
    const stream = new ReadableStream({
      start(controller) {
        const reader = response.body?.getReader();

        function pump(): Promise<void> {
          return reader!.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            return pump();
          });
        }

        return pump();
      },
    });

    // Return streaming response with proper download headers
    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": contentType,
        "Content-Length": contentLength || "0",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Expose-Headers": "Content-Length, Content-Disposition",
      },
    });
  } catch (error) {
    console.error("[Download API] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Failed to download file",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
