// /app/api/youtube/disconnect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { database } from "@/db/config/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-userid");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usersCollection = database.collection("users");

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $unset: { youtube: "" },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting YouTube:", error);
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}
