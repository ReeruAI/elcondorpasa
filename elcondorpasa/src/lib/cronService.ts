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

          // Send multi-part personalized message
          const success = await this.sendMultiPartMessage(
            user._id.toString(),
            today,
            userHistory
          );

          if (success) {
            successCount++;
          }

          // Delay 1000ms untuk avoid rate limiting (increased from 200ms for multiple messages)
          await new Promise((resolve) => setTimeout(resolve, 1000));
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

  // Send multi-part message (header + video posts + footer)
  private async sendMultiPartMessage(
    userId: string,
    today: string,
    userHistory: History[]
  ): Promise<boolean> {
    try {
      // Get user preferences and videos
      const { contentPreference, videos } = this.extractUserData(userHistory);

      // 1. Send Header
      const headerMessage = this.createHeaderMessage(contentPreference);
      const headerSuccess = await NotificationService.notifyUser(
        userId,
        headerMessage,
        "info"
      );

      if (!headerSuccess) return false;

      // Small delay between messages
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 2. Send Video Posts (if any)
      if (videos && videos.length > 0) {
        for (let i = 0; i < videos.length; i++) {
          const videoMessage = this.createVideoMessage(i + 1, videos[i]);

          // Send video message with button
          const videoSuccess = await NotificationService.notifyUserWithButton(
            userId,
            videoMessage,
            "info",
            {
              text: "🚀 Generate Short/Reel",
              callback_data: `/generateVideo ${videos[i]}`,
            }
          );

          if (!videoSuccess) {
            console.error(`Failed to send video ${i + 1} to user ${userId}`);
          }

          // Small delay between video messages
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      } else {
        // Send message if no videos available
        const noVideosMessage =
          "🎬 *No recent videos found*\n\nStart exploring videos to get personalized recommendations! Use /recommend";
        await NotificationService.notifyUser(userId, noVideosMessage, "info");
      }

      // Small delay before footer
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 3. Send Footer
      const footerMessage = this.createFooterMessage();
      const footerSuccess = await NotificationService.notifyUser(
        userId,
        footerMessage,
        "info"
      );

      return footerSuccess;
    } catch (error) {
      console.error("Error sending multi-part message:", error);
      return false;
    }
  }

  // Extract user data from history
  private extractUserData(userHistory: History[]): {
    contentPreference: string | null;
    videos: string[];
  } {
    if (!userHistory || userHistory.length === 0) {
      return { contentPreference: null, videos: [] };
    }

    const latestHistory = userHistory[0];
    const contentPreference = latestHistory.contentPreference;

    // Get 5 newest video URLs from the most recent history entry
    const videos = latestHistory.videos
      .slice(-5) // Get last 5 videos from the array
      .map((video) => video.videoUrl);

    return { contentPreference, videos };
  }

  // Create header message
  private createHeaderMessage(contentPreference: string | null): string {
    let message = "📢 *Good day Reeruser!*\n\n";

    if (contentPreference) {
      // Format content preference for display
      const formattedPreference =
        this.formatContentPreference(contentPreference);
      message += `✨ Based on your interest in *${formattedPreference}*, we've got today's top picks for you! ✨\n\n`;
    } else {
      message += "✨ We've got today's top video picks for you! ✨\n\n";
    }

    message +=
      "Turn them into viral Shorts & Reels effortlessly with *ReeruAI* – as easy as 1‑2‑3! 🚀";

    return message;
  }

  // Format content preference for display
  private formatContentPreference(preference: string): string {
    const preferenceMap: Record<string, string> = {
      technology: "Technology",
      education: "Education",
      entertainment: "Entertainment",
      music: "Music",
      gaming: "Gaming",
      game: "Games & Esports",
      esports: "Games & Esports",
      sports: "Sports",
      fitness: "Fitness & Health",
      cooking: "Cooking & Food",
      travel: "Travel & Adventure",
      fashion: "Fashion & Style",
      comedy: "Comedy",
      news: "News & Current Affairs",
    };

    return preferenceMap[preference.toLowerCase()] || preference;
  }

  // Create video message
  private createVideoMessage(index: number, videoUrl: string): string {
    return `🎬 *Video ${index}:*\n${videoUrl}\n\nTap below to instantly create an engaging Short/Reel with auto-captions! ⬇️`;
  }

  // Create footer message
  private createFooterMessage(): string {
    return `✨ *Why ReeruAI?*

Create viral Shorts/Reels with automatic captions in just 3 simple steps:

1️⃣ Pick your video
2️⃣ Let AI find the best viral moments
3️⃣ Get ready-to-post Shorts/Reels

No hassle. No editing headaches. Just pure content magic! ✨

👉 [Try ReeruAI Now!](https://reeru.ai)`;
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
