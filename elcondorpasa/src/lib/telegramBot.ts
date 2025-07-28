// telegramBot.ts
// This file should only be imported in Node.js runtime
import TelegramBot from "node-telegram-bot-api";
import CronService from "@/lib/cronService";
import axios from "axios";

const token = process.env.TELEGRAM_BOT_TOKEN as string;
const bot = new TelegramBot(token, { polling: true });

console.log("🤖 Telegram Bot started successfully");

// Initialize cron jobs
console.log("🔧 Initializing CronService in telegramBot.ts");
const cronService = CronService.getInstance();

// Helper function to process video with Klap API
const processVideoWithKlap = async (
  videoUrl: string,
  chatId: number,
  userId: number
) => {
  // Update the API_URL to point to the correct endpoint
  const API_URL = `${
    process.env.API_BASE_URL || "http://localhost:3000"
  }/api/klap`;
  let messageId: number | undefined;
  let lastProgress = 0;

  try {
    // Update the fetch call to use the new API_URL
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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

      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            const data = JSON.parse(jsonStr);
            console.log("📊 Klap API Update:", data.status, data.message);

            // Update progress message based on status
            if (data.progress !== undefined && data.progress !== lastProgress) {
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
                `⏱️ *Duration:* ${Math.round(short.duration)}s\n\n` +
                `💡 *Analysis:*\n_${short.description}_\n\n` +
                `📝 *Caption suggestion:*\n${
                  short.captions || "No caption generated"
                }\n\n` +
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
                  await bot.sendVideo(chatId, short.download_url, {
                    caption: `🎬 *${short.title}*\n\n${short.captions || ""}`,
                    parse_mode: "Markdown",
                  });
                } catch (videoError) {
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
              const errorMessage =
                `❌ *Processing Failed*\n\n` +
                `Error: ${data.message}\n` +
                `${data.error ? `\nDetails: ${data.error}` : ""}`;

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
};

// Helper function untuk link account dengan proper error handling
const linkAccount = async (
  email: string,
  chatId: number,
  telegramName: string,
  telegramUsername?: string
) => {
  const payload = {
    email: email.trim(),
    chatId: parseInt(chatId.toString()),
    telegramName: telegramName,
    telegramUsername: telegramUsername || null,
  };

  console.log("📤 Sending payload to API:", payload);

  try {
    const API_URL = process.env.API_BASE_URL || "http://localhost:3000";
    const response = await axios.post(
      `${API_URL}/api/telegram/link-by-email`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 15000, // 15 second timeout
        validateStatus: (status: number) => status < 500, // Don't throw on 4xx errors
      }
    );

    console.log("📨 API Response:", response.status, response.data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      // Server responded with error status
      console.error(
        "❌ API Error Response:",
        error.response.status,
        error.response.data
      );
      throw new Error(error.response.data?.message || "Server error");
    } else if (error.request) {
      // Request was made but no response
      console.error("❌ No response from API:", error.message);
      throw new Error("Tidak dapat terhubung ke server");
    } else {
      // Something else happened
      console.error("❌ Request setup error:", error.message);
      throw new Error("Gagal mengirim request");
    }
  }
};

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
      // Answer callback query immediately to remove loading state
      await bot.answerCallbackQuery(query.id, {
        text: "🎬 Processing your video...",
        show_alert: false,
      });

      // Send processing message
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

      // TODO: Add actual video processing logic here
      // For now, we'll just simulate the process

      // You can call your API endpoint here to process the video
      // Example:
      // const API_URL = process.env.API_BASE_URL || "http://localhost:3000";
      // const result = await axios.post(`${API_URL}/api/video/generate`, {
      //   videoUrl,
      //   userId,
      //   chatId
      // });
      await processVideoWithKlap(videoUrl, chatId, userId);

      // For testing, send a success message after 2 seconds
      setTimeout(async () => {
        await bot.sendMessage(
          chatId,
          `✅ *Video Ready!*\n\n` +
            `Your Short/Reel has been generated successfully!\n\n` +
            `🎬 Original: ${videoUrl}\n` +
            `📱 View your Short/Reel in the ReeruAI dashboard`,
          { parse_mode: "Markdown" }
        );
      }, 2000);
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

// Handle incoming messages
bot.on("message", async (msg: any) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const name = msg.from.first_name;
  const username = msg.from.username;

  console.log(`📩 Message from ${name} (${chatId}): ${text}`);

  // Skip jika pesan adalah command
  if (text && text.startsWith("/")) {
    return;
  }

  // Cek apakah pesan adalah email (basic email validation)
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (text && emailPattern.test(text.trim())) {
    console.log(`🔗 Attempting to link email: ${text.trim()}`);

    try {
      const result = await linkAccount(text.trim(), chatId, name, username);

      if (result.success) {
        await bot.sendMessage(
          chatId,
          `✅ *Berhasil terhubung!*\n\n` +
            `Halo ${name}! Akun Telegram Anda telah berhasil dihubungkan dengan:\n\n` +
            `👤 *Nama:* ${result.user.name}\n` +
            `📧 *Email:* ${result.user.email}\n\n` +
            `Sekarang Anda akan menerima notifikasi dari Reeru Bot. 🔔`,
          { parse_mode: "Markdown" }
        );

        console.log(`✅ Successfully linked: ${result.user.name} (${chatId})`);
      } else {
        // Handle API success: false response
        await bot.sendMessage(
          chatId,
          `❌ *Gagal menghubungkan akun*\n\n${result.message}`,
          { parse_mode: "Markdown" }
        );
      }
    } catch (error: any) {
      console.log("❌ Link process error:", error.message);

      let errorMessage = "❌ *Gagal menghubungkan akun*\n\n";

      if (error.message.includes("tidak ditemukan")) {
        errorMessage +=
          "Email tidak ditemukan di sistem Reeru. Pastikan email sudah terdaftar.";
      } else if (error.message.includes("sudah terhubung")) {
        errorMessage += "Akun Telegram ini sudah terhubung dengan user lain.";
      } else if (error.message.includes("server")) {
        errorMessage +=
          "Terjadi masalah dengan server. Silakan coba lagi dalam beberapa saat.";
      } else {
        errorMessage += `${error.message}\n\nSilakan coba lagi atau hubungi support.`;
      }

      await bot.sendMessage(chatId, errorMessage, {
        parse_mode: "Markdown",
      });
    }
  } else {
    // Instruksi untuk user jika bukan email yang valid
    await bot.sendMessage(
      chatId,
      `👋 Halo ${name}! Selamat datang di *Reeru Bot*\n\n` +
        `🤖 Untuk menghubungkan akun Reeru dengan Telegram, kirim email yang terdaftar di Reeru.\n\n` +
        `📧 Contoh: *user@example.com*\n\n` +
        `⚠️ Pastikan format email benar dan sudah terdaftar di sistem Reeru.\n\n` +
        `Setelah terhubung, Anda akan menerima notifikasi penting dari Reeru.`,
      { parse_mode: "Markdown" }
    );
  }
});

// Handle /start command
bot.onText(/\/start/, async (msg: any) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name;

  await bot.sendMessage(
    chatId,
    `🎉 Selamat datang di *Reeru Bot*, ${name}!\n\n` +
      `Untuk menghubungkan akun Anda:\n` +
      `1️⃣ Kirim email yang terdaftar di Reeru\n` +
      `2️⃣ Akun akan terhubung otomatis\n` +
      `3️⃣ Mulai terima notifikasi\n\n` +
      `📧 Contoh: user@example.com\n\n` +
      `⚡ Pastikan email yang dikirim sudah terdaftar di sistem Reeru!`,
    { parse_mode: "Markdown" }
  );
});

// Handle /help command
bot.onText(/\/help/, async (msg: any) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(
    chatId,
    `❓ *Bantuan Reeru Bot*\n\n` +
      `*Perintah yang tersedia:*\n` +
      `• /start - Mulai menggunakan bot\n` +
      `• /help - Tampilkan bantuan ini\n\n` +
      `*Cara menghubungkan akun:*\n` +
      `1. Kirim email Reeru Anda ke chat ini\n` +
      `2. Bot akan menghubungkan otomatis\n` +
      `3. Anda akan menerima konfirmasi\n\n` +
      `*Contoh email:* user@example.com\n\n` +
      `*Catatan:* Email harus sudah terdaftar di sistem Reeru.`,
    { parse_mode: "Markdown" }
  );
});

// Handle /status command
bot.onText(/\/status/, async (msg: any) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name;

  await bot.sendMessage(
    chatId,
    `📊 *Status Koneksi*\n\n` +
      `👤 Nama: ${name}\n` +
      `🆔 Chat ID: ${chatId}\n\n` +
      `Untuk mengecek apakah akun sudah terhubung, coba kirim email Anda. ` +
      `Jika sudah terhubung, bot akan memberitahu bahwa akun sudah terhubung.`,
    { parse_mode: "Markdown" }
  );
});

// Handle /testReminder command (for testing daily reminder)
bot.onText(/\/testReminder/, async (msg: any) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  console.log(`🧪 Test reminder requested by ${userId}`);

  try {
    // Test the daily reminder for this specific user
    await cronService.testDailyReminder();

    await bot.sendMessage(
      chatId,
      `✅ *Test Reminder Sent*\n\nCheck your messages for the daily reminder format!`,
      { parse_mode: "Markdown" }
    );
  } catch (error: any) {
    console.error("❌ Error testing reminder:", error);

    await bot.sendMessage(
      chatId,
      `❌ *Error*\n\nFailed to send test reminder. Please make sure your account is linked.`,
      { parse_mode: "Markdown" }
    );
  }
});

// Error handling untuk polling
bot.on("polling_error", (error: any) => {
  console.log("❌ Polling error:", error.code, error.message);
});

console.log("✅ Bot setup complete. Waiting for messages...");

export default bot;
