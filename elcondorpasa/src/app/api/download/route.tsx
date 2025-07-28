import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");
    const filename = searchParams.get("filename");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    if (!filename) {
      return NextResponse.json(
        { error: "Filename parameter is required" },
        { status: 400 }
      );
    }

    // Fetch the file from the external URL
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the content type from the original response
    const contentType =
      response.headers.get("content-type") || "application/octet-stream";
    const contentLength = response.headers.get("content-length");

    // Create headers for the response
    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    // Add content length if available
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    // Stream the response body
    const stream = response.body;

    if (!stream) {
      return NextResponse.json(
        { error: "Failed to get response body" },
        { status: 500 }
      );
    }

    // Return the streamed response
    return new NextResponse(stream, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to download file",
      },
      { status: 500 }
    );
  }
}
