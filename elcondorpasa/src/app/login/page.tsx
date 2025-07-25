"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios, { AxiosError } from "axios";
import {
  ArrowRight,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from "lucide-react";

interface GoogleResponse {
  credential: string;
}

interface LoginResponse {
  message?: string;
  user?: {
    name?: string;
    email?: string;
  };
}

declare global {
  interface Window {
    google: any;
  }
}

// Reusable motion components
const FadeInView: React.FC<{
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}> = ({ children, delay = 0, y = 20, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

const ScaleButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}> = ({ children, className = "", type = "button", disabled, onClick }) => (
  <motion.button
    whileHover={{ scale: disabled ? 1 : 1.05 }}
    whileTap={{ scale: disabled ? 1 : 0.95 }}
    className={className}
    type={type}
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </motion.button>
);

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
      console.log("Google script loaded");
      setIsGoogleLoaded(true);
      if (window.google && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        console.log(
          "Initializing Google Sign-In with ID:",
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
        );
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          {
            theme: "filled_black",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            width: "100%",
          }
        );
        console.log("Google button rendered");
      } else {
        console.error("Missing Google or Client ID", {
          hasGoogle: !!window.google,
          hasClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        });
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
      const { data } = await axios.post<LoginResponse>("/api/auth/google", {
        googleToken: response.credential,
      });

      setSuccess(`Welcome ${data.user?.name || data.user?.email}!`);
      // Redirect to dashboard or desired page
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Google login error:", error);

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<LoginResponse>;
        setError(axiosError.response?.data?.message || "Google login failed");
      } else {
        setError("An unexpected error occurred");
      }
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
      const { data } = await axios.post<LoginResponse>("/api/login", formData);

      setSuccess("Login successful!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Login error:", error);

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<LoginResponse>;
        setError(axiosError.response?.data?.message || "Login failed");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1D1D1D] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-20 left-10 w-64 h-64 bg-[#D68CB8]/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [360, 180, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-20 right-10 w-96 h-96 bg-[#D68CB8]/5 rounded-full blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        {/* Header */}
        <FadeInView>
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-[#D68CB8]/20 rounded-full mb-4"
            >
              <Sparkles className="w-8 h-8 text-[#D68CB8]" />
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Welcome back
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-400">
              Sign in to continue creating amazing shorts
            </p>
          </div>
        </FadeInView>

        {/* Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl backdrop-blur-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl backdrop-blur-sm flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {success}
          </motion.div>
        )}

        <FadeInView delay={0.1}>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/10">
            {/* Regular Login Form */}
            <form className="space-y-6" onSubmit={handleRegularLogin}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <label
                  htmlFor="emailUsername"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email or Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="emailUsername"
                    name="emailUsername"
                    type="text"
                    required
                    value={formData.emailUsername}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D68CB8] focus:border-transparent transition-all duration-300"
                    placeholder="Enter your email or username"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D68CB8] focus:border-transparent transition-all duration-300"
                    placeholder="Enter your password"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <ScaleButton
                  type="submit"
                  disabled={isLoading || googleLoading}
                  className="group w-full py-3 px-4 bg-gradient-to-r from-[#D68CB8] to-pink-400 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </ScaleButton>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/5 text-gray-400 backdrop-blur-sm rounded-full">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign-In */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="space-y-4"
            >
              {!isGoogleLoaded && (
                <div className="bg-white/10 animate-pulse h-12 w-full rounded-xl flex items-center justify-center">
                  <span className="text-sm text-gray-400">
                    Loading Google Sign-In...
                  </span>
                </div>
              )}

              <div
                id="google-signin-button"
                className={`${!isGoogleLoaded ? "hidden" : ""} ${
                  googleLoading ? "opacity-50 pointer-events-none" : ""
                } w-full flex justify-center`}
                style={{ minHeight: "44px" }}
              />

              {/* Fallback Google button if the official one doesn't render */}
              {isGoogleLoaded &&
                !document.querySelector("#google-signin-button iframe") && (
                  <ScaleButton
                    onClick={() => window.google?.accounts.id.prompt()}
                    disabled={googleLoading}
                    className="w-full py-3 px-4 bg-white text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {googleLoading ? "Signing in..." : "Continue with Google"}
                  </ScaleButton>
                )}

              {googleLoading && (
                <div className="text-center">
                  <span className="text-sm text-gray-400">
                    Signing in with Google...
                  </span>
                </div>
              )}
            </motion.div>

            {/* Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex items-center justify-between text-sm mt-6"
            >
              <a
                href="#"
                className="text-[#D68CB8] hover:text-pink-300 transition-colors duration-300"
              >
                Forgot password?
              </a>
              <a
                href="/register"
                className="text-[#D68CB8] hover:text-pink-300 transition-colors duration-300"
              >
                Create account
              </a>
            </motion.div>
          </div>
        </FadeInView>

        {/* Development Info */}
        {process.env.NODE_ENV === "development" && (
          <FadeInView delay={0.7}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl backdrop-blur-sm"
            >
              <h3 className="text-sm font-medium text-blue-400 mb-2">
                Development Mode
              </h3>
              <p className="text-xs text-blue-300/70">
                Google Sign-In requires NEXT_PUBLIC_GOOGLE_CLIENT_ID in
                .env.local
              </p>
              {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                <p className="text-xs text-red-400 mt-1">
                  ⚠️ Google Client ID not found
                </p>
              )}
            </motion.div>
          </FadeInView>
        )}
      </motion.div>
    </div>
  );
}
