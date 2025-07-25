import UserModel from "@/db/models/UserModel";
import { NextResponse } from "next/server";

// PATCH: Toggle telegram status
export async function PATCH(req: Request) {
  try {
    const userId = req.headers.get("x-userId");
    if (!userId) {
      throw new Error("User ID is missing from headers");
    }

    const result = await UserModel.toggleTelegram(userId);

    return NextResponse.json({ success: true, message: result });
  } catch (error) {
    console.error("Error toggling telegram status:", error);
    const err = error as any;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: err.status || 500 }
    );
  }
}
