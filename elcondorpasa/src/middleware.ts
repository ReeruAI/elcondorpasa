import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { verifyToken } from "./helpers/jwt";

// Define route groups
const PROTECTED_ROUTES = ["/dashboard", "/preferences"];
const AUTH_ROUTES = ["/login", "/register"];
const API_ROUTES = ["/api/preferences", "/api/profile"];
const OPTIONAL_AUTH_ROUTES = ["/api/gemini", "/api/midtrans"];

export async function middleware(request: NextRequest) {
  try {
    const token = request.cookies.get("Authorization")?.value;
    const { pathname } = request.nextUrl;

    // Check if current path matches any route group
    const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
      pathname.startsWith(route)
    );
    const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
    const isApiRoute = API_ROUTES.some((route) => pathname.startsWith(route));
    const isOptionalAuthRoute = OPTIONAL_AUTH_ROUTES.some((route) =>
      pathname.startsWith(route)
    );

    // Handle unauthenticated users
    if (!token) {
      if (isProtectedRoute) {
        return redirectTo(request, "/login");
      }

      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // For optional auth routes, continue without userId
      if (isOptionalAuthRoute) {
        return NextResponse.next();
      }

      // Allow access to auth routes and other public routes
      return NextResponse.next();
    }

    // Verify token
    const verificationResult = await verifyAndExtractToken(token);

    if (!verificationResult.isValid) {
      console.error("Invalid token:", verificationResult.error);

      if (isProtectedRoute) {
        return redirectTo(request, "/login");
      }

      if (isApiRoute) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }

      // For optional auth routes, continue without userId even if token is invalid
      if (isOptionalAuthRoute) {
        console.error(
          "Invalid token, continuing without auth:",
          verificationResult.error
        );
        return NextResponse.next();
      }

      return NextResponse.next();
    }

    // Handle authenticated users
    if (isAuthRoute) {
      return redirectTo(request, "/dashboard");
    }

    // Add userId to headers for valid tokens
    const requestHeaders = new Headers(request.headers);
    if (verificationResult.userId) {
      requestHeaders.set("x-userId", verificationResult.userId);
    }

    return NextResponse.next({ headers: requestHeaders });
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

// Helper function to verify token
async function verifyAndExtractToken(token: string): Promise<{
  isValid: boolean;
  userId?: string;
  error?: any;
}> {
  try {
    const [tokenType, tokenValue] = token.split(" ");

    if (tokenType !== "Bearer" || !tokenValue) {
      return { isValid: false, error: "Invalid token format" };
    }

    const decodedToken = await verifyToken<{ _id: string; id: string }>(
      tokenValue
    );
    const userId = decodedToken.id || decodedToken._id;

    if (!userId) {
      return { isValid: false, error: "No user ID found in token" };
    }

    return { isValid: true, userId };
  } catch (error) {
    return { isValid: false, error };
  }
}

// Helper function to redirect
function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Protected routes
    "/dashboard/:path*",
    "/preferences/:path*",
    // Auth routes
    "/login",
    "/register",
    // API routes that require authentication
    "/api/preferences/:path*",
    "/api/profile/:path*",
    "/api/history/:path*",
    // API routes with optional authentication
    "/api/gemini/:path*",
    "/api/midtrans/:path*",
    "/api/klap/:path*",
    "/api/user-shorts/:path*",
  ],
};
