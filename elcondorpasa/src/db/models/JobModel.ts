// src/db/models/JobModel.ts

import { MongoClient, Db, Collection } from "mongodb";
import { KlapShort } from "@/types";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export interface KlapJob {
  _id?: string;
  jobId: string;
  userId: string;
  videoUrl: string;
  chatId?: number;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number;
  result?: {
    short: KlapShort;
    downloadUrl: string;
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

class JobModel {
  private async getCollection(): Promise<Collection<KlapJob>> {
    const { db } = await connectToDatabase();
    return db.collection<KlapJob>("klap_jobs");
  }

  async createJob(data: {
    jobId: string;
    userId: string;
    videoUrl: string;
    chatId?: number;
  }): Promise<KlapJob> {
    const collection = await this.getCollection();
    const job: KlapJob = {
      ...data,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(job);
    return job;
  }

  async updateJob(jobId: string, updates: Partial<KlapJob>): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne(
      { jobId },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    );
  }

  async getJob(jobId: string): Promise<KlapJob | null> {
    const collection = await this.getCollection();
    return collection.findOne({ jobId });
  }

  async getPendingJobs(limit: number = 5): Promise<KlapJob[]> {
    const collection = await this.getCollection();
    return collection
      .find({ status: "pending" })
      .sort({ createdAt: 1 })
      .limit(limit)
      .toArray();
  }
}

const jobModelInstance = new JobModel();
export default jobModelInstance;
