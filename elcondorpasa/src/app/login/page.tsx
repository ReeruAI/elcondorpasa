// src/app/login/page.tsx
// this is just a mock login page for google login testing purposes
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface GoogleResponse {
  credential: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function LoginPage() {
  const [formData, setFormData] = useState({
    emailUsername: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      setIsGoogleLoaded(true);
      if (window.google && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            width: "100%",
          }
        );
      }
    };

    script.onerror = () => {
      setError("Failed to load Google Sign-In");
    };

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleResponse = async (response: GoogleResponse) => {
    setGoogleLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          googleToken: response.credential,
        }),
      });

      const data = await result.json();

      if (result.ok) {
        setSuccess(`Welcome ${data.user.name || data.user.email}!`);
        // Redirect to dashboard or desired page
        setTimeout(() => {
          router.push("/dashboard"); // Change this to your desired redirect
        }, 1500);
      } else {
        setError(data.message || "Google login failed");
      }
    } catch (error) {
      console.error("Google login error:", error);
      setError("An unexpected error occurred");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegularLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await result.json();

      if (result.ok) {
        setSuccess("Login successful!");
        setTimeout(() => {
          router.push("/dashboard"); // Change this to your desired redirect
        }, 1500);
      } else {
        setError(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome back! Please sign in to continue.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        <div className="mt-8 space-y-6">
          {/* Regular Login Form */}
          <form className="space-y-6" onSubmit={handleRegularLogin}>
            <div>
              <label
                htmlFor="emailUsername"
                className="block text-sm font-medium text-gray-700"
              >
                Email or Username
              </label>
              <input
                id="emailUsername"
                name="emailUsername"
                type="text"
                required
                value={formData.emailUsername}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email or username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || googleLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign-In */}
          <div className="space-y-4">
            {!isGoogleLoaded && (
              <div className="bg-gray-200 animate-pulse h-12 w-full rounded-md flex items-center justify-center">
                <span className="text-sm text-gray-500">
                  Loading Google Sign-In...
                </span>
              </div>
            )}

            <div
              id="google-signin-button"
              className={`${!isGoogleLoaded ? "hidden" : ""} ${
                googleLoading ? "opacity-50 pointer-events-none" : ""
              } w-full flex justify-center`}
            />

            {googleLoading && (
              <div className="text-center">
                <span className="text-sm text-gray-500">
                  Signing in with Google...
                </span>
              </div>
            )}
          </div>

          {/* Links */}
          <div className="flex items-center justify-between text-sm">
            <a href="#" className="text-indigo-600 hover:text-indigo-500">
              Forgot your password?
            </a>
            <a
              href="/register"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Don't have an account? Sign up
            </a>
          </div>
        </div>

        {/* Development Info */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Development Mode
            </h3>
            <p className="text-xs text-blue-600">
              Google Sign-In requires NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local
            </p>
            {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ Google Client ID not found
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
