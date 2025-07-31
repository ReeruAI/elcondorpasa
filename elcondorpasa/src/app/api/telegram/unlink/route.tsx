import UserModel from "@/db/models/UserModel";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId } = body;

    // Validate required fields
    if (!chatId) {
      return NextResponse.json(
        {
          success: false,
          message: "Chat ID is required",
        },
        { status: 400 }
      );
    }

    console.log("🔓 Unlinking account for chatId:", chatId);

    // Unlink account
    const result = await UserModel.unlinkTelegramByChatId(parseInt(chatId));

    console.log("✅ Account unlinked successfully:", result.name);

    return NextResponse.json({
      success: true,
      message: result.message,
      user: {
        name: result.name,
        email: result.email,
      },
    });
  } catch (error: unknown) {
    console.error("❌ Unlink error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to unlink account",
      },
      {
        status:
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          typeof (error as { status?: unknown }).status === "number"
            ? (error as { status: number }).status
            : 500,
      }
    );
  }
}
