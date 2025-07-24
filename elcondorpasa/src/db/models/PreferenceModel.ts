import * as z from "zod";

const PreferenceSchema = z.object({
  userId: z.string().nonempty("User ID is required"),
  contentPreference: z.string().nonempty("Content preference is required"),
  languagePreference: z.string().nonempty("Language preference is required"),
});

class PreferenceModel {
  static async collection() {
    // Import database only when needed
    const { database } = await import("@/db/config/mongodb");
    return database.collection("preferences");
  }

  static async createPreference(preference: {
    userId: string;
    contentPreference: string;
    languagePreference: string;
  }) {
    PreferenceSchema.parse(preference);
    const collection = await this.collection();

    const existingPreference = await collection.findOne({
      userId: preference.userId,
    });

    if (existingPreference) {
      throw { message: "Preference for this user already exists", status: 400 };
    }

    await collection.insertOne(preference);
    return "Success add new preference";
  }

  static async updatePreference(
    userId: string,
    updates: Partial<{
      contentPreference: string;
      languagePreference: string;
    }>
  ) {
    const collection = await this.collection();
    const result = await collection.updateOne({ userId }, { $set: updates });

    if (result.matchedCount === 0) {
      throw { message: "Preferences not found", status: 404 };
    }

    return "Success update preference";
  }
}

export default PreferenceModel;
