import { NewUserType, User } from "@/types";
import * as z from "zod";
import { comparePass, hashPass } from "@/helpers/bcrypt";
import { signToken } from "@/helpers/jwt";

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
});

const UserLoginSchema = z.object({
  emailUsername: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
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
}

export default UserModel;
