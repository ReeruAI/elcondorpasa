import * as cron from "node-cron";
import NotificationService from "./notificationService";
import UserModel from "@/db/models/UserModel";
import HistoryModel, { History, Video } from "@/db/models/HistoryModel";
import PreferenceModel from "@/db/models/PreferenceModel";
import { getYouTubeRecommendations } from "./gemini";

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
      "0 17 * * *",
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

  // Main daily reminder logic - SEPARATED CONCERNS
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

          // STEP 1: Ensure fresh recommendations (separated from message logic)
          const freshDataEnsured = await this.ensureFreshRecommendations(
            user._id.toString()
          );

          if (freshDataEnsured) {
            console.log(`✅ Fresh data ensured for user: ${user._id}`);
          } else {
            console.log(`⚠️ Could not ensure fresh data for user: ${user._id}`);
          }

          // STEP 2: Get the actual history data for messaging (separated concern)
          const userHistory = await this.getLatestUserHistory(
            user._id.toString()
          );

          if (userHistory && userHistory.length > 0) {
            // STEP 3: Send message using the retrieved history
            const success = await this.sendMultiPartMessage(
              user._id.toString(),
              today,
              userHistory
            );

            if (success) {
              successCount++;
              console.log(`✅ Successfully sent message to user: ${user._id}`);
            }
          } else {
            console.log(`⚠️ No history data available for user: ${user._id}`);

            // Send fallback message when no history is available
            await this.sendFallbackMessage(user._id.toString());
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

  // SEPARATED: Only responsible for ensuring fresh data exists
  private async ensureFreshRecommendations(userId: string): Promise<boolean> {
    try {
      console.log(
        `🔍 Checking if fresh recommendations needed for user ${userId}`
      );

      // Check if today's data exists
      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      const userHistory = await HistoryModel.getHistoryByUserId(userId, 1, 0);
      let needsNewRecommendations = true;

      if (userHistory && userHistory.length > 0) {
        const latestHistory = userHistory[0];

        if (latestHistory.createdAt) {
          const historyDate = new Date(latestHistory.createdAt);
          const historyStart = new Date(
            historyDate.getFullYear(),
            historyDate.getMonth(),
            historyDate.getDate()
          );

          if (historyStart.getTime() === todayStart.getTime()) {
            console.log(`🎯 Fresh data already exists for user ${userId}`);
            return true; // Fresh data already exists
          }
        }
      }

      // Fetch new recommendations if needed
      if (needsNewRecommendations) {
        console.log(`🔍 Fetching fresh recommendations for user ${userId}`);

        const { contentPreference, languagePreference } =
          await this.getUserPreferences(userId);

        const collectedVideos: any[] = [];
        const streamGenerator = getYouTubeRecommendations(
          userId,
          contentPreference,
          languagePreference
        );

        for await (const chunk of streamGenerator) {
          if (typeof chunk === "object" && chunk.type === "video") {
            collectedVideos.push(chunk.data);
          }
        }

        if (collectedVideos.length > 0) {
          const historyData = {
            userId,
            contentPreference,
            languagePreference,
            videos: collectedVideos,
            source: "YouTube Data API v3 + Gemini Analysis",
            timestamp: new Date(),
          };

          await HistoryModel.createHistory(historyData);
          console.log(`✅ Fresh recommendations saved for user ${userId}`);
          return true;
        } else {
          console.log(`⚠️ No recommendations found for user ${userId}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error(
        `❌ Error ensuring fresh recommendations for user ${userId}:`,
        error
      );
      return false;
    }
  }

  // SEPARATED: Only responsible for retrieving history data
  private async getLatestUserHistory(userId: string): Promise<History[]> {
    try {
      console.log(`📖 Retrieving latest history for user ${userId}`);

      const userHistory = await HistoryModel.getHistoryByUserId(userId, 1, 0);

      if (userHistory && userHistory.length > 0) {
        console.log(`✅ Found history data for user ${userId}`);
        return userHistory;
      } else {
        console.log(`⚠️ No history data found for user ${userId}`);
        return [];
      }
    } catch (error) {
      console.error(`❌ Error retrieving history for user ${userId}:`, error);
      return [];
    }
  }

  // Send fallback message when no history is available - FIXED HTML FORMAT
  private async sendFallbackMessage(userId: string): Promise<boolean> {
    try {
      const fallbackMessage = `📢 <b>Good day Reeruser!</b>

✨ Welcome to ReeruAI! ✨

Start exploring videos to get personalized recommendations! Use /recommend to begin.

🎬 Once you have some video history, I'll send you daily curated picks perfect for creating viral Shorts &amp; Reels!

👉 <a href="https://reeru.ai">Try ReeruAI Now!</a>`;

      return await NotificationService.notifyUser(
        userId,
        fallbackMessage,
        "info"
      );
    } catch (error) {
      console.error(
        `❌ Error sending fallback message to user ${userId}:`,
        error
      );
      return false;
    }
  }

  // Get user preferences dari history atau default values
  private async getUserPreferences(userId: string): Promise<{
    contentPreference: string;
    languagePreference: string;
  }> {
    try {
      const preferences = await PreferenceModel.getPreferenceByUserId(userId);

      if (preferences) {
        return {
          contentPreference: preferences.contentPreference || "technology",
          languagePreference: preferences.languagePreference || "english",
        };
      }

      // Default preferences if none are found
      return {
        contentPreference: "technology",
        languagePreference: "english",
      };
    } catch (error) {
      console.error(`❌ Error fetching preferences for user ${userId}:`, error);
      return {
        contentPreference: "technology",
        languagePreference: "english",
      };
    }
  }

  // Send multi-part message (header + video posts + footer) - FIXED HTML FORMAT
  private async sendMultiPartMessage(
    userId: string,
    today: string,
    userHistory: History[]
  ): Promise<boolean> {
    try {
      // Get user preferences and videos
      const { contentPreference, videos } = this.extractUserData(userHistory);

      console.log(
        `📝 Sending message to user ${userId} with ${videos.length} videos`
      );

      // 1. Send Header
      const headerMessage = this.createHeaderMessage(contentPreference);
      const headerSuccess = await NotificationService.notifyUser(
        userId,
        headerMessage,
        "info"
      );

      if (!headerSuccess) {
        console.error(`❌ Failed to send header to user ${userId}`);
        return false;
      }

      // Small delay between messages
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 2. Send Video Posts (if any)
      if (videos && videos.length > 0) {
        console.log(
          `📹 Sending ${videos.length} video messages to user ${userId}`
        );

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
            console.error(`❌ Failed to send video ${i + 1} to user ${userId}`);
          }

          // Small delay between video messages
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      } else {
        // Send message if no videos available
        console.log(
          `📭 No videos found for user ${userId}, sending no-videos message`
        );
        const noVideosMessage = `🎬 <b>No recent videos found</b>

Start exploring videos to get personalized recommendations! Use /recommend`;
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

      if (!footerSuccess) {
        console.error(`❌ Failed to send footer to user ${userId}`);
        return false;
      }

      console.log(`✅ Successfully sent complete message to user ${userId}`);
      return true;
    } catch (error) {
      console.error(
        `❌ Error sending multi-part message to user ${userId}:`,
        error
      );
      return false;
    }
  }

  // Extract user data from history
  private extractUserData(userHistory: History[]): {
    contentPreference: string | null;
    videos: string[];
  } {
    if (!userHistory || userHistory.length === 0) {
      console.log("⚠️ No user history provided to extractUserData");
      return { contentPreference: null, videos: [] };
    }

    const latestHistory = userHistory[0];
    const contentPreference = latestHistory.contentPreference;

    // Get 5 newest video URLs from the most recent history entry
    const videos = Array.isArray(latestHistory.videos)
      ? latestHistory.videos.slice(-5).map((video) => video.videoUrl)
      : [];

    console.log(
      `📊 Extracted data: preference=${contentPreference}, videos=${videos.length}`
    );

    return { contentPreference, videos };
  }

  // Create header message - FIXED HTML FORMAT
  private createHeaderMessage(contentPreference: string | null): string {
    let message = "📢 <b>Good day Reeruser!</b>\n\n";

    if (contentPreference) {
      // Format content preference for display
      const formattedPreference =
        this.formatContentPreference(contentPreference);
      message += `✨ Based on your interest in <b>${formattedPreference}</b>, we've got today's top picks for you! ✨\n\n`;
    } else {
      message += "✨ We've got today's top video picks for you! ✨\n\n";
    }

    message +=
      "Turn them into viral Shorts &amp; Reels effortlessly with <b>ReeruAI</b> – as easy as 1‑2‑3! 🚀";

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
      game: "Games &amp; Esports",
      esports: "Games &amp; Esports",
      sports: "Sports",
      fitness: "Fitness &amp; Health",
      cooking: "Cooking &amp; Food",
      travel: "Travel &amp; Adventure",
      fashion: "Fashion &amp; Style",
      comedy: "Comedy",
      news: "News &amp; Current Affairs",
    };

    return preferenceMap[preference.toLowerCase()] || preference;
  }

  // Create video message - FIXED HTML FORMAT
  private createVideoMessage(index: number, videoUrl: string): string {
    // HTML format - no need to escape URLs, but escape HTML entities if needed
    const safeVideoUrl = videoUrl
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return `🎬 <b>Video ${index}:</b>\n${safeVideoUrl}\n\nTap below to instantly create an engaging Short/Reel with auto-captions! ⬇️`;
  }

  // Create footer message - FIXED HTML FORMAT
  private createFooterMessage(): string {
    return `✨ <b>Why ReeruAI?</b>

Create viral Shorts/Reels with automatic captions in just 3 simple steps:

1️⃣ Pick your video
2️⃣ Let AI find the best viral moments
3️⃣ Get ready-to-post Shorts/Reels

No hassle. No editing headaches. Just pure content magic! ✨

👉 <a href="https://reeru.ai">Try ReeruAI Now!</a>`;
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
