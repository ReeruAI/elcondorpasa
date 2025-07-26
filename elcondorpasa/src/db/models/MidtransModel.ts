import { Db, ObjectId } from "mongodb";
import { UserModel, Package, Transaction } from "../../types";

export class MidtransModel {
  private db: Db;

  constructor(database: Db) {
    this.db = database;
  }

  // Get user by ID
  async getUserById(userId: string): Promise<UserModel | null> {
    const users = this.db.collection<UserModel>("users");
    return await users.findOne({ _id: new ObjectId(userId) });
  }

  // Get package by ID
  async getPackageById(packageId: string): Promise<Package | null> {
    const packages = this.db.collection<Package>("packages");
    return await packages.findOne({ _id: new ObjectId(packageId) });
  }

  // Create new transaction
  async createTransaction(
    transactionData: Omit<Transaction, "_id">
  ): Promise<ObjectId> {
    const transactions = this.db.collection<Transaction>("transactions");
    const result = await transactions.insertOne({
      ...transactionData,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return result.insertedId;
  }

  // Update transaction status
  async updateTransactionStatus(
    orderId: string,
    status: Transaction["status"]
  ): Promise<boolean> {
    const transactions = this.db.collection<Transaction>("transactions");
    const result = await transactions.updateOne(
      { order_id: orderId },
      {
        $set: {
          status: status,
          updated_at: new Date(),
        },
      }
    );
    return result.modifiedCount > 0;
  }

  // Get transaction by order_id
  async getTransactionByOrderId(orderId: string): Promise<Transaction | null> {
    const transactions = this.db.collection<Transaction>("transactions");
    return await transactions.findOne({ order_id: orderId });
  }

  // Update user reeru tokens (add tokens when payment is successful)
  async updateUserTokens(
    userId: ObjectId,
    tokenAmount: number
  ): Promise<boolean> {
    const users = this.db.collection<UserModel>("users");
    const result = await users.updateOne(
      { _id: userId },
      { $inc: { reeruToken: tokenAmount } }
    );
    return result.modifiedCount > 0;
  }

  // Get transaction with user and package details
  async getTransactionDetails(orderId: string) {
    const transactions = this.db.collection("transactions");
    const result = await transactions
      .aggregate([
        { $match: { order_id: orderId } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $lookup: {
            from: "packages",
            localField: "packageId",
            foreignField: "_id",
            as: "package",
          },
        },
        {
          $project: {
            _id: 1,
            status: 1,
            amount: 1,
            order_id: 1,
            created_at: 1,
            updated_at: 1,
            user: { $arrayElemAt: ["$user", 0] },
            package: { $arrayElemAt: ["$package", 0] },
          },
        },
      ])
      .toArray();

    return result[0] || null;
  }
}
