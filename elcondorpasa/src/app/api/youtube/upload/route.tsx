import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { database } from "@/db/config/mongodb";
import { ObjectId } from "mongodb";
import { Readable } from "stream";

// Define proper types
interface YouTubeUser {
  _id: ObjectId;
  youtube?: {
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
    uploads?: Array<{
      videoId: string;
      title: string;
      uploadedAt: Date;
    }>;
  };
}

interface YouTubeError extends Error {
  code?: number;
}

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

async function refreshAccessToken(
  userId: string,
  refreshToken: string
): Promise<string> {
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  // Update stored tokens
  const usersCollection = database.collection<YouTubeUser>("users");
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        "youtube.accessToken": credentials.access_token!,
        "youtube.expiryDate": credentials.expiry_date!,
      },
    }
  );

  return credentials.access_token!;
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-userid");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const usersCollection = database.collection<YouTubeUser>("users");
    const user = await usersCollection.findOne({
      _id: new ObjectId(userId),
    });

    if (!user || !user.youtube || !user.youtube.refreshToken) {
      return NextResponse.json(
        { success: false, error: "YouTube not connected" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const videoFile = formData.get("video") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const tagsString = formData.get("tags") as string;
    const tags = tagsString ? JSON.parse(tagsString) : ["shorts"];

    if (!videoFile || !title) {
      return NextResponse.json(
        { success: false, error: "Missing video or title" },
        { status: 400 }
      );
    }

    // Convert File to stream
    const buffer = Buffer.from(await videoFile.arrayBuffer());
    const bufferStream = Readable.from(buffer);

    const accessToken = await refreshAccessToken(
      userId,
      user.youtube.refreshToken
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: user.youtube.refreshToken,
    });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    const videoMetadata = {
      snippet: {
        title: title,
        description: description || "",
        tags: tags,
        categoryId: "22", // People & Blogs category
      },
      status: {
        privacyStatus: "public" as const,
        selfDeclaredMadeForKids: false,
      },
    };

    const response = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: videoMetadata,
      media: {
        body: bufferStream,
      },
    });

    // Store upload record
    const uploadData = {
      videoId: response.data.id!,
      title: String(title),
      uploadedAt: new Date(),
    };

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $push: {
          "youtube.uploads": uploadData,
        },
      }
    );

    return NextResponse.json({
      success: true,
      videoId: response.data.id!,
      videoUrl: `https://youtube.com/watch?v=${response.data.id}`,
    });
  } catch (error) {
    console.error("Error uploading to YouTube:", error);

    const youtubeError = error as YouTubeError;

    if (youtubeError.code === 401) {
      return NextResponse.json(
        {
          success: false,
          error: "YouTube authentication expired. Please reconnect.",
        },
        { status: 401 }
      );
    } else if (youtubeError.code === 403) {
      return NextResponse.json(
        {
          success: false,
          error: "YouTube API quota exceeded or insufficient permissions.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to upload video" },
      { status: 500 }
    );
  }
}
