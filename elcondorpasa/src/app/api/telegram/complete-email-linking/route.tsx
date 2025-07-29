import UserModel from "@/db/models/UserModel";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { otpCode, chatId } = body;

    // Validate required fields
    if (!otpCode || !chatId) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP code and chat ID are required",
        },
        { status: 400 }
      );
    }

    console.log(
      "🔐 Completing email linking with OTP:",
      otpCode,
      "for chatId:",
      chatId
    );

    // Complete email linking
    const linkedUser = await UserModel.completeEmailLinking(
      otpCode.toString(),
      parseInt(chatId)
    );

    console.log("✅ Email linking completed for:", linkedUser.name);

    return NextResponse.json({
      success: true,
      message:
        "Telegram account linked successfully via email + OTP verification",
      user: {
        name: linkedUser.name,
        email: linkedUser.email,
        telegramUsername: linkedUser.telegramUsername,
      },
    });
  } catch (error: any) {
    console.error("❌ Complete email linking error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to complete email linking",
      },
      { status: error.status || 500 }
    );
  }
}
