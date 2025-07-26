// telegramBotManager.ts - Better singleton management
const TelegramBot = require("node-telegram-bot-api");
import axios from "axios";

class TelegramBotManager {
  private static instance: TelegramBotManager;
  private bot: any = null;
  private isInitializing: boolean = false;
  private initPromise: Promise<any> | null = null;

  private constructor() {}

  static getInstance(): TelegramBotManager {
    if (!TelegramBotManager.instance) {
      TelegramBotManager.instance = new TelegramBotManager();
    }
    return TelegramBotManager.instance;
  }

  async getBot() {
    // If bot exists and is working, return it
    if (this.bot) {
      return this.bot;
    }

    // If initialization is in progress, wait for it
    if (this.isInitializing && this.initPromise) {
      console.log("⏳ Waiting for bot initialization...");
      return await this.initPromise;
    }

    // Start initialization
    this.isInitializing = true;
    this.initPromise = this.initializeBot();

    try {
      this.bot = await this.initPromise;
      return this.bot;
    } finally {
      this.isInitializing = false;
    }
  }

  private async initializeBot() {
    // Skip in test environment
    if (process.env.NODE_ENV === "test") {
      console.log("⏭️ Skipping Telegram Bot in test environment");
      return null;
    }

    try {
      // Stop any existing bot first
      if (this.bot) {
        console.log("🛑 Stopping existing bot instance...");
        await this.bot.stopPolling();
        this.bot = null;
      }

      const token = process.env.TELEGRAM_BOT_TOKEN;

      console.log("🤖 Creating new Telegram Bot instance...");
      const newBot = new TelegramBot(token, {
        webHook: {
          port: process.env.PORT || 3000,
        },
      });

      const webhookUrl =
        process.env.TELEGRAM_WEBHOOK_URL || `https://yourdomain.com/${token}`;
      await newBot.setWebHook(webhookUrl);

      // Setup handlers
      this.setupHandlers(newBot);

      console.log("✅ Telegram Bot initialized successfully");
      return newBot;
    } catch (error) {
      console.error("❌ Failed to initialize Telegram Bot:", error);
      throw error;
    }
  }

  private setupHandlers(bot: any) {
    // Handle incoming messages
    bot.on("message", async (msg: any) => {
      const chatId = msg.chat.id;
      const text = msg.text;
      const name = msg.from.first_name;
      const username = msg.from.username;

      console.log(`📩 Message from ${name} (${chatId}): ${text}`);

      if (text && text.startsWith("/")) {
        return; // Skip commands for now
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (text && emailPattern.test(text.trim())) {
        // Handle email linking
        console.log(`🔗 Attempting to link email: ${text.trim()}`);

        try {
          const result = await this.linkAccount(
            text.trim(),
            chatId,
            name,
            username
          );

          if (result.success) {
            await bot.sendMessage(
              chatId,
              `✅ *Berhasil terhubung!*

` +
                `Halo ${name}! Akun Telegram Anda telah berhasil dihubungkan dengan:

` +
                `👤 *Nama:* ${result.user.name}
` +
                `📧 *Email:* ${result.user.email}

` +
                `Sekarang Anda akan menerima notifikasi dari Reeru Bot. 🔔`,
              { parse_mode: "Markdown" }
            );

            console.log(
              `✅ Successfully linked: ${result.user.name} (${chatId})`
            );
          } else {
            await bot.sendMessage(
              chatId,
              `❌ *Gagal menghubungkan akun*

${result.message}`,
              { parse_mode: "Markdown" }
            );
          }
        } catch (error) {
          const err = error as Error;
          console.log("❌ Link process error:", err.message);

          let errorMessage = "❌ *Gagal menghubungkan akun*\n\n";

          if (err.message.includes("tidak ditemukan")) {
            errorMessage +=
              "Email tidak ditemukan di sistem Reeru. Pastikan email sudah terdaftar.";
          } else if (err.message.includes("sudah terhubung")) {
            errorMessage +=
              "Akun Telegram ini sudah terhubung dengan user lain.";
          } else if (err.message.includes("server")) {
            errorMessage +=
              "Terjadi masalah dengan server. Silakan coba lagi dalam beberapa saat.";
          } else {
            errorMessage += `${err.message}\n\nSilakan coba lagi atau hubungi support.`;
          }

          await bot.sendMessage(chatId, errorMessage, {
            parse_mode: "Markdown",
          });
        }
      } else {
        await bot.sendMessage(
          chatId,
          `👋 Halo ${name}! Selamat datang di *Reeru Bot*

` +
            `🤖 Untuk menghubungkan akun Reeru dengan Telegram, kirim email yang terdaftar di Reeru.

` +
            `📧 Contoh: *user@example.com*

` +
            `⚠️ Pastikan format email benar dan sudah terdaftar di sistem Reeru.

` +
            `Setelah terhubung, Anda akan menerima notifikasi penting dari Reeru.`,
          { parse_mode: "Markdown" }
        );
      }
    });

    // Handle errors
    bot.on("polling_error", (error: unknown) => {
      if (error instanceof Error) {
        console.log("❌ Polling error:", error.message);

        // If conflict error, try to recover
        if (error.message.includes("409 Conflict")) {
          console.log("🔄 Attempting to recover from conflict...");
          setTimeout(() => {
            this.restartBot();
          }, 5000);
        }
      } else {
        console.log("❌ Unknown polling error:", error);
      }
    });
  }

  private async linkAccount(
    email: string,
    chatId: number,
    name: string,
    username: string | undefined
  ) {
    const payload = {
      email: email.trim(),
      chatId: chatId.toString(), // Ensure chatId is a string
      telegramName: name,
      telegramUsername: username || null,
    };

    console.log("📤 Sending payload to API:", payload);

    try {
      const response = await axios.post(
        `${
          process.env.API_BASE_URL || "http://localhost:3000"
        }/api/telegram/link-by-email`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 15000, // 15 second timeout
          validateStatus: (status) => status < 500, // Don't throw on 4xx errors
        }
      );

      console.log("📨 API Response:", response.status, response.data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes("response")) {
          console.error("❌ API Error Response:", error.message);
          throw new Error("Server error");
        } else if (error.message.includes("request")) {
          console.error("❌ No response from API:", error.message);
          throw new Error("Tidak dapat terhubung ke server");
        } else {
          console.error("❌ Request setup error:", error.message);
          throw new Error("Gagal mengirim request");
        }
      } else {
        console.error("❌ Unknown error:", error);
        throw new Error("An unknown error occurred");
      }
    }
  }

  async restartBot() {
    console.log("🔄 Restarting bot...");
    if (this.bot) {
      await this.bot.stopPolling();
      this.bot = null;
    }
    this.isInitializing = false;
    this.initPromise = null;
    await this.getBot();
  }

  async sendNotification(chatId: number, message: string, options?: any) {
    try {
      const bot = await this.getBot();
      if (!bot) {
        console.log("❌ Bot not available");
        return false;
      }

      await bot.sendMessage(
        chatId,
        message,
        options || { parse_mode: "Markdown" }
      );
      console.log(`✅ Notification sent to ${chatId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send notification to ${chatId}:`, error);
      return false;
    }
  }

  async stopBot() {
    if (this.bot) {
      console.log("🛑 Stopping Telegram bot...");
      await this.bot.stopPolling();
      this.bot = null;
    }
  }
}

export default TelegramBotManager;
