// src/lib/notificationService.ts
import TelegramBotManager from "@/lib/telegramBotManager";
import UserModel from "@/db/models/UserModel";

class NotificationService {
  /**
   * Kirim notifikasi ke user berdasarkan User ID
   */
  static async notifyUser(
    userId: string,
    message: string,
    type: "info" | "success" | "warning" | "error" = "info"
  ): Promise<boolean> {
    try {
      // Get user dari database
      const user = await UserModel.getUserProfile(userId);

      if (!user.telegramChatId) {
        console.log(`❌ User ${userId} doesn't have Telegram connected`);
        return false;
      }

      // Format message berdasarkan type - UPDATED TO HTML FORMAT
      let formattedMessage = message;
      switch (type) {
        case "success":
          formattedMessage = `✅ ${message}`;
          break;
        case "warning":
          formattedMessage = `⚠️ ${message}`;
          break;
        case "error":
          formattedMessage = `❌ ${message}`;
          break;
        case "info":
        default:
          // Don't add ℹ️ prefix for info messages from CronService
          // as they already have their own formatting
          formattedMessage =
            message.startsWith("📢") ||
            message.startsWith("🎬") ||
            message.startsWith("✨")
              ? message
              : `ℹ️ ${message}`;
          break;
      }

      const botManager = TelegramBotManager.getInstance();
      const bot = await botManager.getBot();
      if (!bot) {
        console.log("❌ Bot not available");
        return false;
      }

      await bot.sendMessage(user.telegramChatId, formattedMessage, {
        parse_mode: "HTML", // ✅ CHANGED FROM "Markdown" TO "HTML"
      });
      console.log(`✅ Notification sent to ${user.telegramChatId}`);
      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("❌ Notification service error:", error.message);
      } else {
        console.log("❌ Notification service error:", error);
      }
      return false;
    }
  }

  /**
   * Kirim notifikasi dengan inline keyboard button
   */
  static async notifyUserWithButton(
    userId: string,
    message: string,
    type: "info" | "success" | "warning" | "error" = "info",
    button: {
      text: string;
      callback_data?: string;
      url?: string;
    }
  ): Promise<boolean> {
    try {
      // Get user dari database
      const user = await UserModel.getUserProfile(userId);

      if (!user.telegramChatId) {
        console.log(`❌ User ${userId} doesn't have Telegram connected`);
        return false;
      }

      // Format message berdasarkan type - UPDATED TO HTML FORMAT
      let formattedMessage = message;
      switch (type) {
        case "success":
          formattedMessage = `✅ ${message}`;
          break;
        case "warning":
          formattedMessage = `⚠️ ${message}`;
          break;
        case "error":
          formattedMessage = `❌ ${message}`;
          break;
        case "info":
        default:
          // Don't add ℹ️ prefix for info messages from CronService
          formattedMessage =
            message.startsWith("📢") ||
            message.startsWith("🎬") ||
            message.startsWith("✨")
              ? message
              : `ℹ️ ${message}`;
          break;
      }

      const botManager = TelegramBotManager.getInstance();
      const bot = await botManager.getBot();
      if (!bot) {
        console.log("❌ Bot not available");
        return false;
      }

      // Create inline keyboard
      const inlineKeyboard = {
        inline_keyboard: [[button]],
      };

      await bot.sendMessage(user.telegramChatId, formattedMessage, {
        parse_mode: "HTML", // ✅ CHANGED FROM "Markdown" TO "HTML"
        reply_markup: inlineKeyboard,
      });

      console.log(`✅ Notification with button sent to ${user.telegramChatId}`);
      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("❌ Notification service error:", error.message);
      } else {
        console.log("❌ Notification service error:", error);
      }
      return false;
    }
  }

  /**
   * Kirim notifikasi dengan multiple buttons
   */
  static async notifyUserWithButtons(
    userId: string,
    message: string,
    type: "info" | "success" | "warning" | "error" = "info",
    buttons: Array<{
      text: string;
      callback_data?: string;
      url?: string;
    }>,
    buttonsPerRow: number = 1
  ): Promise<boolean> {
    try {
      // Get user dari database
      const user = await UserModel.getUserProfile(userId);

      if (!user.telegramChatId) {
        console.log(`❌ User ${userId} doesn't have Telegram connected`);
        return false;
      }

      // Format message berdasarkan type - UPDATED TO HTML FORMAT
      let formattedMessage = message;
      switch (type) {
        case "success":
          formattedMessage = `✅ ${message}`;
          break;
        case "warning":
          formattedMessage = `⚠️ ${message}`;
          break;
        case "error":
          formattedMessage = `❌ ${message}`;
          break;
        case "info":
        default:
          formattedMessage =
            message.startsWith("📢") ||
            message.startsWith("🎬") ||
            message.startsWith("✨")
              ? message
              : `ℹ️ ${message}`;
          break;
      }

      const botManager = TelegramBotManager.getInstance();
      const bot = await botManager.getBot();
      if (!bot) {
        console.log("❌ Bot not available");
        return false;
      }

      // Create inline keyboard with multiple buttons
      const inline_keyboard = [];
      for (let i = 0; i < buttons.length; i += buttonsPerRow) {
        inline_keyboard.push(buttons.slice(i, i + buttonsPerRow));
      }

      await bot.sendMessage(user.telegramChatId, formattedMessage, {
        parse_mode: "HTML", // ✅ CHANGED FROM "Markdown" TO "HTML"
        reply_markup: { inline_keyboard },
      });

      console.log(
        `✅ Notification with multiple buttons sent to ${user.telegramChatId}`
      );
      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("❌ Notification service error:", error.message);
      } else {
        console.log("❌ Notification service error:", error);
      }
      return false;
    }
  }

  /**
   * Broadcast ke semua user yang connect Telegram
   */
  static async broadcastToAll(
    message: string,
    type: "info" | "announcement" | "maintenance" = "info"
  ): Promise<{ success: number; failed: number; total: number } | false> {
    try {
      const telegramUsers = await UserModel.getAllTelegramUsers();

      // UPDATED TO HTML FORMAT
      let formattedMessage = message;
      switch (type) {
        case "announcement":
          formattedMessage = `📢 <b>Pengumuman</b>\n\n${message}`;
          break;
        case "maintenance":
          formattedMessage = `🔧 <b>Maintenance Notice</b>\n\n${message}`;
          break;
        default:
          formattedMessage = message;
      }

      const results = {
        success: 0,
        failed: 0,
        total: telegramUsers.length,
      };

      const botManager = TelegramBotManager.getInstance();

      for (const user of telegramUsers) {
        try {
          const sent = await botManager.sendNotification(
            user.telegramChatId,
            formattedMessage
          );
          if (sent) {
            results.success++;
          } else {
            results.failed++;
          }

          // Add delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          results.failed++;
          console.error(`Failed to send to user ${user._id}:`, error);
        }
      }

      console.log(
        `📊 Broadcast complete: ${results.success}/${results.total} sent`
      );
      return results;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("❌ Broadcast service error:", error.message);
      } else {
        console.log("❌ Broadcast service error:", error);
      }
      return false;
    }
  }

  /**
   * Kirim notifikasi token update
   */
  static async notifyTokenUpdate(
    userId: string,
    oldTokens: number,
    newTokens: number
  ): Promise<boolean> {
    const difference = newTokens - oldTokens;
    const icon = difference >= 0 ? "📈" : "📉";
    const action = difference >= 0 ? "bertambah" : "berkurang";

    // UPDATED TO HTML FORMAT
    const message =
      `${icon} <b>Token Update</b>\n\n` +
      `Token Reeru Anda ${action}:\n` +
      `• Sebelumnya: ${oldTokens} token\n` +
      `• Sekarang: ${newTokens} token\n` +
      `• Perubahan: ${difference >= 0 ? "+" : ""}${difference} token`;

    return await this.notifyUser(userId, message, "info");
  }

  /**
   * Kirim welcome message untuk user baru yang connect Telegram
   */
  static async sendWelcomeMessage(userId: string): Promise<boolean> {
    const user = await UserModel.getUserProfile(userId);

    // UPDATED TO HTML FORMAT
    const message =
      `🎉 <b>Selamat datang, ${user.name}!</b>\n\n` +
      `Akun Telegram Anda telah berhasil terhubung dengan Reeru.\n\n` +
      `Anda akan menerima notifikasi untuk:\n` +
      `🔔 Update penting akun\n` +
      `📊 Status token Reeru\n` +
      `🎯 Aktivitas sistem\n` +
      `📢 Pengumuman terbaru`;

    return await this.notifyUser(userId, message, "success");
  }
}

export default NotificationService;
