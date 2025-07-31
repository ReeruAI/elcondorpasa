// telegramBot.ts
// This file should only be imported in Node.js runtime
import TelegramBot from "node-telegram-bot-api";
import axios, { AxiosError } from "axios";
import type { CallbackQuery, Message } from "node-telegram-bot-api";
import type CronServiceType from "@/lib/cronService";
import KlapModel from "@/db/models/KlapModel";

// Type definitions for SSE data
interface SSEBaseData {
  status: string;
  message: string;
  progress?: number;
  tokens_remaining?: number;
  task_id?: string;
  project_id?: string;
  error?: string;
  error_code?: string;
}

interface SSECompletedData extends SSEBaseData {
  status: "completed";
  short: {
    id: string;
    title: string;
    virality_score: number;
    duration?: number;
    transcript?: string;
    description?: string;
    captions?:
      | {
          tiktok?: string;
          youtube?: string;
          linkedin?: string;
          instagram?: string;
        }
      | string;
    export_status?: string;
    download_url?: string;
    export_id?: string;
  };
}

interface SSEErrorData extends SSEBaseData {
  status: "error";
  error_code?: string;
  error_details?: string;
}

type SSEData = SSECompletedData | SSEErrorData | SSEBaseData;

// User state types
interface UserState {
  step: "waiting_email" | "waiting_otp";
  email?: string;
  expiresAt?: Date;
}

// API Response types
interface EmailLinkingResponse {
  success: boolean;
  message?: string;
  user?: {
    name: string;
    email: string;
  };
}

interface CompleteLinkingResponse {
  success: boolean;
  message?: string;
  user?: {
    name: string;
    email: string;
  };
}

interface CheckStatusResponse {
  success: boolean;
  user?: {
    name: string;
    email: string;
  };
}

interface UnlinkResponse {
  success: boolean;
  user?: {
    name: string;
    email: string;
  };
}

// Type for database short
interface DatabaseShort {
  id: string;
  title: string;
  virality_score: number;
  description?: string;
  captions?: {
    tiktok?: string;
    youtube?: string;
    linkedin?: string;
    instagram?: string;
  };
  download_url?: string;
  created_at: string | Date;
}

// Prevent initialization during build or in non-runtime environments
const shouldInitialize =
  process.env.NEXT_RUNTIME === "nodejs" &&
  process.env.NODE_ENV !== "test" &&
  typeof window === "undefined" && // Ensure we're on server side
  !process.env.NEXT_PHASE; // Prevent during build phases

let bot: TelegramBot | null = null;
let cronService: CronServiceType | null = null;

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
    const userStates = new Map<number, UserState>();

    // Helper function to send success messages
    const sendSuccessMessages = async (
      chatId: number,
      videoUrl: string,
      short: {
        id?: string;
        title: string;
        virality_score: number;
        description?: string;
        captions?:
          | {
              tiktok?: string;
              youtube?: string;
              linkedin?: string;
              instagram?: string;
            }
          | string;
        download_url?: string;
      },
      tokensRemaining: number
    ): Promise<void> => {
      if (!bot) return;

      // Extract caption string
      let captionText = "No caption generated";
      if (typeof short.captions === "string") {
        captionText = short.captions;
      } else if (short.captions?.tiktok) {
        captionText = short.captions.tiktok;
      }

      // Send success message with video details
      const completionMessage =
        `✅ *Video Ready!*\n\n` +
        `🎬 *Title:* ${short.title}\n` +
        `🎯 *Virality Score:* ${short.virality_score}/100\n` +
        `💡 *Analysis:*\n_${
          short.description || "No analysis available"
        }_\n\n` +
        `📝 *Caption suggestion:*\n${captionText}\n\n` +
        `🪙 *Tokens remaining:* ${tokensRemaining}\n\n` +
        `🌐 *View your short:* [Open Dashboard](${
          process.env.API_BASE_URL || "http://localhost:3000"
        }/your-clip)\n` +
        `🔗 *Original:* [View on YouTube](${videoUrl})`;

      await bot.sendMessage(chatId, completionMessage, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      });

      // Send download link message
      await bot.sendMessage(
        chatId,
        `🎉 *Success!*\n\n` +
          `Your short "${short.title}" is ready!\n\n` +
          `📱 *View & Download:* [${
            process.env.API_BASE_URL || "http://localhost:3000"
          }/your-clip](${
            process.env.API_BASE_URL || "http://localhost:3000"
          }/your-clip)\n\n` +
          `💾 *Direct download:* ${short.download_url || "Not available"}`,
        {
          parse_mode: "Markdown",
          disable_web_page_preview: false,
        }
      );
    };

    // Helper function to process video with Klap API
    const processVideoWithKlap = async (
      videoUrl: string,
      chatId: number,
      userId: string
    ): Promise<void> => {
      const API_URL = `${
        process.env.API_BASE_URL || "http://localhost:3000"
      }/api/klap`;

      // Store the start time to identify the video later
      const processingStartTime = Date.now();

      try {
        // Send initial processing message
        console.log(
          `🔄 Processing video for chatId: ${chatId}, userId: ${userId}`
        );
        if (bot) {
          await bot.sendMessage(
            chatId,
            `🎬 *Generating Short/Reel*\n\n` +
              `Processing video:\n${videoUrl}\n\n` +
              `⏳ This may take a moment. We'll notify you when it's ready!`,
            {
              parse_mode: "Markdown",
            }
          );
        }

        // Make request to backend - handle SSE response
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

        // Read the SSE stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response body");
        }

        let lastData: SSEData | null = null;
        let buffer = "";

        try {
          // Read the entire stream
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE messages
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6)) as SSEData;
                  lastData = data; // Keep track of the last data

                  // Log progress for debugging
                  if (data.status) {
                    console.log(
                      `📊 Status: ${data.status}, Progress: ${
                        data.progress || "N/A"
                      }`
                    );
                  }
                } catch (e) {
                  // Ignore parse errors
                  console.log("❌ Error parsing SSE data:", e);
                }
              }
            }
          }
        } catch (streamError) {
          console.log("⚠️ Stream interrupted:", streamError);
          // Don't throw here, continue to check if we have data or can check database
        }

        // Type guard for completed status
        const isCompletedData = (
          data: SSEData | null
        ): data is SSECompletedData => {
          return (
            data !== null && data.status === "completed" && "short" in data
          );
        };

        // Type guard for error status
        const isErrorData = (data: SSEData | null): data is SSEErrorData => {
          return data !== null && data.status === "error";
        };

        // Check the final result from SSE
        if (isCompletedData(lastData)) {
          // Normal success case - we got the complete data from SSE
          await sendSuccessMessages(
            chatId,
            videoUrl,
            lastData.short,
            lastData.tokens_remaining || 0
          );
        } else if (isErrorData(lastData)) {
          // Handle error cases
          let errorMessage = `❌ *Processing Failed*\n\n`;

          if (lastData.message) {
            errorMessage += `Error: ${lastData.message}\n`;
          } else {
            errorMessage += `Failed to process your video.\n`;
          }

          // Handle specific error codes
          if (lastData.error_code === "insufficient_tokens") {
            errorMessage = `❌ *Insufficient Tokens*\n\nYou don't have enough tokens to process this video. Please purchase more tokens to continue.`;
          } else if (lastData.error_code === "video_too_long") {
            errorMessage = `❌ *Video Too Long*\n\nThe video is too long for processing. Please use a shorter video (recommended: under 10 minutes).`;
          } else if (lastData.error_code === "invalid_url") {
            errorMessage = `❌ *Invalid URL*\n\nPlease make sure the YouTube video is public and accessible.`;
          }

          errorMessage += `\n\nPlease try again later or contact support.`;

          if (bot) {
            await bot.sendMessage(chatId, errorMessage, {
              parse_mode: "Markdown",
            });
          }
        } else {
          // Connection was interrupted or no clear status
          console.log(
            "🔍 Connection interrupted, checking database for completed video..."
          );

          // Wait a bit for the background process to complete
          await new Promise((resolve) => setTimeout(resolve, 5000));

          // Check database for recently added video
          try {
            const allShorts = (await KlapModel.getUserShorts(
              userId
            )) as DatabaseShort[];
            // Sort by created_at and take only the most recent one
            const sortedShorts = allShorts.sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            );

            // Check if the most recent short was created after we started processing
            const newShort =
              sortedShorts.length > 0 &&
              new Date(sortedShorts[0].created_at).getTime() >=
                processingStartTime
                ? sortedShorts[0]
                : null;

            if (newShort) {
              console.log(
                "✅ Found completed video in database:",
                newShort.title
              );

              // Get current token count
              const currentTokens = await KlapModel.getUserTokenCount(userId);

              // Send success messages with data from database
              await sendSuccessMessages(
                chatId,
                videoUrl,
                {
                  id: newShort.id,
                  title: newShort.title,
                  virality_score: newShort.virality_score,
                  description: newShort.description,
                  captions: newShort.captions,
                  download_url: newShort.download_url,
                },
                currentTokens
              );
            } else {
              // No video found in database, wait more and check again
              console.log("⏳ Video not found yet, waiting 15 seconds more...");
              await new Promise((resolve) => setTimeout(resolve, 15000));

              // Check one more time
              const allShortsSecond = (await KlapModel.getUserShorts(
                userId
              )) as DatabaseShort[];
              const sortedShortsSecond = allShortsSecond.sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              );

              const foundShort =
                sortedShortsSecond.length > 0 &&
                new Date(sortedShortsSecond[0].created_at).getTime() >=
                  processingStartTime
                  ? sortedShortsSecond[0]
                  : null;

              if (foundShort) {
                console.log(
                  "✅ Found completed video in database (second check):",
                  foundShort.title
                );
                const currentTokens = await KlapModel.getUserTokenCount(userId);

                await sendSuccessMessages(
                  chatId,
                  videoUrl,
                  {
                    id: foundShort.id,
                    title: foundShort.title,
                    virality_score: foundShort.virality_score,
                    description: foundShort.description,
                    captions: foundShort.captions,
                    download_url: foundShort.download_url,
                  },
                  currentTokens
                );
              } else {
                // Still no video, send a helpful message
                if (bot) {
                  await bot.sendMessage(
                    chatId,
                    `⏳ *Still Processing*\n\n` +
                      `Your video is taking a bit longer than expected.\n\n` +
                      `Don't worry! Processing continues in the background.\n\n` +
                      `Please check your dashboard in a few minutes:\n` +
                      `🌐 [Open Dashboard](${
                        process.env.API_BASE_URL || "http://localhost:3000"
                      }/your-clip)\n\n` +
                      `Or use /checkVideo to check if it's ready.`,
                    {
                      parse_mode: "Markdown",
                      disable_web_page_preview: false,
                    }
                  );
                }
              }
            }
          } catch (dbError) {
            console.error("❌ Error checking database:", dbError);
            // Fall back to generic message
            if (bot) {
              await bot.sendMessage(
                chatId,
                `⚠️ *Connection Interrupted*\n\n` +
                  `The connection was interrupted, but your video may still be processing.\n\n` +
                  `Please check your dashboard in a few minutes:\n` +
                  `🌐 [Open Dashboard](${
                    process.env.API_BASE_URL || "http://localhost:3000"
                  }/your-clip)`,
                {
                  parse_mode: "Markdown",
                  disable_web_page_preview: false,
                }
              );
            }
          }
        }
      } catch (error: unknown) {
        console.error("❌ Error processing video:", error);

        let errorMessage = `❌ *Error*\n\nFailed to process your video.\n`;

        if (error instanceof Error) {
          // Check for fetch/network errors
          if (error.message.includes("fetch")) {
            errorMessage += `Connection error. Please check your internet connection.\n`;
          } else {
            errorMessage += `Error: ${error.message}\n`;
          }
        }

        errorMessage += `\nPlease try again later or contact support.`;

        if (bot) {
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
      const userId = query.from.id;
      const userName = query.from.first_name;

      console.log(`🔘 Callback query from ${userName} (${userId}): ${data}`);

      if (data.startsWith("/generateVideo ")) {
        const videoUrl = data.replace("/generateVideo ", "");

        try {
          if (bot) {
            // Answer the callback query to remove the loading state on the button
            await bot.answerCallbackQuery(query.id, {
              text: "🎬 Processing your video...",
              show_alert: false,
            });

            // Don't send a message here - let processVideoWithKlap handle all messaging
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

      const currentState = userStates.get(chatId) || {
        step: "waiting_email" as const,
      };

      // Handle 6-digit OTP code
      const otpPattern = /^\d{6}$/;
      if (text && otpPattern.test(text.trim())) {
        console.log(`🔐 OTP received: ${text.trim()}`);

        if (currentState.step === "waiting_otp" && currentState.email) {
          // Complete email linking with OTP
          try {
            const API_URL = process.env.API_BASE_URL || "http://localhost:3000";
            const response = await axios.post<CompleteLinkingResponse>(
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

            if (response.data.success && response.data.user) {
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
                  `❌ *Verification Failed*\n\n${
                    response.data.message || "Unknown error"
                  }\n\n` +
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

            // Type-safe error handling
            if (axios.isAxiosError(error)) {
              const axiosError = error as AxiosError<{ message?: string }>;
              if (axiosError.response?.data?.message) {
                if (axiosError.response.data.message.includes("Invalid OTP")) {
                  errorMessage +=
                    "❌ *Invalid or Expired OTP*\n\n" +
                    "The OTP code is either invalid, expired, or already used.\n\n" +
                    "💡 *Solution:*\n" +
                    "1. Go to your Reeru dashboard\n" +
                    "2. Generate a new OTP code\n" +
                    "3. Send the new code here";
                } else if (
                  axiosError.response.data.message.includes(
                    "verification session expired"
                  )
                ) {
                  errorMessage +=
                    "⏰ *Session Expired*\n\n" +
                    "Your verification session has expired.\n\n" +
                    "💡 *Solution:* Send your email address again to restart.";
                  userStates.delete(chatId);
                } else {
                  errorMessage += axiosError.response.data.message;
                }
              } else {
                errorMessage += "Unable to verify OTP. Please try again.";
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
          const response = await axios.post<EmailLinkingResponse>(
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

          if (response.data.success && response.data.user) {
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
                `❌ *Email Verification Failed*\n\n${
                  response.data.message || "Unknown error"
                }`,
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

          if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<{
              message?: string;
              errorCode?: string;
            }>;
            const errorCode = axiosError.response?.data?.errorCode;

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
                  axiosError.response?.data?.message ||
                  (error instanceof Error ? error.message : "Unknown error")
                }\n\n💡 Please try again or contact support.`;
            }
          } else {
            errorMessage += `${
              error instanceof Error ? error.message : "Unknown error"
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
            `• /checkVideo - Check for recent videos\n` +
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
        const response = await axios.post<CheckStatusResponse>(
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

    // New command to check for recent videos
    bot.onText(/\/checkVideo/, async (msg: Message) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;

      if (!userId) {
        if (bot) {
          await bot.sendMessage(
            chatId,
            `❌ Unable to identify user. Please try again.`,
            { parse_mode: "Markdown" }
          );
        }
        return;
      }

      try {
        // First check if user is linked
        const API_URL = process.env.API_BASE_URL || "http://localhost:3000";
        const statusResponse = await axios.post<CheckStatusResponse>(
          `${API_URL}/api/telegram/check-status`,
          { chatId: chatId },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 5000,
          }
        );

        if (!statusResponse.data.success || !statusResponse.data.user) {
          if (bot) {
            await bot.sendMessage(
              chatId,
              `❌ *Not Connected*\n\n` +
                `Please connect your account first by sending your email address.`,
              { parse_mode: "Markdown" }
            );
          }
          return;
        }

        // Get userId from database
        const foundUserId = await KlapModel.getUserIdFromChatId(chatId);
        if (!foundUserId) {
          if (bot) {
            await bot.sendMessage(
              chatId,
              `❌ Unable to find your account. Please reconnect by sending your email.`,
              { parse_mode: "Markdown" }
            );
          }
          return;
        }

        // Check for recent videos
        const allUserShorts = (await KlapModel.getUserShorts(
          foundUserId
        )) as DatabaseShort[];
        // Sort by created_at and take the 3 most recent
        const recentShorts = allUserShorts
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          .slice(0, 3);

        if (recentShorts.length === 0) {
          if (bot) {
            await bot.sendMessage(
              chatId,
              `📹 *No Videos Found*\n\n` +
                `You haven't created any videos yet.\n\n` +
                `Start creating amazing content with Reeru!`,
              { parse_mode: "Markdown" }
            );
          }
          return;
        }

        // Show recent videos
        let message = `🎬 *Your Recent Videos*\n\n`;

        for (const short of recentShorts) {
          const createdAt = new Date(short.created_at);
          const minutesAgo = Math.floor(
            (Date.now() - createdAt.getTime()) / 60000
          );
          const timeAgo =
            minutesAgo < 60
              ? `${minutesAgo} minutes ago`
              : minutesAgo < 1440
              ? `${Math.floor(minutesAgo / 60)} hours ago`
              : `${Math.floor(minutesAgo / 1440)} days ago`;

          message += `📌 *${short.title}*\n`;
          message += `🎯 Score: ${short.virality_score}/100\n`;
          message += `⏰ Created: ${timeAgo}\n`;
          message += `💾 [Download](${short.download_url || "#"})\n\n`;
        }

        message += `🌐 [View all in Dashboard](${
          process.env.API_BASE_URL || "http://localhost:3000"
        }/your-clip)`;

        if (bot) {
          await bot.sendMessage(chatId, message, {
            parse_mode: "Markdown",
            disable_web_page_preview: true,
          });
        }
      } catch (error: unknown) {
        console.error("❌ Error checking videos:", error);
        if (bot) {
          await bot.sendMessage(
            chatId,
            `❌ *Error*\n\nFailed to check videos. Please try again later.`,
            { parse_mode: "Markdown" }
          );
        }
      }
    });

    bot.onText(/\/unlink/, async (msg: Message) => {
      const chatId = msg.chat.id;

      try {
        const API_URL = process.env.API_BASE_URL || "http://localhost:3000";
        const response = await axios.post<UnlinkResponse>(
          `${API_URL}/api/telegram/unlink`,
          { chatId: chatId },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 10000,
          }
        );

        if (response.data.success && response.data.user && bot) {
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

        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<{ message?: string }>;
          if (axiosError.response?.data?.message) {
            errorMessage += axiosError.response.data.message;
          } else {
            errorMessage +=
              "Unable to process unlink request. Please try again.";
          }
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
