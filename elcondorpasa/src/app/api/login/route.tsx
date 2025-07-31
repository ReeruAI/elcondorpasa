import UserModel from "@/db/models/UserModel";
import { errorHandler } from "@/helpers/errorHandler";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { emailUsername, password } = await req.json();
    const user = { emailUsername, password };
    const result = await UserModel.login(user);

    const response = NextResponse.json({ message: result.message });

    // Set the secure HttpOnly cookie for authentication
    response.cookies.set({
      name: "Authorization",
      value: `Bearer ${result.access_token}`,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    // Set a UI-only cookie for header state (non-HttpOnly)
    response.cookies.set({
      name: "isLoggedIn",
      value: "true",
      httpOnly: false, // JavaScript can read this
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
