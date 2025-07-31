import { NextRequest, NextResponse } from "next/server";
import { database } from "@/db/config/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    // Get userId from your middleware
    const userId = request.headers.get("x-userid");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usersCollection = database.collection("users");
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user || !user.youtube) {
      return NextResponse.json({ connected: false });
    }

    const isConnected =
      user.youtube.connected &&
      user.youtube.refreshToken &&
      user.youtube.expiryDate > Date.now();

    return NextResponse.json({
      connected: isConnected,
      channelName: isConnected ? user.youtube.channelName : null,
    });
  } catch (error) {
    console.error("Error checking YouTube status:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
