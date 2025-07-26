// src/instrumentation.ts
// Simple auto-init approach for Next.js 15

import "@/lib/telegramBot"; // Ensure telegramBot.ts is executed during server startup

console.log("🚀 Instrumentation: Server starting...");

if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV !== "test") {
  console.log("🤖 Auto-initializing...");

  // Removed import and calls to initTelegramBot from telegramBot.js
}

// This function may be called in newer Next.js versions
export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV !== "test"
  ) {
    console.log("🚀 Register hook: Starting...");

    // Removed import and calls to initTelegramBot from telegramBot.js
  }
}
