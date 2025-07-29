// telegramBotManager.ts - Complete with Email-OTP Flow
const TelegramBot = require("node-telegram-bot-api");
import axios from "axios";

class TelegramBotManager {
  private static instance: TelegramBotManager;
  private bot: any = null;
  private isInitializing: boolean = false;
  private initPromise: Promise<any> | null = null;

  // Store user states (in production, use Redis or database)
  private userStates = new Map<
    number,
    {
      step: "waiting_email" | "waiting_otp";
      email?: string;
      expiresAt?: Date;
    }
  >();

  private constructor() {
    // Clean up expired states periodically
    setInterval(() => {
      const now = new Date();
      for (const [chatId, state] of this.userStates.entries()) {
        if (state.expiresAt && state.expiresAt < now) {
          this.userStates.delete(chatId);
          console.log(`🧹 Cleaned expired state for chatId: ${chatId}`);
        }
      }
    }, 5 * 60 * 1000); // Clean every 5 minutes
  }

  static getInstance(): TelegramBotManager {
    if (!TelegramBotManager.instance) {
      TelegramBotManager.instance = new TelegramBotManager();
    }
    return TelegramBotManager.instance;
  }

  async getBot() {
    if (this.bot) {
      return this.bot;
    }

    if (this.isInitializing && this.initPromise) {
      console.log("⏳ Waiting for bot initialization...");
      return await this.initPromise;
    }

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
    if (process.env.NODE_ENV === "test") {
      console.log("⏭️ Skipping Telegram Bot in test environment");
      return null;
    }

    try {
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

      this.setupHandlers(newBot);

      console.log("✅ Telegram Bot initialized successfully");
      return newBot;
    } catch (error) {
      console.error("❌ Failed to initialize Telegram Bot:", error);
      throw error;
    }
  }

  private async processVideoWithKlap(
    videoUrl: string,
    chatId: number,
    userId: number,
    bot: any
  ) {
    const API_URL = `${
      process.env.API_BASE_URL || "http://localhost:3000"
    }/api/klap`;
    let messageId: number | undefined;
    let lastProgress = 0;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-chat-id": chatId.toString(),
        },
        body: JSON.stringify({ video_url: videoUrl }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;

              const data = JSON.parse(jsonStr);
              console.log("📊 Klap API Update:", data.status, data.message);

              if (
                data.progress !== undefined &&
                data.progress !== lastProgress
              ) {
                const progressBar =
                  "█".repeat(Math.floor(data.progress / 10)) +
                  "░".repeat(10 - Math.floor(data.progress / 10));

                let statusEmoji = "⏳";
                if (data.status === "creating_task") statusEmoji = "🚀";
                else if (data.status === "processing") statusEmoji = "🔄";
                else if (data.status === "exporting_short") statusEmoji = "📦";
                else if (data.status === "completed") statusEmoji = "✅";
                else if (data.status === "error") statusEmoji = "❌";

                const progressMessage =
                  `${statusEmoji} *Generating Short/Reel*\n\n` +
                  `📊 Status: ${data.message}\n` +
                  `📈 Progress: [${progressBar}] ${data.progress}%\n\n` +
                  `${data.task_id ? `🆔 Task ID: ${data.task_id}\n` : ""}` +
                  `${
                    data.tokens_remaining !== undefined
                      ? `🪙 Tokens remaining: ${data.tokens_remaining}\n`
                      : ""
                  }` +
                  `⏱️ Please wait...`;

                if (messageId) {
                  try {
                    await bot.editMessageText(progressMessage, {
                      chat_id: chatId,
                      message_id: messageId,
                      parse_mode: "Markdown",
                    });
                  } catch (editError) {
                    // Message might be identical, ignore error
                  }
                } else {
                  const sentMessage = await bot.sendMessage(
                    chatId,
                    progressMessage,
                    {
                      parse_mode: "Markdown",
                    }
                  );
                  messageId = sentMessage.message_id;
                }

                lastProgress = data.progress;
              }

              // Handle completion
              if (data.status === "completed" && data.short) {
                const short = data.short;
                const completionMessage =
                  `✅ *Video Ready!*\n\n` +
                  `🎬 *Title:* ${short.title}\n` +
                  `🎯 *Virality Score:* ${short.virality_score}/100\n` +
                  `💡 *Analysis:*\n_${short.description}_\n\n` +
                  `📝 *Caption suggestion:*\n${
                    short.captions?.tiktok ||
                    short.captions ||
                    "No caption generated"
                  }\n\n` +
                  `🪙 *Tokens remaining:* ${data.tokens_remaining || 0}\n` +
                  `🔗 *Original:* [View on YouTube](${videoUrl})`;

                if (messageId) {
                  await bot.editMessageText(completionMessage, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: "Markdown",
                    disable_web_page_preview: true,
                  });
                }

                // If download URL is available, send the video
                if (short.download_url) {
                  await bot.sendMessage(
                    chatId,
                    "📥 *Downloading your short...*",
                    {
                      parse_mode: "Markdown",
                    }
                  );

                  try {
                    // Try to send as video first
                    await bot.sendVideo(chatId, short.download_url, {
                      caption: `🎬 *${short.title}*\n\n${
                        short.captions?.tiktok || short.captions || ""
                      }`,
                      parse_mode: "Markdown",
                    });
                  } catch (videoError) {
                    console.log(
                      "📹 Video send failed, sending download link instead:",
                      (videoError as Error).message
                    );
                    // If sending as video fails, send download link
                    await bot.sendMessage(
                      chatId,
                      `📥 *Download your short:*\n${short.download_url}`,
                      { parse_mode: "Markdown" }
                    );
                  }
                }
              }

              // Handle errors
              if (data.status === "error") {
                let errorMessage = `❌ *Processing Failed*\n\n`;

                if (data.error_code === "video_too_long") {
                  errorMessage +=
                    `🎬 *Video Too Long*\n\n` +
                    `The video you selected is too long for processing.\n\n` +
                    `📏 *Recommendation:* Use videos shorter than 10 minutes\n` +
                    `⏱️ *Tip:* Shorter videos (2-5 minutes) work best for creating engaging shorts!`;
                } else if (data.error_code === "invalid_url") {
                  errorMessage +=
                    `🔗 *Invalid Video URL*\n\n` +
                    `Please make sure:\n` +
                    `• The YouTube video is public\n` +
                    `• The URL is correct and accessible\n` +
                    `• The video is not age-restricted`;
                } else if (data.error_code === "unsupported_platform") {
                  errorMessage +=
                    `🚫 *Unsupported Platform*\n\n` +
                    `Currently only YouTube videos are supported.\n` +
                    `Please share a YouTube video URL.`;
                } else if (data.error_code === "fetch_shorts_failed") {
                  errorMessage +=
                    `📥 *Fetch Failed*\n\n` +
                    `Your video was processed successfully, but we couldn't retrieve the shorts from Klap.\n\n` +
                    `✅ *Good news:* Your shorts are likely ready!\n` +
                    `🌐 *Check Klap Dashboard:* https://app.klap.app\n` +
                    `🆔 *Project ID:* ${
                      data.project_id || "Not available"
                    }\n\n` +
                    `📧 *Need help?* Contact support with the Project ID above.`;
                } else if (data.error_code === "no_shorts_generated") {
                  errorMessage +=
                    `🤔 *No Shorts Generated*\n\n` +
                    `The AI couldn't create engaging shorts from this video.\n\n` +
                    `This might happen when:\n` +
                    `• Video has mostly music/no clear speech\n` +
                    `• Content is too complex or abstract\n` +
                    `• Video quality is too low\n\n` +
                    `💡 *Try videos with:*\n` +
                    `• Clear speech/dialogue\n` +
                    `• Engaging visual content\n` +
                    `• Educational or entertaining topics\n` +
                    `• Good audio quality`;
                } else {
                  errorMessage +=
                    `Error: ${data.message}\n` +
                    `${
                      data.error_details
                        ? `\nDetails: ${data.error_details}`
                        : ""
                    }`;
                }

                errorMessage += `\n\n💡 *Try again with a different video or contact support if the problem persists.*`;

                if (messageId) {
                  await bot.editMessageText(errorMessage, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: "Markdown",
                  });
                } else {
                  await bot.sendMessage(chatId, errorMessage, {
                    parse_mode: "Markdown",
                  });
                }
                break;
              }
            } catch (parseError) {
              console.error("Error parsing SSE data:", parseError);
            }
          }
        }
      }
    } catch (error: any) {
      console.error("❌ Klap API Error:", error);

      const errorMessage =
        `❌ *Error*\n\n` +
        `Failed to process your video.\n` +
        `Error: ${error.message || "Unknown error"}\n\n` +
        `Please try again later or contact support.`;

      if (messageId) {
        await bot.editMessageText(errorMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "Markdown",
        });
      } else {
        await bot.sendMessage(chatId, errorMessage, {
          parse_mode: "Markdown",
        });
      }
    }
  }

  private setupHandlers(bot: any) {
    // Handle callback queries (button clicks)
    bot.on("callback_query", async (query: any) => {
      const chatId = query.message.chat.id;
      const data = query.data;
      const messageId = query.message.message_id;
      const userId = query.from.id;
      const userName = query.from.first_name;

      console.log(`🔘 Callback query from ${userName} (${userId}): ${data}`);

      // Handle /generateVideo callback
      if (data.startsWith("/generateVideo ")) {
        const videoUrl = data.replace("/generateVideo ", "");

        try {
          await bot.answerCallbackQuery(query.id, {
            text: "🎬 Processing your video...",
            show_alert: false,
          });

          await bot.sendMessage(
            chatId,
            `🎬 *Generating Short/Reel*\n\n` +
              `Processing video:\n${videoUrl}\n\n` +
              `⏳ This may take a moment. We'll notify you when it's ready!`,
            {
              parse_mode: "Markdown",
              reply_to_message_id: messageId,
            }
          );

          await this.processVideoWithKlap(videoUrl, chatId, userId, bot);
        } catch (error: any) {
          console.error("❌ Error handling callback query:", error);

          await bot.answerCallbackQuery(query.id, {
            text: "❌ Error processing request",
            show_alert: true,
          });

          await bot.sendMessage(
            chatId,
            `❌ *Error*\n\nFailed to process your video. Please try again later.`,
            { parse_mode: "Markdown" }
          );
        }
      }
    });

    // Handle incoming messages - Email → OTP Flow
    bot.on("message", async (msg: any) => {
      const chatId = msg.chat.id;
      const text = msg.text;
      const name = msg.from.first_name;
      const username = msg.from.username;

      console.log(`📩 Message from ${name} (${chatId}): ${text}`);

      if (text && text.startsWith("/")) {
        return; // Skip commands
      }

      const currentState = this.userStates.get(chatId) || {
        step: "waiting_email",
      };

      // Handle 6-digit OTP code
      const otpPattern = /^\d{6}$/;
      if (text && otpPattern.test(text.trim())) {
        console.log(`🔐 OTP received: ${text.trim()}`);

        if (currentState.step === "waiting_otp" && currentState.email) {
          // Complete email linking with OTP
          try {
            const API_URL = process.env.API_BASE_URL || "http://localhost:3000";
            const response = await axios.post(
              `${API_URL}/api/telegram/complete-email-linking`,
              {
                otpCode: text.trim(),
                chatId: chatId,
              },
              {
                headers: { "Content-Type": "application/json" },
                timeout: 10000,
              }
            );

            if (response.data.success) {
              this.userStates.delete(chatId); // Clear state

              await bot.sendMessage(
                chatId,
                `✅ *Account Connected Successfully!*\n\n` +
                  `🎉 Welcome ${name}!\n\n` +
                  `Your Telegram account has been linked with:\n` +
                  `👤 *Name:* ${response.data.user.name}\n` +
                  `📧 *Email:* ${response.data.user.email}\n\n` +
                  `🔔 You will now receive notifications from Reeru Bot.\n\n` +
                  `🚀 Ready to create amazing content!`,
                { parse_mode: "Markdown" }
              );

              console.log(
                `✅ Email + OTP linking completed for: ${response.data.user.name}`
              );
            } else {
              await bot.sendMessage(
                chatId,
                `❌ *Verification Failed*\n\n${response.data.message}\n\n` +
                  `💡 *Try again:* Send your email address to restart the process.`,
                { parse_mode: "Markdown" }
              );
            }
          } catch (error: any) {
            console.error("❌ Complete email linking error:", error);

            let errorMessage = "❌ *Verification Failed*\n\n";

            if (error.response?.data?.message) {
              if (error.response.data.message.includes("Invalid OTP")) {
                errorMessage +=
                  "❌ *Invalid or Expired OTP*\n\n" +
                  "The OTP code is either invalid, expired, or already used.\n\n" +
                  "💡 *Solution:*\n" +
                  "1. Go to your Reeru dashboard\n" +
                  "2. Generate a new OTP code\n" +
                  "3. Send the new code here";
              } else if (
                error.response.data.message.includes(
                  "verification session expired"
                )
              ) {
                errorMessage +=
                  "⏰ *Session Expired*\n\n" +
                  "Your verification session has expired.\n\n" +
                  "💡 *Solution:* Send your email address again to restart.";
                this.userStates.delete(chatId);
              } else {
                errorMessage += error.response.data.message;
              }
            } else {
              errorMessage += "Unable to verify OTP. Please try again.";
            }

            await bot.sendMessage(chatId, errorMessage, {
              parse_mode: "Markdown",
            });
          }
        } else {
          // User sent OTP but not in correct flow
          await bot.sendMessage(
            chatId,
            `🔐 *OTP Code Detected*\n\n` +
              `I see you sent a 6-digit code, but you need to send your email address first.\n\n` +
              `📧 *Please send your email:* user@example.com\n` +
              `Then I'll ask for your OTP code! 😊`,
            { parse_mode: "Markdown" }
          );
        }
        return;
      }

      // Handle email address
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (text && emailPattern.test(text.trim())) {
        console.log(`📧 Email linking initiated: ${text.trim()}`);

        try {
          const API_URL = process.env.API_BASE_URL || "http://localhost:3000";
          const response = await axios.post(
            `${API_URL}/api/telegram/initiate-email-linking`,
            {
              email: text.trim(),
              chatId: chatId,
              telegramName: name,
              telegramUsername: username,
            },
            {
              headers: { "Content-Type": "application/json" },
              timeout: 10000,
            }
          );

          if (response.data.success) {
            // Set user state to waiting for OTP
            this.userStates.set(chatId, {
              step: "waiting_otp",
              email: text.trim(),
              expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            });

            await bot.sendMessage(
              chatId,
              `✅ *Email Verified!*\n\n` +
                `👤 *Account Found:* ${response.data.user.name}\n` +
                `📧 *Email:* ${response.data.user.email}\n\n` +
                `🔐 *Next Step:*\n` +
                `1️⃣ Go to your Reeru dashboard\n` +
                `2️⃣ Generate OTP code\n` +
                `3️⃣ Send the 6-digit code here\n\n` +
                `⏰ *Hurry!* This session expires in 10 minutes.\n` +
                `🔄 To restart, just send your email again.`,
              { parse_mode: "Markdown" }
            );

            console.log(
              `✅ Email verified, waiting for OTP: ${response.data.user.name}`
            );
          } else {
            await bot.sendMessage(
              chatId,
              `❌ *Email Verification Failed*\n\n${response.data.message}`,
              { parse_mode: "Markdown" }
            );
          }
        } catch (error: any) {
          console.log("❌ Email initiation error:", error.message);

          let errorMessage = "❌ *Email Verification Failed*\n\n";
          const errorCode = error.response?.data?.errorCode;

          switch (errorCode) {
            case "email_not_found":
              errorMessage +=
                "📧 *Email Not Found*\n\n" +
                "The email you entered is not registered in Reeru system.\n\n" +
                "💡 *Solutions:*\n" +
                "• Make sure email is registered in Reeru\n" +
                "• Check spelling carefully\n" +
                "• Register new account if needed";
              break;

            case "telegram_already_linked_to_other_user":
              errorMessage +=
                "🔗 *Telegram Already Connected*\n\n" +
                "This Telegram account is already linked to another user.\n\n" +
                "💡 *Solutions:*\n" +
                "• Use a different Telegram account\n" +
                "• Contact support to disconnect old connection";
              break;

            case "email_already_linked_to_other_telegram":
              errorMessage +=
                "📱 *Email Already Connected*\n\n" +
                "This email is already linked to another Telegram account.\n\n" +
                "💡 *Solutions:*\n" +
                "• Use the previously connected Telegram account\n" +
                "• Contact support to disconnect old connection";
              break;

            default:
              errorMessage += `${
                error.response?.data?.message || error.message
              }\n\n💡 Please try again or contact support.`;
          }

          await bot.sendMessage(chatId, errorMessage, {
            parse_mode: "Markdown",
          });
        }
        return;
      }

      // Default welcome message
      await bot.sendMessage(
        chatId,
        `👋 Halo ${name}! Selamat datang di *Reeru Bot*\n\n` +
          `🔗 *Connect your account in 2 easy steps:*\n\n` +
          `*Step 1:* Send your registered email address\n` +
          `📧 Example: *user@example.com*\n\n` +
          `*Step 2:* I'll verify your email, then you send OTP from dashboard\n` +
          `🔐 Example: *123456*\n\n` +
          `⚡ Simple, secure, and fast! Let's start with your email. 😊`,
        { parse_mode: "Markdown" }
      );
    });

    // Handle errors
    bot.on("polling_error", (error: unknown) => {
      if (error instanceof Error) {
        console.log("❌ Polling error:", error.message);

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
