import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

export async function GET(request: NextRequest) {
  try {
    // Get userId from your middleware (passed in headers)
    const userId = request.headers.get("x-userid");

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      prompt: "consent",
      state: userId || "anonymous", // Pass userId through OAuth flow
    });

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Error generating auth URL:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
