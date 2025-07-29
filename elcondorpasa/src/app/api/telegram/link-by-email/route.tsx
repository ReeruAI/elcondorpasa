import UserModel from "@/db/models/UserModel";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Check if request has body and get raw text first
    const text = await request.text();
    console.log("📥 Raw request body:", text);

    if (!text || text.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          message: "Request body is empty",
        },
        { status: 400 }
      );
    }

    // Parse JSON with proper error handling
    let body;
    try {
      body = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      console.error("❌ Raw body was:", text);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON format",
        },
        { status: 400 }
      );
    }

    const { email, chatId, telegramName, telegramUsername } = body;

    // Validate required fields
    if (!email || !chatId) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and chat ID are required",
        },
        { status: 400 }
      );
    }

    console.log("📧 Processing link request:", {
      email,
      chatId: typeof chatId,
      telegramName,
      telegramUsername,
    });

    // Link user dengan Telegram - Updated method call
    const linkedUser = await UserModel.linkTelegramByEmail(
      email.trim().toLowerCase(),
      parseInt(chatId),
      telegramUsername || telegramName // Use telegramUsername if provided, fallback to telegramName
    );

    console.log("✅ Successfully linked:", linkedUser.name);

    return NextResponse.json({
      success: true,
      message: "Telegram berhasil terhubung",
      user: {
        name: linkedUser.name,
        email: linkedUser.email,
      },
    });
  } catch (error: any) {
    console.error("❌ Link by email error:", error);

    // Enhanced error handling for new validation cases
    let errorMessage = error.message || "Internal server error";
    let statusCode = error.status || 500;

    // Handle specific error cases with user-friendly messages
    if (error.message?.includes("Email tidak ditemukan")) {
      errorMessage = "Email tidak ditemukan di sistem Reeru";
      statusCode = 404;
    } else if (error.message?.includes("sudah terhubung dengan user lain")) {
      errorMessage = "Akun Telegram ini sudah terhubung dengan user lain";
      statusCode = 400;
    } else if (
      error.message?.includes("sudah terhubung dengan akun Telegram lain")
    ) {
      // NEW ERROR CASE - Handle the new validation
      errorMessage = "Email ini sudah terhubung dengan akun Telegram lain";
      statusCode = 400;
    } else if (error.message?.includes("Failed to link Telegram account")) {
      errorMessage = "Gagal menghubungkan akun Telegram";
      statusCode = 500;
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        // Include error code for better client-side handling
        errorCode: getErrorCode(error.message),
      },
      { status: statusCode }
    );
  }
}

// Helper function to categorize errors for client-side handling
function getErrorCode(errorMessage: string): string {
  if (!errorMessage) return "unknown_error";

  if (errorMessage.includes("Email tidak ditemukan")) {
    return "email_not_found";
  } else if (errorMessage.includes("sudah terhubung dengan user lain")) {
    return "telegram_already_linked_to_other_user";
  } else if (
    errorMessage.includes("sudah terhubung dengan akun Telegram lain")
  ) {
    return "email_already_linked_to_other_telegram";
  } else if (errorMessage.includes("Failed to link")) {
    return "link_failed";
  } else {
    return "unknown_error";
  }
}
