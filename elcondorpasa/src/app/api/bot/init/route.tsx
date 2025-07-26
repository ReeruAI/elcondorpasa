import { initTelegramBot } from "@/lib/telegramBot";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const bot = initTelegramBot();

    if (bot) {
      return NextResponse.json({
        success: true,
        message: "Telegram Bot initialized successfully",
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Bot already initialized or failed to start",
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}
