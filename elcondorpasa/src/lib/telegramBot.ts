// telegramBot.ts
// This file should only be imported in Node.js runtime
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import type { CallbackQuery, Message } from "node-telegram-bot-api";
import type CronService from "@/lib/cronService";

// Prevent initialization during build or in non-runtime environments
const shouldInitialize =
  process.env.NEXT_RUNTIME === "nodejs" &&
  process.env.NODE_ENV !== "test" &&
  typeof window === "undefined" && // Ensure we're on server side
  !process.env.NEXT_PHASE; // Prevent during build phases

let bot: TelegramBot | null = null;
let cronService: CronService | null = null;

if (shouldInitialize) {
  const token = process.env.TELEGRAM_BOT_TOKEN as string;

  if (token) {
    bot = new TelegramBot(token, { polling: true });
    console.log("🤖 Telegram Bot started successfully");

    // Dynamically import CronService only when bot is initialized
    import("@/lib/cronService")
      .then((module) => {
        console.log("🔧 Initializing CronService in telegramBot.ts");
        cronService = module.default.getInstance();
      })
      .catch((error) => {
        console.error("❌ Failed to initialize CronService:", error);
      });

    // Store user states (in production, use Redis or database)
    const userStates = new Map<
      number,
      {
        step: "waiting_email" | "waiting_otp";
        email?: string;
        expiresAt?: Date;
      }
    >();

    // Helper function to process video with Klap API
    const processVideoWithKlap = async (
      videoUrl: string,
      chatId: number,
      userId: string
    ) => {
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

        if (userId) {
          console.log(`📊 Processing video for user ${userId}...`);
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
                  else if (data.status === "exporting_short")
                    statusEmoji = "📦";
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

                  if (messageId && bot) {
                    try {
                      await bot.editMessageText(progressMessage, {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: "Markdown",
                      });
                    } catch (editError: unknown) {
                      // Message might be identical, ignore error
                      if (editError instanceof Error) {
                        console.error(
                          "❌ Error editing message:",
                          editError.message
                        );
                      } else {
                        console.error("❌ Error editing message:", editError);
                      }
                    }
                  } else if (bot) {
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

                if (data.status === "completed" && data.short && bot) {
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
                    `🪙 *Tokens remaining:* ${data.tokens_remaining || 0}\n\n` +
                    `🌐 *View your short:* [Open Dashboard](${
                      process.env.API_BASE_URL || "http://localhost:3000"
                    }/your-clip)\n` +
                    `🔗 *Original:* [View on YouTube](${videoUrl})`;

                  if (messageId) {
                    await bot.editMessageText(completionMessage, {
                      chat_id: chatId,
                      message_id: messageId,
                      parse_mode: "Markdown",
                      disable_web_page_preview: true,
                    });
                  }

                  await bot.sendMessage(
                    chatId,
                    `🎉 *Success!*\n\n` +
                      `Your short "${short.title}" is ready!\n\n` +
                      `📱 *View & Download:* [${
                        process.env.API_BASE_URL || "http://localhost:3000"
                      }/your-clip](${
                        process.env.API_BASE_URL || "http://localhost:3000"
                      }/your-clip)\n\n` +
                      `💾 *Direct download:* ${short.download_url}`,
                    {
                      parse_mode: "Markdown",
                      disable_web_page_preview: false,
                    }
                  );
                }

                if (data.status === "error" && bot) {
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
              } catch (parseError: unknown) {
                if (parseError instanceof Error) {
                  console.error("Error parsing SSE data:", parseError.message);
                } else {
                  console.error("Error parsing SSE data:", parseError);
                }
              }
            }
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("❌ Klap API Error:", error.message);
        } else {
          console.error("❌ Klap API Error:", error);
        }

        const errorMessage =
          `❌ *Error*\n\n` +
          `Failed to process your video.\n` +
          `Error: ${
            error instanceof Error ? error.message : "Unknown error"
          }\n\n` +
          `Please try again later or contact support.`;

        if (messageId && bot) {
          await bot.editMessageText(errorMessage, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
          });
        } else if (bot) {
          await bot.sendMessage(chatId, errorMessage, {
            parse_mode: "Markdown",
          });
        }
      }
    };

    // Handle callback queries (video generation)
    bot.on("callback_query", async (query: CallbackQuery) => {
      const message = query.message as Message;
      const chatId = message.chat.id;
      const data = query.data || "";
      const messageId = message.message_id;
      const userId = query.from.id;
      const userName = query.from.first_name;

      console.log(`🔘 Callback query from ${userName} (${userId}): ${data}`);

      if (data.startsWith("/generateVideo ")) {
        const videoUrl = data.replace("/generateVideo ", "");

        try {
          if (bot) {
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

            await processVideoWithKlap(videoUrl, chatId, String(userId));
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.error("❌ Error handling callback query:", error.message);
          } else {
            console.error("❌ Error handling callback query:", error);
          }

          if (bot) {
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
      }
    });

    // Handle incoming messages - Email → OTP Flow
    bot.on("message", async (msg: Message) => {
      const chatId = msg.chat.id;
      const text = msg.text;
      const name = msg.from?.first_name || "User";
      const username = msg.from?.username || "";

      console.log(`📩 Message from ${name} (${chatId}): ${text}`);

      // Skip commands
      if (text && text.startsWith("/")) {
        return;
      }

      const currentState = userStates.get(chatId) || { step: "waiting_email" };

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
              userStates.delete(chatId); // Clear state

              if (bot) {
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
              }

              console.log(
                `✅ Email + OTP linking completed for: ${response.data.user.name}`
              );
            } else {
              if (bot) {
                await bot.sendMessage(
                  chatId,
                  `❌ *Verification Failed*\n\n${response.data.message}\n\n` +
                    `💡 *Try again:* Send your email address to restart the process.`,
                  { parse_mode: "Markdown" }
                );
              }
            }
          } catch (error: unknown) {
            if (error instanceof Error) {
              console.error("❌ Complete email linking error:", error.message);
            } else {
              console.error("❌ Complete email linking error:", error);
            }

            let errorMessage = "❌ *Verification Failed*\n\n";

            // Try to access error.response?.data?.message if possible
            const err = error as { response?: { data?: { message?: string } } };
            if (err.response?.data?.message) {
              if (err.response.data.message.includes("Invalid OTP")) {
                errorMessage +=
                  "❌ *Invalid or Expired OTP*\n\n" +
                  "The OTP code is either invalid, expired, or already used.\n\n" +
                  "💡 *Solution:*\n" +
                  "1. Go to your Reeru dashboard\n" +
                  "2. Generate a new OTP code\n" +
                  "3. Send the new code here";
              } else if (
                err.response.data.message.includes(
                  "verification session expired"
                )
              ) {
                errorMessage +=
                  "⏰ *Session Expired*\n\n" +
                  "Your verification session has expired.\n\n" +
                  "💡 *Solution:* Send your email address again to restart.";
                userStates.delete(chatId);
              } else {
                errorMessage += err.response.data.message;
              }
            } else {
              errorMessage += "Unable to verify OTP. Please try again.";
            }

            if (bot) {
              await bot.sendMessage(chatId, errorMessage, {
                parse_mode: "Markdown",
              });
            }
          }
        } else {
          // User sent OTP but not in correct flow
          if (bot) {
            await bot.sendMessage(
              chatId,
              `🔐 *OTP Code Detected*\n\n` +
                `I see you sent a 6-digit code, but you need to send your email address first.\n\n` +
                `📧 *Please send your email:* user@example.com\n` +
                `Then I'll ask for your OTP code! 😊`,
              { parse_mode: "Markdown" }
            );
          }
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
            userStates.set(chatId, {
              step: "waiting_otp",
              email: text.trim(),
              expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            });

            if (bot) {
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
            }

            console.log(
              `✅ Email verified, waiting for OTP: ${response.data.user.name}`
            );
          } else {
            if (bot) {
              await bot.sendMessage(
                chatId,
                `❌ *Email Verification Failed*\n\n${response.data.message}`,
                { parse_mode: "Markdown" }
              );
            }
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.log("❌ Email initiation error:", error.message);
          } else {
            console.log("❌ Email initiation error:", error);
          }

          let errorMessage = "❌ *Email Verification Failed*\n\n";
          const err = error as {
            response?: { data?: { message?: string; errorCode?: string } };
          };
          const errorCode = err.response?.data?.errorCode;

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
                err.response?.data?.message ||
                (error instanceof Error ? error.message : "Unknown error")
              }\n\n💡 Please try again or contact support.`;
          }

          if (bot) {
            await bot.sendMessage(chatId, errorMessage, {
              parse_mode: "Markdown",
            });
          }
        }
        return;
      }

      // Default welcome message
      if (bot) {
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
      }
    });

    // Commands
    bot.onText(/\/start/, async (msg: Message) => {
      const chatId = msg.chat.id;
      const name = msg.from?.first_name || "User";

      if (bot) {
        await bot.sendMessage(
          chatId,
          `🎉 Welcome to *Reeru Bot*, ${name}!\n\n` +
            `🔗 *Connect your account:*\n\n` +
            `*Step 1:* Send your registered email\n` +
            `*Step 2:* Send OTP from your dashboard\n\n` +
            `📧 Start by sending your email address!\n` +
            `Example: user@example.com`,
          { parse_mode: "Markdown" }
        );
      }
    });

    bot.onText(/\/help/, async (msg: Message) => {
      const chatId = msg.chat.id;

      if (bot) {
        await bot.sendMessage(
          chatId,
          `❓ *Reeru Bot Help*\n\n` +
            `*Available Commands:*\n` +
            `• /start - Get started\n` +
            `• /help - Show this help\n` +
            `• /status - Check connection status\n` +
            `• /unlink - Disconnect your account\n\n` +
            `*How to Connect:*\n` +
            `1. Send your registered email\n` +
            `2. Go to Reeru dashboard\n` +
            `3. Generate OTP code\n` +
            `4. Send 6-digit code here\n\n` +
            `*Example:* user@example.com → 123456`,
          { parse_mode: "Markdown" }
        );
      }
    });

    bot.onText(/\/status/, async (msg: Message) => {
      const chatId = msg.chat.id;
      const name = msg.from?.first_name || "User";

      try {
        // Check if user is linked by trying to get user info
        const API_URL = process.env.API_BASE_URL || "http://localhost:3000";
        const response = await axios.post(
          `${API_URL}/api/telegram/check-status`,
          { chatId: chatId },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 5000,
          }
        );

        if (response.data.success && response.data.user && bot) {
          await bot.sendMessage(
            chatId,
            `📊 *Connection Status*\n\n` +
              `✅ *Connected!*\n\n` +
              `👤 Name: ${response.data.user.name}\n` +
              `📧 Email: ${response.data.user.email}\n` +
              `🆔 Chat ID: ${chatId}\n\n` +
              `🔔 You're receiving daily updates!\n` +
              `📱 Use /unlink to disconnect`,
            { parse_mode: "Markdown" }
          );
        } else if (bot) {
          await bot.sendMessage(
            chatId,
            `📊 *Connection Status*\n\n` +
              `❌ *Not Connected*\n\n` +
              `👤 Name: ${name}\n` +
              `🆔 Chat ID: ${chatId}\n\n` +
              `📧 Send your email to connect your account!`,
            { parse_mode: "Markdown" }
          );
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("❌ Status check error:", error.message);
        } else {
          console.error("❌ Status check error:", error);
        }
        if (bot) {
          await bot.sendMessage(
            chatId,
            `📊 *Connection Status*\n\n` +
              `👤 Name: ${name}\n` +
              `🆔 Chat ID: ${chatId}\n\n` +
              `To check if your account is connected, send your email address. ` +
              `The bot will tell you if it's already linked.`,
            { parse_mode: "Markdown" }
          );
        }
      }
    });

    bot.onText(/\/unlink/, async (msg: Message) => {
      const chatId = msg.chat.id;

      try {
        const API_URL = process.env.API_BASE_URL || "http://localhost:3000";
        const response = await axios.post(
          `${API_URL}/api/telegram/unlink`,
          { chatId: chatId },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 10000,
          }
        );

        if (response.data.success && bot) {
          await bot.sendMessage(
            chatId,
            `✅ *Account Disconnected Successfully!*\n\n` +
              `👤 *Account:* ${response.data.user.name}\n` +
              `📧 *Email:* ${response.data.user.email}\n\n` +
              `🔕 You will no longer receive daily updates.\n` +
              `📱 Your account is now unlinked from this Telegram.\n\n` +
              `💡 *To reconnect:* Send your email address again anytime!`,
            { parse_mode: "Markdown" }
          );

          console.log(
            `✅ Account unlinked: ${response.data.user.name} (${chatId})`
          );
        } else if (bot) {
          await bot.sendMessage(
            chatId,
            `❌ *No Connected Account Found*\n\n` +
              `This Telegram account is not linked to any Reeru account.\n\n` +
              `📧 *To connect:* Send your registered email address`,
            { parse_mode: "Markdown" }
          );
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("❌ Unlink error:", error.message);
        } else {
          console.error("❌ Unlink error:", error);
        }

        let errorMessage = "❌ *Failed to Disconnect Account*\n\n";
        const err = error as { response?: { data?: { message?: string } } };
        if (err.response?.data?.message) {
          errorMessage += err.response.data.message;
        } else {
          errorMessage += "Unable to process unlink request. Please try again.";
        }

        if (bot) {
          await bot.sendMessage(chatId, errorMessage, {
            parse_mode: "Markdown",
          });
        }
      }
    });

    bot.onText(/\/testReminder/, async (msg: Message) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;

      console.log(`🧪 Test reminder requested by ${userId}`);

      try {
        if (cronService) {
          await cronService.testDailyReminder();
          if (bot) {
            await bot.sendMessage(
              chatId,
              `✅ *Test Reminder Sent*\n\nCheck your messages for the daily reminder format!`,
              { parse_mode: "Markdown" }
            );
          }
        } else {
          throw new Error("CronService not initialized");
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("❌ Error testing reminder:", error.message);
        } else {
          console.error("❌ Error testing reminder:", error);
        }
        if (bot) {
          await bot.sendMessage(
            chatId,
            `❌ *Error*\n\nFailed to send test reminder. Please make sure your account is linked.`,
            { parse_mode: "Markdown" }
          );
        }
      }
    });

    // Clean up expired states periodically
    setInterval(() => {
      const now = new Date();
      for (const [chatId, state] of userStates.entries()) {
        if (state.expiresAt && state.expiresAt < now) {
          userStates.delete(chatId);
          console.log(`🧹 Cleaned expired state for chatId: ${chatId}`);
        }
      }
    }, 5 * 60 * 1000); // Clean every 5 minutes

    // Error handling
    bot.on("polling_error", (error: unknown) => {
      if (error instanceof Error) {
        console.log("❌ Polling error:", error.message);
      } else {
        console.log("❌ Polling error:", error);
      }
    });

    console.log("✅ Bot setup complete. Waiting for messages...");
  } else {
    console.log("❌ TELEGRAM_BOT_TOKEN not found in environment variables");
  }
} else {
  console.log(
    "⏭️ Skipping Telegram Bot initialization (build time or test environment)"
  );
}

export default bot;
