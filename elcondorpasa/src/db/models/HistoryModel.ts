import * as z from "zod";
import { ObjectId } from "mongodb";

// Video schema
const VideoSchema = z.object({
  title: z.string().nonempty("Title is required"),
  creator: z.string().nonempty("Creator is required"),
  thumbnailUrl: z.string().url("Invalid thumbnail URL"),
  videoUrl: z.string().url("Invalid video URL"),
  viewCount: z.number().int().positive("View count must be positive"),
  duration: z.string().nonempty("Duration is required"),
  reasoning: z.string().nonempty("Reasoning is required"),
});

// History schema
const HistorySchema = z.object({
  userId: z.string().nonempty("User ID is required"),
  contentPreference: z.string().nonempty("Content preference is required"),
  languagePreference: z.string().nonempty("Language preference is required"),
  videos: z.array(VideoSchema).max(5), // Allow empty array, max 5 videos
  source: z.string().default("YouTube Data API v3 + Gemini Analysis"),
  timestamp: z.date(),
});

// TypeScript interfaces
export interface Video {
  title: string;
  creator: string;
  thumbnailUrl: string;
  videoUrl: string;
  viewCount: number;
  duration: string;
  reasoning: string;
}

export interface History {
  _id?: ObjectId;
  userId: string;
  contentPreference: string;
  languagePreference: string;
  videos: Video[];
  source: string;
  timestamp: Date;
  createdAt?: Date;
}

class HistoryModel {
  static async collection() {
    // Import database only when needed
    const { database } = await import("@/db/config/mongodb");
    return database.collection<History>("history");
  }

  static async createHistory(history: {
    userId: string;
    contentPreference: string;
    languagePreference: string;
    videos: Video[];
    source?: string;
    timestamp: Date;
  }) {
    // Validate the history data
    HistorySchema.parse(history);

    const collection = await this.collection();

    const result = await collection.insertOne({
      ...history,
      source: history.source || "YouTube Data API v3 + Gemini Analysis",
      createdAt: new Date(),
    });

    return result.insertedId.toString();
  }

  static async getHistoryByUserId(
    userId: string,
    limit: number = 10,
    skip: number = 0
  ): Promise<History[]> {
    const collection = await this.collection();
    return await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();
  }

  static async getHistoryById(historyId: string): Promise<History | null> {
    const collection = await this.collection();
    return await collection.findOne({ _id: new ObjectId(historyId) });
  }

  static async deleteHistoryById(historyId: string, userId: string) {
    const collection = await this.collection();
    const result = await collection.deleteOne({
      _id: new ObjectId(historyId),
      userId, // Ensure user can only delete their own history
    });

    if (result.deletedCount === 0) {
      throw { message: "History not found or unauthorized", status: 404 };
    }

    return result.deletedCount;
  }

  static async deleteAllUserHistory(userId: string) {
    const collection = await this.collection();
    const result = await collection.deleteMany({ userId });
    return result.deletedCount;
  }

  static async countUserHistory(userId: string): Promise<number> {
    const collection = await this.collection();
    return await collection.countDocuments({ userId });
  }

  static async getLatestHistory(userId: string): Promise<History | null> {
    const collection = await this.collection();
    const results = await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    return results[0] || null;
  }

  // Get history within a date range
  static async getHistoryByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<History[]> {
    const collection = await this.collection();
    return await collection
      .find({
        userId,
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ createdAt: -1 })
      .toArray();
  }

  // Get history by content preference
  static async getHistoryByPreference(
    userId: string,
    contentPreference?: string,
    languagePreference?: string
  ): Promise<History[]> {
    const collection = await this.collection();
    const query: {
      userId: string;
      contentPreference?: string;
      languagePreference?: string;
    } = { userId };

    if (contentPreference) {
      query.contentPreference = contentPreference;
    }
    if (languagePreference) {
      query.languagePreference = languagePreference;
    }

    return await collection.find(query).sort({ createdAt: -1 }).toArray();
  }
}

export default HistoryModel;
