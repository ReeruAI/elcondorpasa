// src/instrumentation.ts
// Simple auto-init approach for Next.js 15

console.log("🚀 Instrumentation: Server starting...");

// This function is called by Next.js during server initialization
export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV !== "test"
  ) {
    console.log("🚀 Register hook: Starting in Node.js runtime...");

    // Dynamic import to ensure it only loads in Node.js runtime
    try {
      await import("@/lib/telegramBot");
      console.log("✅ Telegram Bot module loaded successfully");
    } catch (error) {
      console.error("❌ Failed to load Telegram Bot:", error);
    }
  } else {
    console.log(
      "⏭️  Skipping Telegram Bot initialization (not in Node.js runtime)"
    );
  }
}
