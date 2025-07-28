import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { database } from "@/db/config/mongodb";
import { ObjectId } from "mongodb";

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(
      new URL("/your-clip?error=no_code", request.url)
    );
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Use your existing database connection
    const usersCollection = database.collection("users");

    const userId = state;
    if (userId && userId !== "anonymous") {
      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            youtube: {
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              expiryDate: tokens.expiry_date,
              channelName: userInfo.name,
              email: userInfo.email,
              connected: true,
              connectedAt: new Date(),
            },
          },
        }
      );
    }

    return NextResponse.redirect(
      new URL("/your-clip?youtube=connected", request.url)
    );
  } catch (error) {
    console.error("Error in YouTube callback:", error);
    return NextResponse.redirect(
      new URL("/your-clip?error=auth_failed", request.url)
    );
  }
}
