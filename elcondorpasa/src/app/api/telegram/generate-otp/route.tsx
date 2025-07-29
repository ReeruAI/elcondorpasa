// File: app/api/telegram/generate-otp/route.ts
import UserModel from "@/db/models/UserModel";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get userId from middleware
    const userId = request.headers.get("x-userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🔐 Generating OTP for user:", userId);

    // Generate OTP
    const otpData = await UserModel.generateTelegramOTP(userId);

    console.log("✅ OTP generated successfully for:", otpData.email);

    return NextResponse.json({
      success: true,
      message: "OTP generated successfully",
      data: {
        otpCode: otpData.otpCode,
        expiresAt: otpData.expiresAt,
        instructions: "Go to Telegram and send this OTP code to @YourBot",
      },
    });
  } catch (error: any) {
    console.error("❌ Generate OTP error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to generate OTP",
      },
      { status: error.status || 500 }
    );
  }
}

// GET: Check current OTP status
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const otpStatus = await UserModel.getTelegramOTPStatus(userId);

    return NextResponse.json({
      success: true,
      data: otpStatus,
    });
  } catch (error: any) {
    console.error("❌ Get OTP status error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to get OTP status",
      },
      { status: error.status || 500 }
    );
  }
}

// DELETE: Cancel active OTP
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get("x-userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await UserModel.cancelTelegramOTP(userId);

    return NextResponse.json({
      success: true,
      message: "OTP cancelled successfully",
    });
  } catch (error: any) {
    console.error("❌ Cancel OTP error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to cancel OTP",
      },
      { status: error.status || 500 }
    );
  }
}
