import UserModel from "@/db/models/UserModel";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, chatId, telegramName, telegramUsername } = body;

    // Validate required fields
    if (!email || !chatId || !telegramName) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, chat ID, and Telegram name are required",
        },
        { status: 400 }
      );
    }

    console.log("📧 Initiating email linking:", {
      email,
      chatId: typeof chatId,
      telegramName,
      telegramUsername,
    });

    // Initiate email linking
    const result = await UserModel.initiateEmailLinking(
      email.trim().toLowerCase(),
      parseInt(chatId),
      telegramName,
      telegramUsername
    );

    console.log("✅ Email linking initiated for:", result.name);

    return NextResponse.json({
      success: true,
      message: result.message,
      user: {
        name: result.name,
        email: result.email,
      },
    });
  } catch (error: any) {
    console.error("❌ Initiate email linking error:", error);

    // Get error code for structured error handling
    let errorCode = "unknown_error";
    if (error.message?.includes("Email tidak ditemukan")) {
      errorCode = "email_not_found";
    } else if (error.message?.includes("sudah terhubung dengan user lain")) {
      errorCode = "telegram_already_linked_to_other_user";
    } else if (
      error.message?.includes("sudah terhubung dengan akun Telegram lain")
    ) {
      errorCode = "email_already_linked_to_other_telegram";
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to initiate email linking",
        errorCode: errorCode,
      },
      { status: error.status || 500 }
    );
  }
}
