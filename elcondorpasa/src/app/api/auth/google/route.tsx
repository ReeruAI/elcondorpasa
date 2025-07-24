import UserModel from "@/db/models/UserModel";
import { errorHandler } from "@/helpers/errorHandler";
import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { signToken } from "@/helpers/jwt";
import { hashPass } from "@/helpers/bcrypt";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
  try {
    const { googleToken } = await req.json();

    if (!googleToken) {
      throw new Error("No googleToken in request body");
    }

    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error("Invalid Google token payload");
    }

    const collection = await UserModel.collection();

    // Try to find existing user by email
    let user = await collection.findOne({ email: payload.email });

    if (!user) {
      // Generate unique username from Google name
      const baseUsername =
        payload.name
          ?.split(" ")
          .map((word: string, i: number, arr: string[]) =>
            i < arr.length - 1 ? word[0] : word
          )
          .join("")
          .toLowerCase() || "user";

      const randomNumber = Math.floor(1000 + Math.random() * 9000);
      const uniqueUsername = `${baseUsername}${randomNumber}`;

      // Create new Google user
      const randomPassword = Math.random().toString(36).substring(2, 15);
      const hashedPassword = hashPass(randomPassword);

      const newGoogleUser = {
        username: uniqueUsername,
        name: payload.name || "",
        email: payload.email,
        password: hashedPassword,
      };

      const result = await collection.insertOne(newGoogleUser);
      user = { ...newGoogleUser, _id: result.insertedId };
    }

    // Generate JWT token using your existing helper
    const access_token = signToken({ id: user._id.toString() });

    // Prepare user data (remove password)
    const userData = { ...user };
    delete userData.password;

    const response = NextResponse.json({
      message: "Login Success",
      user: userData,
    });

    // Set cookies same as your regular login
    response.cookies.set({
      name: "Authorization",
      value: `Bearer ${access_token}`,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    response.cookies.set({
      name: "isLoggedIn",
      value: "true",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    return errorHandler(error);
  }
}
