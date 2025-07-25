import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { verifyToken } from "./helpers/jwt";

export async function middleware(request: NextRequest) {
  try {
    const token = request.cookies.get("Authorization")?.value;

    // If no token, continue without userId
    if (!token) {
      return NextResponse.next();
    }

    // Try to extract and verify the token
    try {
      const rawToken = token.split(" ");
      const tokenType = rawToken[0];
      const tokenValue = rawToken[1];

      if (tokenType === "Bearer" && tokenValue) {
        const decodedToken = await verifyToken<{ _id: string; id: string }>(
          tokenValue
        );

        // Add userId to request headers
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-userId", decodedToken.id || decodedToken._id);

        return NextResponse.next({ headers: requestHeaders });
      }
    } catch (error) {
      console.error("Invalid token, continuing without auth:", error);
    }

    // Continue without userId if token is invalid
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/api/preferences/:path*", "/api/profile/:path*"],
};
