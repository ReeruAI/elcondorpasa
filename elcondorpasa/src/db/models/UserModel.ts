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
  youtube: z
    .object({
      accessToken: z.string(),
      refreshToken: z.string(),
      expiryDate: z.number(),
      channelName: z.string(),
      email: z.string(),
      connected: z.boolean(),
      connectedAt: z.date(),
      uploads: z
        .array(
          z.object({
            videoId: z.string(),
            title: z.string(),
            uploadedAt: z.date(),
          })
        )
        .optional(),
    })
    .optional(),
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

    // NEW VALIDATION: Check if user sudah memiliki Telegram account yang terhubung
    if (user.telegramChatId && user.telegramUsername) {
      throw {
        message: "Email ini sudah terhubung dengan akun Telegram lain",
        status: 400,
      };
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

  /**
   * Generate OTP untuk Telegram linking
   */
  static async generateTelegramOTP(userId: string) {
    const collection = await this.collection();

    // Check if user exists
    const user = await collection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw { message: "User not found", status: 404 };
    }

    // Check if user already has active Telegram connection
    if (user.telegramChatId && user.telegramUsername) {
      throw {
        message: "Telegram account already connected",
        status: 400,
      };
    }

    // Check rate limiting - max 3 OTPs per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOTPs = await collection.countDocuments({
      _id: new ObjectId(userId),
      "telegramOTP.generatedAt": { $gte: oneHourAgo },
    });

    if (recentOTPs >= 3) {
      throw {
        message: "Too many OTP requests. Please try again in an hour.",
        status: 429,
      };
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

    const otpData = {
      code: otpCode,
      generatedAt: now,
      expiresAt: expiresAt,
      isUsed: false,
    };

    // Update user with OTP data
    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { telegramOTP: otpData } }
    );

    if (result.matchedCount === 0) {
      throw { message: "Failed to generate OTP", status: 500 };
    }

    return {
      otpCode,
      expiresAt,
      email: user.email,
      name: user.name,
    };
  }

  /**
   * Verify OTP dan link Telegram account
   */
  static async verifyTelegramOTP(
    otpCode: string,
    chatId: number,
    telegramName: string,
    telegramUsername?: string
  ) {
    const collection = await this.collection();

    // Find user with matching OTP
    const user = await collection.findOne({
      "telegramOTP.code": otpCode,
      "telegramOTP.isUsed": false,
      "telegramOTP.expiresAt": { $gt: new Date() }, // Not expired
    });

    if (!user) {
      throw {
        message: "Invalid or expired OTP code",
        status: 400,
      };
    }

    // Check if this Telegram account is already linked to another user
    const existingTelegramUser = await collection.findOne({
      telegramChatId: chatId,
      _id: { $ne: user._id },
    });

    if (existingTelegramUser) {
      throw {
        message: "This Telegram account is already linked to another user",
        status: 400,
      };
    }

    // Update user: link Telegram and mark OTP as used
    const result = await collection.updateOne(
      { _id: user._id },
      {
        $set: {
          telegram: true,
          telegramChatId: chatId,
          telegramUsername: telegramUsername || telegramName,
          "telegramOTP.isUsed": true,
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
      telegramUsername: telegramUsername || telegramName,
    };
  }

  /**
   * Get user's current OTP status
   */
  static async getTelegramOTPStatus(userId: string) {
    const collection = await this.collection();

    const user = await collection.findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          telegramOTP: 1,
          telegram: 1,
          telegramChatId: 1,
          telegramUsername: 1,
        },
      }
    );

    if (!user) {
      throw { message: "User not found", status: 404 };
    }

    const now = new Date();
    const hasActiveOTP =
      user.telegramOTP &&
      !user.telegramOTP.isUsed &&
      user.telegramOTP.expiresAt > now;

    return {
      isConnected: !!(user.telegramChatId && user.telegram),
      telegramUsername: user.telegramUsername,
      hasActiveOTP,
      otpCode: hasActiveOTP ? user.telegramOTP.code : null,
      otpExpiresAt: hasActiveOTP ? user.telegramOTP.expiresAt : null,
    };
  }

  /**
   * Cleanup expired OTPs (untuk cron job)
   */
  static async cleanupExpiredOTPs() {
    const collection = await this.collection();

    const result = await collection.updateMany(
      {
        "telegramOTP.expiresAt": { $lt: new Date() },
        "telegramOTP.isUsed": false,
      },
      {
        $unset: { telegramOTP: 1 },
      }
    );

    console.log(`🧹 Cleaned up ${result.modifiedCount} expired OTPs`);
    return result.modifiedCount;
  }

  /**
   * Cancel active OTP
   */
  static async cancelTelegramOTP(userId: string) {
    const collection = await this.collection();

    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $unset: { telegramOTP: 1 } }
    );

    if (result.matchedCount === 0) {
      throw { message: "User not found", status: 404 };
    }

    return "OTP cancelled successfully";
  }

  /**
   * Initiate email linking - validate email and create pending verification
   */
  static async initiateEmailLinking(
    email: string,
    chatId: number,
    telegramName: string,
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

    // Check if user sudah memiliki Telegram account yang terhubung
    if (user.telegramChatId && user.telegramUsername) {
      throw {
        message: "Email ini sudah terhubung dengan akun Telegram lain",
        status: 400,
      };
    }

    // Check if this Telegram account is already linked to another user
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

    // Create pending verification record
    const pendingVerification = {
      email: email.toLowerCase(),
      chatId: chatId,
      telegramName: telegramName,
      telegramUsername: telegramUsername || null,
      initiatedAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes to complete
    };

    // Store pending verification in user record
    const result = await collection.updateOne(
      { _id: user._id },
      { $set: { pendingTelegramVerification: pendingVerification } }
    );

    if (result.matchedCount === 0) {
      throw { message: "Failed to initiate verification", status: 500 };
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      message:
        "Email verified. Please generate OTP from your dashboard and send it here.",
    };
  }

  /**
   * Complete email linking with OTP verification
   */
  static async completeEmailLinking(otpCode: string, chatId: number) {
    const collection = await this.collection();

    // Find user with matching pending verification AND valid OTP
    const user = await collection.findOne({
      "pendingTelegramVerification.chatId": chatId,
      "pendingTelegramVerification.expiresAt": { $gt: new Date() },
      "telegramOTP.code": otpCode,
      "telegramOTP.isUsed": false,
      "telegramOTP.expiresAt": { $gt: new Date() },
    });

    if (!user) {
      throw {
        message:
          "Invalid OTP or verification session expired. Please start over by sending your email again.",
        status: 400,
      };
    }

    const pendingVerification = user.pendingTelegramVerification;

    // Complete the linking
    const result = await collection.updateOne(
      { _id: user._id },
      {
        $set: {
          telegram: true,
          telegramChatId: pendingVerification.chatId,
          telegramUsername:
            pendingVerification.telegramUsername ||
            pendingVerification.telegramName,
          "telegramOTP.isUsed": true, // Mark OTP as used
        },
        $unset: {
          pendingTelegramVerification: 1, // Remove pending verification
        },
      }
    );

    if (result.matchedCount === 0) {
      throw { message: "Failed to complete verification", status: 500 };
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      telegramChatId: pendingVerification.chatId,
      telegramUsername:
        pendingVerification.telegramUsername ||
        pendingVerification.telegramName,
    };
  }

  /**
   * Get pending verification status
   */
  static async getPendingVerificationStatus(chatId: number) {
    const collection = await this.collection();

    const user = await collection.findOne({
      "pendingTelegramVerification.chatId": chatId,
      "pendingTelegramVerification.expiresAt": { $gt: new Date() },
    });

    if (!user) {
      return null;
    }

    return {
      email: user.pendingTelegramVerification.email,
      name: user.name,
      expiresAt: user.pendingTelegramVerification.expiresAt,
      hasActiveOTP: !!(
        user.telegramOTP &&
        !user.telegramOTP.isUsed &&
        user.telegramOTP.expiresAt > new Date()
      ),
    };
  }
}

export default UserModel;
