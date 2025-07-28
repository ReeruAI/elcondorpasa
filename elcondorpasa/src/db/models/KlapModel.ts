import { database } from "@/db/config/mongodb";
import { ObjectId } from "mongodb";

interface UserShort {
  title: string;
  download_url: string;
  created_at?: Date;
}

interface UserShortsDocument {
  _id?: ObjectId;
  userid: string;
  shorts: UserShort[];
  createdAt?: Date;
  updatedAt?: Date;
}

class KlapModel {
  private static collectionName = "usershorts";

  /**
   * Add a new short to user's collection
   * Creates a new document if user doesn't exist, otherwise pushes to existing array
   */
  static async addUserShort(
    userId: string,
    short: { title: string; download_url: string }
  ): Promise<void> {
    try {
      const collection = database.collection<UserShortsDocument>(
        this.collectionName
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
        this.collectionName
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
        this.collectionName
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
        this.collectionName
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
}

export default KlapModel;
