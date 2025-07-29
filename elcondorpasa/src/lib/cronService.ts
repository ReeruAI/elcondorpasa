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
      "* 10 * * *", // Run every minute for testing (change to "0 9 * * *" for production)
      async () => {
        await this.sendDailyReminder();
      },
      {
        timezone: "Asia/Jakarta",
      }
    );

    this.jobs.set("dailyReminder", job);
  }

  // Manual trigger untuk testing
  async testDailyReminder() {
    console.log("🧪 Testing daily reminder...");
    await this.sendDailyReminder();
  }

  // Logic untuk daily reminder dengan auto hit gemini API
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
        console.log("📭 No Telegram users found");
        return;
      }

      console.log(`📡 Processing ${telegramUsers.length} Telegram users...`);

      // Process setiap user dengan delay
      let successCount = 0;
      for (const user of telegramUsers) {
        try {
          console.log(`🔄 Processing user: ${user._id}`);

          // Hit Gemini API untuk mendapatkan fresh recommendations
          const userHistory = await this.ensureFreshRecommendations(
            user._id.toString()
          );

          if (userHistory && userHistory.length > 0) {
            // Send multi-part personalized message
            const success = await this.sendMultiPartMessage(
              user._id.toString(),
              today,
              userHistory
            );

            if (success) {
              successCount++;
              console.log(`✅ Successfully sent to user: ${user._id}`);
            }
          } else {
            console.log(
              `⚠️ No recommendations available for user: ${user._id}`
            );
          }

          // Delay untuk avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`❌ Error processing user ${user._id}:`, error);
        }
      }

      console.log(
        `🎯 Daily reminder completed: ${successCount}/${telegramUsers.length} successful`
      );
    } catch (error) {
      console.error("❌ Daily reminder error:", error);
    }
  }

  // Logic untuk ensure fresh recommendations dari Gemini API
  private async ensureFreshRecommendations(userId: string): Promise<History[]> {
    try {
      // 1. Ambil user history terbaru
      const userHistory = await HistoryModel.getHistoryByUserId(userId, 1, 0);

      // 2. Check apakah sudah ada data hari ini
      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      let needsNewRecommendations = true;

      if (userHistory && userHistory.length > 0) {
        const latestHistory = userHistory[0];

        // Check if createdAt exists and is valid
        if (latestHistory.createdAt) {
          const historyDate = new Date(latestHistory.createdAt);
          const historyStart = new Date(
            historyDate.getFullYear(),
            historyDate.getMonth(),
            historyDate.getDate()
          );

          // Jika data sudah dari hari ini, tidak perlu hit API lagi
          if (historyStart.getTime() === todayStart.getTime()) {
            console.log(
              `🎯 Fresh data found for user ${userId}, skipping API call`
            );
            needsNewRecommendations = false;
          }
        }
      }

      // 3. Jika perlu recommendations baru, hit Gemini API
      if (needsNewRecommendations) {
        console.log(`🔍 Fetching fresh recommendations for user ${userId}`);

        // Get user's preferences dari history terakhir atau default
        const { contentPreference, languagePreference } =
          this.getUserPreferences(userHistory);

        // Hit Gemini API
        const success = await this.hitGeminiAPI(
          userId,
          contentPreference,
          languagePreference
        );

        if (success) {
          // Ambil data terbaru setelah hit API
          const freshHistory = await HistoryModel.getHistoryByUserId(
            userId,
            1,
            0
          );
          console.log(`✅ Fresh recommendations obtained for user ${userId}`);
          return freshHistory || [];
        } else {
          console.log(
            `⚠️ Failed to get fresh recommendations for user ${userId}`
          );
          return userHistory || [];
        }
      }

      return userHistory || [];
    } catch (error) {
      console.error(
        `❌ Error ensuring fresh recommendations for user ${userId}:`,
        error
      );
      return [];
    }
  }

  // Get user preferences dari history atau default values
  private getUserPreferences(userHistory: History[]): {
    contentPreference: string;
    languagePreference: string;
  } {
    if (userHistory && userHistory.length > 0) {
      const latestHistory = userHistory[0];
      return {
        contentPreference: latestHistory.contentPreference || "technology",
        languagePreference: latestHistory.languagePreference || "english",
      };
    }

    // Default preferences jika tidak ada history
    return {
      contentPreference: "technology",
      languagePreference: "english",
    };
  }

  // Hit Gemini API untuk mendapatkan recommendations
  private async hitGeminiAPI(
    userId: string,
    contentPreference: string,
    languagePreference: string
  ): Promise<boolean> {
    try {
      console.log(`🤖 Calling Gemini API for user ${userId}...`);

      // Prepare request data
      const requestBody = {
        contentPreference,
        languagePreference,
      };

      // Hit internal API route
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        }/api/gemini/route`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-userId": userId,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        console.error(
          `❌ Gemini API call failed for user ${userId}: ${response.status} ${response.statusText}`
        );
        return false;
      }

      // Since it's a streaming response, we need to consume the stream
      const reader = response.body?.getReader();
      if (reader) {
        let completed = false;

        while (!completed) {
          const { done, value } = await reader.read();

          if (done) {
            completed = true;
            break;
          }

          // Convert Uint8Array to string
          const chunk = new TextDecoder().decode(value);

          // Check for completion marker
          if (chunk.includes("[DONE]")) {
            completed = true;
            break;
          }
        }
      }

      console.log(`✅ Gemini API call completed for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error hitting Gemini API for user ${userId}:`, error);
      return false;
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
