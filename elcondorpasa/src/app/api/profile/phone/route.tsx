import UserModel from "@/db/models/UserModel";
import { NextResponse } from "next/server";

// PATCH: Update phone number
export async function PATCH(req: Request) {
  try {
    const userId = req.headers.get("x-userId");
    if (!userId) {
      throw new Error("User ID is missing from headers");
    }

    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    const result = await UserModel.updatePhone(userId, { phone });

    return NextResponse.json({ success: true, message: result });
  } catch (error) {
    console.error("Error updating phone number:", error);
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}
