import { database } from "@/db/config/mongodb";
import { ObjectId } from "mongodb";

interface UserShort {
  title: string;
  virality_score: number;
  captions: {
    tiktok: string;
    youtube: string;
    linkedin: string;
    instagram: string;
  };
  download_url: string;
  description?: string;
  created_at?: Date;
}

interface UserShortsDocument {
  _id?: ObjectId;
  userid: string;
  shorts: UserShort[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserDocument {
  _id: ObjectId;
  username: string;
  name: string;
  email: string;
  password: string;
  reeruToken: number;
  isProcessingVideo?: boolean;
  telegramChatId?: number; // Added for Telegram support
}

interface UserPreference {
  userId: string;
  languagePreference?: string;
}

class KlapModel {
  private static userShortsCollection = "usershorts";
  private static usersCollection = "users";
  private static preferencesCollection = "preferences";

  // ========== Telegram Support ==========

  /**
   * Get userId from Telegram chatId
   * @param chatId - Telegram chat ID
   * @returns userId string if found, null if not found
   */
  static async getUserIdFromChatId(chatId: number): Promise<string | null> {
    try {
      console.log("🔍 Looking up userId for chatId:", chatId);

      const collection = database.collection<UserDocument>(
        this.usersCollection
      );
      const user = await collection.findOne(
        {
          telegramChatId: chatId,
        },
        { projection: { _id: 1 } }
      );

      if (!user) {
        console.log("❌ No user found for chatId:", chatId);
        return null;
      }

      const userId = user._id.toString();
      console.log("✅ Found userId:", userId, "for chatId:", chatId);
      return userId;
    } catch (error) {
      console.error("❌ Error getting userId from chatId:", error);
      throw error;
    }
  }

  // ========== User Token Management ==========

  /**
   * Get user's token count
   */
  static async getUserTokenCount(userId: string): Promise<number> {
    try {
      const collection = database.collection<UserDocument>(
        this.usersCollection
      );
      const user = await collection.findOne({ _id: new ObjectId(userId) });
      return user?.reeruToken || 0;
    } catch (error) {
      console.error("❌ Error getting user token count:", error);
      return 0;
    }
  }

  /**
   * Deduct one token from user
   */
  static async deductUserToken(userId: string): Promise<boolean> {
    try {
      const collection = database.collection<UserDocument>(
        this.usersCollection
      );

      const result = await collection.updateOne(
        { _id: new ObjectId(userId), reeruToken: { $gt: 0 } },
        { $inc: { reeruToken: -1 } }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error("❌ Error deducting user token:", error);
      return false;
    }
  }

  // ========== Processing Status Management ==========

  /**
   * Set user's video processing status
   */
  static async setUserProcessingStatus(
    userId: string,
    isProcessing: boolean
  ): Promise<boolean> {
    try {
      const collection = database.collection<UserDocument>(
        this.usersCollection
      );

      if (isProcessing) {
        // Try to set processing flag only if it's not already set
        const result = await collection.updateOne(
          { _id: new ObjectId(userId), isProcessingVideo: { $ne: true } },
          { $set: { isProcessingVideo: true } }
        );
        return result.modifiedCount > 0;
      } else {
        // Clear processing flag
        await collection.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { isProcessingVideo: false } }
        );
        return true;
      }
    } catch (error) {
      console.error("❌ Error setting user processing status:", error);
      return false;
    }
  }

  // ========== User Preferences ==========

  /**
   * Get user's language preference
   */
  static async getUserLanguagePreference(userId: string): Promise<string> {
    try {
      const collection = database.collection<UserPreference>(
        this.preferencesCollection
      );
      const userPreference = await collection.findOne({ userId });

      if (userPreference?.languagePreference) {
        // Map language preference to Klap API format
        return userPreference.languagePreference === "Indonesia" ? "id" : "en";
      }

      return "en"; // Default to English
    } catch (error) {
      console.error("❌ Error fetching user language preference:", error);
      return "en"; // Default to English on error
    }
  }

  // ========== Shorts Management ==========

  /**
   * Add a new short to user's collection
   * Creates a new document if user doesn't exist, otherwise pushes to existing array
   */
  static async addUserShort(
    userId: string,
    short: {
      title: string;
      virality_score: number;
      captions: {
        tiktok: string;
        youtube: string;
        linkedin: string;
        instagram: string;
      };
      download_url: string;
      description?: string;
    }
  ): Promise<void> {
    try {
      const collection = database.collection<UserShortsDocument>(
        this.userShortsCollection
      );

      const shortWithTimestamp: UserShort = {
        ...short,
        created_at: new Date(),
      };

      // Use upsert to create document if it doesn't exist
      const result = await collection.updateOne(
        { userid: userId },
        {
          $push: { shorts: shortWithTimestamp },
          $set: { updatedAt: new Date() },
          $setOnInsert: {
            userid: userId,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      console.log("✅ Short added to user collection:", {
        userId,
        title: short.title,
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount,
      });
    } catch (error) {
      console.error("❌ Error adding short to user collection:", error);
      throw new Error(
        `Failed to add short to database: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get all shorts for a specific user
   */
  static async getUserShorts(userId: string): Promise<UserShort[]> {
    try {
      const collection = database.collection<UserShortsDocument>(
        this.userShortsCollection
      );

      const userDoc = await collection.findOne({ userid: userId });

      if (!userDoc) {
        return [];
      }

      return userDoc.shorts || [];
    } catch (error) {
      console.error("❌ Error fetching user shorts:", error);
      throw new Error(
        `Failed to fetch user shorts: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get user shorts count
   */
  static async getUserShortsCount(userId: string): Promise<number> {
    try {
      const collection = database.collection<UserShortsDocument>(
        this.userShortsCollection
      );

      const result = await collection
        .aggregate([
          { $match: { userid: userId } },
          { $project: { count: { $size: "$shorts" } } },
        ])
        .toArray();

      return result[0]?.count || 0;
    } catch (error) {
      console.error("❌ Error counting user shorts:", error);
      return 0;
    }
  }

  /**
   * Delete a specific short by download_url
   */
  static async deleteUserShort(
    userId: string,
    downloadUrl: string
  ): Promise<boolean> {
    try {
      const collection = database.collection<UserShortsDocument>(
        this.userShortsCollection
      );

      const result = await collection.updateOne(
        { userid: userId },
        {
          $pull: { shorts: { download_url: downloadUrl } },
          $set: { updatedAt: new Date() },
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error("❌ Error deleting user short:", error);
      throw new Error(
        `Failed to delete short: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get a specific short by download_url
   */
  static async getUserShortByUrl(
    userId: string,
    downloadUrl: string
  ): Promise<UserShort | null> {
    try {
      const collection = database.collection<UserShortsDocument>(
        this.userShortsCollection
      );

      const result = await collection
        .aggregate([
          { $match: { userid: userId } },
          { $unwind: "$shorts" },
          { $match: { "shorts.download_url": downloadUrl } },
          { $replaceRoot: { newRoot: "$shorts" } },
        ])
        .toArray();

      return (result[0] as UserShort) || null;
    } catch (error) {
      console.error("❌ Error fetching specific short:", error);
      return null;
    }
  }
}

export default KlapModel;
