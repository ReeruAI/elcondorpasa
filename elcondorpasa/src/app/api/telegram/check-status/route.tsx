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

    console.log("📊 Checking status for chatId:", chatId);

    // Get user by chatId
    const user = await UserModel.getUserByTelegramChatId(parseInt(chatId));

    if (user) {
      console.log("✅ Connected user found:", user.name);

      return NextResponse.json({
        success: true,
        message: "Account is connected",
        user: {
          name: user.name,
          email: user.email,
          telegramUsername: user.telegramUsername,
          connectedAt: user.createdAt || null,
        },
      });
    } else {
      console.log("❌ No connected user found for chatId:", chatId);

      return NextResponse.json({
        success: false,
        message: "No connected account found",
      });
    }
  } catch (error: any) {
    console.error("❌ Check status error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to check status",
      },
      { status: error.status || 500 }
    );
  }
}
