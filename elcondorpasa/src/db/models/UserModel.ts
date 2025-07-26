import { NewUserType, User } from "@/types";
import * as z from "zod";
import { comparePass, hashPass } from "@/helpers/bcrypt";
import { signToken } from "@/helpers/jwt";
import { ObjectId } from "mongodb";

const UserSchema = z.object({
  username: z.string().min(5, "Username must be at least 5 characters long"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z
    .string()
    .min(5, "Password must be at least 5 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  phone: z.string().optional().default(""),
  telegram: z.boolean().optional().default(false),
  telegramChatId: z.number().optional(),
  telegramUsername: z.string().optional(),
  reeruToken: z.number().default(2),
});

const UserLoginSchema = z.object({
  emailUsername: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

const PhoneUpdateSchema = z.object({
  phone: z.string().nonempty("Phone is required"),
});

class UserModel {
  static async collection() {
    // Import database only when needed
    const { database } = await import("@/db/config/mongodb");
    return database.collection("users");
  }

  static async createUser(newUser: NewUserType) {
    UserSchema.parse(newUser);
    const collection = await this.collection();

    const existingUser = await collection.findOne({
      $or: [{ email: newUser.email }, { username: newUser.username }],
    });

    if (existingUser) {
      throw { message: "Username or email already exists", status: 400 };
    }

    newUser.password = hashPass(newUser.password);

    await collection.insertOne(newUser);
    return "Success add new user";
  }

  static async login(user: User) {
    UserLoginSchema.parse(user);
    const collection = await this.collection();

    const foundUser = await collection.findOne({
      $or: [{ email: user.emailUsername }, { username: user.emailUsername }],
    });

    if (!foundUser) {
      throw { message: "Invalid email/username or password", status: 401 };
    }

    const compPass = comparePass(user.password, foundUser.password);
    if (!compPass) {
      throw { message: "Invalid email/username or password", status: 401 };
    }

    const access_token = signToken({ id: foundUser._id.toString() });

    return { message: "Login success", access_token };
  }

  static async updatePhone(userId: string, phoneData: { phone: string }) {
    PhoneUpdateSchema.parse(phoneData);
    const collection = await this.collection();

    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { phone: phoneData.phone } }
    );

    if (result.matchedCount === 0) {
      throw { message: "User not found", status: 404 };
    }

    return "Success update phone";
  }

  static async toggleTelegram(userId: string) {
    const collection = await this.collection();

    const user = await collection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw { message: "User not found", status: 404 };
    }

    const newTelegramStatus = !user.telegram;
    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { telegram: newTelegramStatus } }
    );

    if (result.matchedCount === 0) {
      throw { message: "Failed to update telegram status", status: 500 };
    }

    return "Success toggle telegram status";
  }

  // ========== TELEGRAM METHODS ==========

  /**
   * Link akun user dengan Telegram berdasarkan email
   */
  static async linkTelegramByEmail(
    email: string,
    chatId: number,
    telegramUsername?: string
  ) {
    const collection = await this.collection();

    // Find user berdasarkan email
    const user = await collection.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      throw { message: "Email tidak ditemukan di sistem Reeru", status: 404 };
    }

    // Check if Telegram account sudah terhubung dengan user lain
    const existingTelegramUser = await collection.findOne({
      telegramChatId: chatId,
      _id: { $ne: user._id },
    });

    if (existingTelegramUser) {
      throw {
        message: "Akun Telegram ini sudah terhubung dengan user lain",
        status: 400,
      };
    }

    // Update user dengan data Telegram
    const result = await collection.updateOne(
      { _id: user._id },
      {
        $set: {
          telegram: true,
          telegramChatId: chatId,
          telegramUsername: telegramUsername || null,
        },
      }
    );

    if (result.matchedCount === 0) {
      throw { message: "Failed to link Telegram account", status: 500 };
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      telegramChatId: chatId,
      telegramUsername: telegramUsername,
    };
  }

  /**
   * Disconnect Telegram dari akun user
   */
  static async unlinkTelegramAccount(userId: string) {
    const collection = await this.collection();

    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: { telegram: false },
        $unset: {
          telegramChatId: 1,
          telegramUsername: 1,
        },
      }
    );

    if (result.matchedCount === 0) {
      throw { message: "User not found", status: 404 };
    }

    return "Success unlink Telegram account";
  }

  /**
   * Get user by Telegram Chat ID
   */
  static async getUserByTelegramChatId(chatId: number) {
    const collection = await this.collection();

    const user = await collection.findOne({ telegramChatId: chatId });
    return user;
  }

  /**
   * Get all users yang sudah connect Telegram (untuk broadcast)
   */
  static async getAllTelegramUsers() {
    const collection = await this.collection();

    const users = await collection
      .find({
        telegram: true,
        telegramChatId: { $exists: true, $ne: null },
      })
      .toArray();

    return users;
  }

  /**
   * Get user profile lengkap dengan info Telegram
   */
  static async getUserProfile(userId: string) {
    const collection = await this.collection();

    const user = await collection.findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          password: 0, // Exclude password
          phone: 0, // Exclude phone
          telegram: 0, // Exclude telegram status
        },
      }
    );

    if (!user) {
      throw { message: "User not found", status: 404 };
    }

    return user;
  }

  /**
   * Update user reeruToken
   */
  static async updateReeruToken(userId: string, newTokenCount: number) {
    const collection = await this.collection();

    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { reeruToken: newTokenCount } }
    );

    if (result.matchedCount === 0) {
      throw { message: "User not found", status: 404 };
    }

    return "Success update reeru token";
  }
}

export default UserModel;
