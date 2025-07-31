import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { database } from "@/db/config/mongodb";
import { ObjectId } from "mongodb";
import { Readable } from "stream";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

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

// Helper function to get user ID from various sources
async function getUserId(request: NextRequest): Promise<string | null> {
  // Method 1: Check header (both lowercase and camelCase)
  const headerUserId =
    request.headers.get("x-userid") || request.headers.get("x-userId");
  if (headerUserId) return headerUserId;

  // Method 2: Check cookies for auth token
  const cookieStore = cookies();
  const authToken =
    (await cookieStore).get("auth")?.value ||
    (await cookieStore).get("token")?.value;

  if (authToken) {
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as {
        userId: string;
      };
      return decoded.userId;
    } catch (error) {
      console.error("Error decoding auth token:", error);
    }
  }

  // Method 3: Check Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };
      return decoded.userId;
    } catch (error) {
      console.error("Error decoding bearer token:", error);
    }
  }

  return null;
}

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
    // Enhanced user ID retrieval
    const userId = await getUserId(request);

    if (!userId) {
      console.error("No user ID found in request");
      return NextResponse.json(
        { success: false, error: "Unauthorized - No user ID found" },
        { status: 401 }
      );
    }

    const usersCollection = database.collection<YouTubeUser>("users");
    const user = await usersCollection.findOne({
      _id: new ObjectId(userId),
    });

    if (!user) {
      console.error("User not found:", userId);
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.youtube || !user.youtube.refreshToken) {
      console.error("YouTube not connected for user:", userId);
      return NextResponse.json(
        {
          success: false,
          error:
            "YouTube not connected. Please reconnect your YouTube account.",
        },
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

    // Log file info for debugging
    console.log("Uploading video:", {
      title,
      fileSize: videoFile.size,
      fileType: videoFile.type,
      userId,
    });

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

    console.log("Upload successful:", response.data.id);

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
      {
        success: false,
        error: "Failed to upload video",
        details:
          process.env.NODE_ENV === "development" &&
          typeof error === "object" &&
          error !== null &&
          "message" in error
            ? (error as { message: string }).message
            : undefined,
      },
      { status: 500 }
    );
  }
}
