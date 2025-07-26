import * as cron from "node-cron";
import NotificationService from "./notificationService";
import UserModel from "@/db/models/UserModel";

class CronService {
  private static instance: CronService;
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  private constructor() {
    console.log("🔧 CronService instance created");
    this.startAllJobs();
  }

  static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService();
    }
    return CronService.instance;
  }

  // Start semua cron jobs
  startAllJobs() {
    this.startDailyReminder();
  }

  // Daily reminder - setiap hari jam 9 pagi
  startDailyReminder() {
    const job = cron.schedule(
      "* 10 * * *", // Run every minute for testing
      async () => {
        await this.sendDailyReminder();
      },
      {
        timezone: "Asia/Jakarta", // Sesuaikan timezone
      }
    );

    this.jobs.set("dailyReminder", job);
  }

  // Manual trigger untuk testing
  async testDailyReminder() {
    console.log("🧪 Testing daily reminder...");
    await this.sendDailyReminder();
  }

  // Logic untuk daily reminder
  private async sendDailyReminder() {
    try {
      const today = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const messages = [
        `🌅 *Selamat pagi!*\n\nHari ini adalah ${today}\n\nSemangat untuk hari yang produktif! 💪`,
        `☀️ *Good Morning!*\n\n${today}\n\nWaktunya memulai hari dengan penuh semangat! 🚀`,
        `🌄 *Morning Motivation*\n\n${today}\n\nSetiap hari adalah kesempatan baru untuk berkembang! ✨`,
        `🌞 *Pagi yang Cerah*\n\n${today}\n\nMari mulai hari ini dengan hal-hal positif! 🌟`,
      ];

      const randomMessage =
        messages[Math.floor(Math.random() * messages.length)];

      // Get semua user yang connect Telegram
      const telegramUsers = await UserModel.getAllTelegramUsers();

      if (telegramUsers.length === 0) {
        return;
      }

      // Kirim ke semua user dengan delay
      let successCount = 0;
      for (const user of telegramUsers) {
        try {
          const success = await NotificationService.notifyUser(
            user._id.toString(),
            randomMessage,
            "info"
          );

          if (success) {
            successCount++;
          }

          // Delay 200ms untuk avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Error sending to user ${user._id}:`, error);
        }
      }

      console.log(
        `✅ Daily reminder sent: ${successCount}/${telegramUsers.length} successful`
      );
    } catch (error) {
      console.error("Daily reminder error:", error);
    }
  }

  // Custom cron job
  addCustomJob(name: string, schedule: string, callback: () => Promise<void>) {
    const job = cron.schedule(schedule, callback, {
      timezone: "Asia/Jakarta",
    });

    this.jobs.set(name, job);
    console.log(`⏰ Custom job '${name}' scheduled: ${schedule}`);
  }

  // Stop specific job
  stopJob(name: string) {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      console.log(`⏹️ Stopped job: ${name}`);
    }
  }

  // Stop semua jobs
  stopAllJobs() {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`⏹️ Stopped: ${name}`);
    });
    this.jobs.clear();
    console.log("⏹️ All cron jobs stopped");
  }

  // List active jobs
  listJobs() {
    console.log("📋 Active cron jobs:");
    this.jobs.forEach((job, name) => {
      console.log(`  - ${name}: running`);
    });
  }
}

export default CronService;
