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

    // Link user dengan Telegram
    const linkedUser = await UserModel.linkTelegramByEmail(
      email.trim().toLowerCase(),
      parseInt(chatId),
      telegramUsername
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

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
      },
      { status: error.status || 500 }
    );
  }
}
