// File: app/api/telegram/verify-otp/route.ts
import UserModel from "@/db/models/UserModel";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { otpCode, chatId, telegramName, telegramUsername } = body;

    // Validate required fields
    if (!otpCode || !chatId || !telegramName) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP code, chat ID, and Telegram name are required",
        },
        { status: 400 }
      );
    }

    console.log("🔐 Verifying OTP:", otpCode, "for chatId:", chatId);

    // Verify OTP and link account
    const linkedUser = await UserModel.verifyTelegramOTP(
      otpCode.toString(),
      parseInt(chatId),
      telegramName,
      telegramUsername
    );

    console.log("✅ OTP verified and account linked:", linkedUser.name);

    return NextResponse.json({
      success: true,
      message: "Telegram account linked successfully",
      user: {
        name: linkedUser.name,
        email: linkedUser.email,
        telegramUsername: linkedUser.telegramUsername,
      },
    });
  } catch (error: unknown) {
    console.error("❌ Verify OTP error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to verify OTP",
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
