import { getUserShorts } from "@/db/models/UserShortsModel";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in headers" },
        { status: 401 }
      );
    }

    const userShorts = await getUserShorts(userId);

    if (!userShorts) {
      return NextResponse.json(
        { error: "User shorts not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(userShorts);
  } catch (error) {
    console.error("Error fetching user shorts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
