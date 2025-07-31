import bot from "@/lib/telegramBot";
import { NextResponse } from "next/server";

export async function GET() {
  try {
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
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to initialize bot",
      },
      { status: 500 }
    );
  }
}
