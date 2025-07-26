import UserModel from "@/db/models/UserModel";
import { NextResponse } from "next/server";

// GET: Get user profile by userId
export async function GET(req: Request) {
  try {
    const userId = req.headers.get("x-userId");
    if (!userId) {
      throw new Error("User ID is missing from headers");
    }

    const user = await UserModel.getUserProfile(userId);

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    const err = error as any;

    // Handle the specific 404 error from getUserProfile
    if (err.status === 404) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
