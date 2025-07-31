import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Only check bot in runtime, not during build
    if (
      process.env.NEXT_RUNTIME !== "nodejs" ||
      process.env.NODE_ENV === "test"
    ) {
      return NextResponse.json({
        success: false,
        message: "Bot not available during build or test",
      });
    }

    // Dynamic import to prevent build-time initialization
    const { default: bot } = await import("@/lib/telegramBot");

    if (bot) {
      return NextResponse.json({
        success: true,
        message: "Telegram Bot initialized successfully",
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Bot not initialized",
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
