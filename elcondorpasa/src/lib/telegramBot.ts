import TelegramBot from "node-telegram-bot-api";
import CronService from "@/lib/cronService";
import axios from "axios";

const token = process.env.TELEGRAM_BOT_TOKEN as string;
const bot = new TelegramBot(token, { polling: true });

console.log("🤖 Telegram Bot started successfully");

// Initialize cron jobs
console.log("🔧 Initializing CronService in telegramBot.ts");
const cronService = CronService.getInstance();

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

// Error handling untuk polling
bot.on("polling_error", (error: any) => {
  console.log("❌ Polling error:", error.code, error.message);
});

console.log("✅ Bot setup complete. Waiting for messages...");

export default bot;
