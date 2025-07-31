// botEntry.ts
// Entry point for running the Telegram bot in the correct mode based on environment

if (process.env.NODE_ENV === "production") {
  // Use webhook version (telegramBotManager) in production
  console.log("🚀 Starting Telegram bot in WEBHOOK mode (production)");
  import("./src/lib/telegramBotManager")
    .then(() => {
      console.log("✅ Webhook bot initialized");
    })
    .catch((error) => {
      console.error("❌ Failed to initialize webhook bot:", error);
      process.exit(1);
    });
} else {
  // Use polling version for local development
  console.log("🚀 Starting Telegram bot in POLLING mode (development)");
  import("./src/lib/telegramBot")
    .then(() => {
      console.log("✅ Polling bot initialized");
    })
    .catch((error) => {
      console.error("❌ Failed to initialize polling bot:", error);
      process.exit(1);
    });
}
