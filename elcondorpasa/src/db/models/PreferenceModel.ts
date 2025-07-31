import * as z from "zod";
import { ObjectId } from "mongodb";

const PreferenceSchema = z.object({
  userId: z.string().nonempty("User ID is required"),
  contentPreference: z.string().nonempty("Content preference is required"),
  languagePreference: z.string().nonempty("Language preference is required"),
});

const UpdatePreferenceSchema = z
  .object({
    contentPreference: z
      .string()
      .nonempty("Content preference is required")
      .optional(),
    languagePreference: z
      .string()
      .nonempty("Language preference is required")
      .optional(),
  })
  .refine((data) => data.contentPreference || data.languagePreference, {
    message: "At least one field must be provided for update",
  });

export interface Preference {
  _id?: ObjectId;
  userId: string;
  contentPreference: string;
  languagePreference: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class PreferenceModel {
  static async collection() {
    // Import database only when needed
    const { database } = await import("@/db/config/mongodb");
    return database.collection<Preference>("preferences");
  }

  static async getPreferenceByUserId(
    userId: string
  ): Promise<Preference | null> {
    const collection = await this.collection();
    return await collection.findOne({ userId });
  }

  static async createPreference(preference: {
    userId: string;
    contentPreference: string;
    languagePreference: string;
  }) {
    PreferenceSchema.parse(preference);
    const collection = await this.collection();

    // Double-check if preference already exists
    const existingPreference = await collection.findOne({
      userId: preference.userId,
    });

    if (existingPreference) {
      throw { message: "Preference for this user already exists", status: 400 };
    }

    const result = await collection.insertOne({
      ...preference,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return result.insertedId.toString();
  }

  static async updatePreference(
    userId: string,
    updates: Partial<{
      contentPreference: string;
      languagePreference: string;
    }>
  ) {
    // Validate updates
    UpdatePreferenceSchema.parse(updates);

    const collection = await this.collection();
    const result = await collection.updateOne(
      { userId },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      throw { message: "Preferences not found", status: 404 };
    }

    return result.modifiedCount;
  }

  static async deletePreference(userId: string) {
    const collection = await this.collection();
    const result = await collection.deleteOne({ userId });
    return result.deletedCount;
  }

  static async getAllPreferences(limit: number = 100, skip: number = 0) {
    const collection = await this.collection();
    return await collection
      .find({})
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async countPreferences(): Promise<number> {
    const collection = await this.collection();
    return await collection.countDocuments();
  }
}

export default PreferenceModel;
