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
  } catch (error: unknown) {
    console.error("❌ Initiate email linking error:", error);

    // Get error code for structured error handling
    let errorCode = "unknown_error";
    const message =
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message
        : "Failed to initiate email linking";
    if (message.includes("Email tidak ditemukan")) {
      errorCode = "email_not_found";
    } else if (message.includes("sudah terhubung dengan user lain")) {
      errorCode = "telegram_already_linked_to_other_user";
    } else if (message.includes("sudah terhubung dengan akun Telegram lain")) {
      errorCode = "email_already_linked_to_other_telegram";
    }

    return NextResponse.json(
      {
        success: false,
        message,
        errorCode,
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
