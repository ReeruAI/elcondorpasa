import UserModel from "@/db/models/UserModel";
import { NextResponse } from "next/server";

// Define a custom error interface for better type safety
interface CustomError extends Error {
  status?: number;
}

// Type guard to check if error has status property
function isCustomError(error: unknown): error is CustomError {
  return error instanceof Error && "status" in error;
}

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

    // Handle the specific 404 error from getUserProfile
    if (isCustomError(error) && error.status === 404) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    // Handle other errors
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
