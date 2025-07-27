import * as cron from "node-cron";
import NotificationService from "./notificationService";
import UserModel from "@/db/models/UserModel";
import HistoryModel, { History, Video } from "@/db/models/HistoryModel";

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

      // Get semua user yang connect Telegram
      const telegramUsers = await UserModel.getAllTelegramUsers();

      if (telegramUsers.length === 0) {
        return;
      }

      // Kirim ke semua user dengan delay
      let successCount = 0;
      for (const user of telegramUsers) {
        try {
          // Get user's history data
          const userHistory = await HistoryModel.getHistoryByUserId(
            user._id.toString(),
            5, // Get last 5 history entries
            0
          );

          // Create personalized message based on history
          let message = this.createPersonalizedMessage(today, userHistory);

          const success = await NotificationService.notifyUser(
            user._id.toString(),
            message,
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

  // Create personalized message based on user history
  private createPersonalizedMessage(
    today: string,
    userHistory: History[]
  ): string {
    // Default messages
    const defaultMessages = [
      `🌅 *Selamat pagi!*\n\nHari ini adalah ${today}\n\nSemangat untuk hari yang produktif! 💪`,
      `☀️ *Good Morning!*\n\n${today}\n\nWaktunya memulai hari dengan penuh semangat! 🚀`,
      `🌄 *Morning Motivation*\n\n${today}\n\nSetiap hari adalah kesempatan baru untuk berkembang! ✨`,
      `🌞 *Pagi yang Cerah*\n\n${today}\n\nMari mulai hari ini dengan hal-hal positif! 🌟`,
    ];

    // If no history, return random default message
    if (!userHistory || userHistory.length === 0) {
      return defaultMessages[
        Math.floor(Math.random() * defaultMessages.length)
      ];
    }

    // Get user's preferences from latest history
    const latestHistory = userHistory[0];
    const contentPreference = latestHistory.contentPreference;
    const languagePreference = latestHistory.languagePreference;

    // Get 5 newest video URLs from the most recent history entry
    const recentVideoUrls = latestHistory.videos
      .slice(-5) // Get last 5 videos from the array
      .map((video) => video.videoUrl);

    // Create personalized message based on preferences
    let personalizedMessage = `🌅 *Selamat pagi!*\n\n${today}\n\n`;

    // Add content preference specific message
    if (contentPreference) {
      personalizedMessage += `✨ Berdasarkan minat Anda pada *${contentPreference}*, `;

      switch (contentPreference.toLowerCase()) {
        case "technology":
          personalizedMessage +=
            "semoga hari ini penuh dengan inovasi dan pembelajaran baru! 💻\n\n";
          break;
        case "education":
          personalizedMessage +=
            "mari tingkatkan pengetahuan kita hari ini! 📚\n\n";
          break;
        case "entertainment":
          personalizedMessage +=
            "jangan lupa untuk bersantai dan menikmati hiburan favorit Anda! 🎬\n\n";
          break;
        case "music":
          personalizedMessage +=
            "semoga musik membuat hari Anda lebih bersemangat! 🎵\n\n";
          break;
        default:
          personalizedMessage += "semoga hari Anda menyenangkan! 🌟\n\n";
      }
    }

    // Add YouTube URLs for ReeruAI shorts generation
    if (recentVideoUrls.length > 0) {
      personalizedMessage += `🎬 *Here are some videos you can generate into shorts with ReeruAI for today:*\n\n`;
      recentVideoUrls.forEach((url, index) => {
        personalizedMessage += `${index + 1}. ${url}\n`;
      });
      personalizedMessage +=
        "\n_Generate amazing shorts with these videos! 🚀_";
    } else {
      personalizedMessage +=
        "_Start exploring videos to get personalized recommendations! Use /recommend_";
    }

    return personalizedMessage;
  }

  // Get user statistics for more personalization
  private async getUserStats(userId: string) {
    try {
      const totalHistory = await HistoryModel.countUserHistory(userId);

      // Get history from last 7 days
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const weeklyHistory = await HistoryModel.getHistoryByDateRange(
        userId,
        lastWeek,
        new Date()
      );

      return {
        totalSearches: totalHistory,
        weeklySearches: weeklyHistory.length,
        favoriteContent: this.getMostFrequentPreference(
          weeklyHistory,
          "contentPreference"
        ),
        favoriteLanguage: this.getMostFrequentPreference(
          weeklyHistory,
          "languagePreference"
        ),
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      return null;
    }
  }

  // Helper to find most frequent preference
  private getMostFrequentPreference(
    history: History[],
    field: keyof History
  ): string | null {
    if (!history || history.length === 0) return null;

    const counts = history.reduce((acc, item) => {
      const value = item[field] as string;
      if (value && typeof value === "string") {
        acc[value] = (acc[value] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : null;
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
