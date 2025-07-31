import { ObjectId } from "mongodb";
import { database } from "../config/mongodb";

interface Short {
  title: string;
  download_url: string;
  created_at: Date;
  virality_score?: number;
  captions?: {
    tiktok?: string;
    youtube?: string;
    linkedin?: string;
    instagram?: string;
  };
}

interface UserShorts {
  _id: ObjectId;
  userid: string;
  createdAt: Date;
  shorts: Short[];
  updatedAt: Date;
}

export async function getUserShorts(
  userId: string
): Promise<UserShorts | null> {
  try {
    const collection = database.collection("usershorts");

    const userShorts = await collection.findOne({ userid: userId });

    return userShorts as UserShorts | null;
  } catch (error) {
    console.error("Error fetching user shorts from database:", error);
    throw error;
  }
}
