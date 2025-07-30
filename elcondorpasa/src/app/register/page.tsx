"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios, { AxiosError } from "axios";
import {
  ArrowRight,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  UserPlus,
  User,
  AtSign,
} from "lucide-react";
import { AuthResponse, FormField } from "@/types";
import CursorGlow from "@/components/CursorGlow";
import ParticleBackground from "@/components/yourclip/ParticleBackground";
import Link from "next/link";

// Constants
const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const REDIRECT_DELAY = 1500;

// Animation variants
const fadeInVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay },
  }),
};

const scaleVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

const slideInVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (delay: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, delay },
  }),
};

// Shared components
const MessageAlert: React.FC<{
  type: "error" | "success";
  message: string;
}> = ({ type, message }) => {
  const config = useMemo(
    () => ({
      error: {
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderColor: "rgba(239, 68, 68, 0.3)",
        textColor: "#fca5a5",
        Icon: AlertCircle,
      },
      success: {
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        borderColor: "rgba(34, 197, 94, 0.3)",
        textColor: "#86efac",
        Icon: CheckCircle,
      },
    }),
    []
  );

  const { backgroundColor, borderColor, textColor, Icon } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-3 rounded-xl flex items-center gap-2"
      style={{
        backgroundColor,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: `1px solid ${borderColor}`,
        color: textColor,
      }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {message}
    </motion.div>
  );
};

const LoadingSpinner = () => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
  />
);

// Main components
const FormInput: React.FC<{
  field: FormField;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  delay: number;
}> = ({ field, value, onChange, delay }) => (
  <motion.div
    variants={slideInVariants}
    initial="hidden"
    animate="visible"
    custom={delay}
  >
    <label
      htmlFor={field.id}
      className="block text-sm font-medium text-gray-200 mb-2"
    >
      {field.label}
    </label>
    <div className="relative">
      <field.icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        id={field.id}
        name={field.name}
        type={field.type}
        required
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-3 py-3 text-white placeholder-gray-400 rounded-xl focus:outline-none transition-all duration-300"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
        placeholder={field.placeholder}
        onFocus={(e) => {
          e.target.style.border = "1px solid rgba(214, 140, 184, 0.5)";
          e.target.style.boxShadow = "0 0 20px rgba(214, 140, 184, 0.2)";
        }}
        onBlur={(e) => {
          e.target.style.border = "1px solid rgba(255, 255, 255, 0.1)";
          e.target.style.boxShadow = "none";
        }}
      />
    </div>
  </motion.div>
);

const GoogleButton: React.FC<{
  isLoaded: boolean;
  isLoading: boolean;
  onClick?: () => void;
}> = ({ isLoaded, isLoading, onClick }) => {
  return (
    <>
      {!isLoaded && (
        <div
          className="animate-pulse h-12 w-full rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <span className="text-sm text-gray-400">
            Loading Google Sign-In...
          </span>
        </div>
      )}

      <div
        id="google-signup-button"
        className={`${!isLoaded ? "hidden" : ""} ${
          isLoading ? "opacity-50 pointer-events-none" : ""
        } w-full flex justify-center`}
        style={{ minHeight: "44px" }}
      />

      {/* Fallback Google button if the official one doesn't render */}
      {isLoaded && !document.querySelector("#google-signup-button iframe") && (
        <motion.button
          variants={scaleVariants}
          initial="idle"
          whileHover={isLoading ? "idle" : "hover"}
          whileTap={isLoading ? "idle" : "tap"}
          onClick={onClick}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-white text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
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
          {isLoading ? "Signing up..." : "Continue with Google"}
        </motion.button>
      )}

      {isLoading && (
        <div className="text-center">
          <span className="text-sm text-gray-400">
            Creating your account with Google...
          </span>
        </div>
      )}
    </>
  );
};

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState({ form: false, google: false });
  const [status, setStatus] = useState({ error: "", success: "" });
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const router = useRouter();

  // Form fields configuration
  const formFields: FormField[] = useMemo(
    () => [
      {
        id: "name",
        name: "name",
        type: "text",
        placeholder: "Enter your full name",
        label: "Full Name",
        icon: User,
      },
      {
        id: "username",
        name: "username",
        type: "text",
        placeholder: "Choose a username",
        label: "Username",
        icon: AtSign,
      },
      {
        id: "email",
        name: "email",
        type: "email",
        placeholder: "Enter your email",
        label: "Email",
        icon: Mail,
      },
      {
        id: "password",
        name: "password",
        type: "password",
        placeholder: "Create a password",
        label: "Password",
        icon: Lock,
      },
    ],
    []
  );

  const isAnyLoading = loading.form || loading.google;

  // Handlers
  const handleAuthResponse = useCallback(
    (data: AuthResponse, source: "google" | "regular") => {
      const userName = data.user?.name || data.user?.email;
      const redirectPath = source === "google" ? "/dashboard" : "/login";

      setStatus({
        error: "",
        success:
          source === "google"
            ? `Welcome ${userName}!`
            : "Account created successfully! Please login to continue.",
      });

      setTimeout(() => router.push(redirectPath), REDIRECT_DELAY);
    },
    [router]
  );

  const handleAuthError = useCallback(
    (error: unknown, defaultMessage: string) => {
      console.error(`${defaultMessage}:`, error);
      const message = axios.isAxiosError(error)
        ? (error as AxiosError<AuthResponse>).response?.data?.message ||
          defaultMessage
        : "An unexpected error occurred";
      setStatus({ error: message, success: "" });
    },
    []
  );

  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
      setLoading((prev) => ({ ...prev, google: true }));
      setStatus({ error: "", success: "" });

      try {
        const { data } = await axios.post<AuthResponse>("/api/auth/google", {
          googleToken: response.credential,
        });
        handleAuthResponse(data, "google");
      } catch (error) {
        handleAuthError(error, "Google registration failed");
      } finally {
        setLoading((prev) => ({ ...prev, google: false }));
      }
    },
    [handleAuthResponse, handleAuthError]
  );

  // Initialize Google Sign-In
  useEffect(() => {
    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_URL;
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      console.log("Google script loaded");
      setIsGoogleLoaded(true);
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      if (window.google && clientId) {
        console.log("Initializing Google Sign-In with ID:", clientId);
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-signup-button"),
          {
            theme: "filled_black",
            size: "large",
            text: "signup_with",
            shape: "rectangular",
            width: "100%",
          }
        );
        console.log("Google button rendered");
      } else {
        console.error("Missing Google or Client ID", {
          hasGoogle: !!window.google,
          hasClientId: !!clientId,
        });
      }
    };

    script.onerror = () =>
      setStatus({ error: "Failed to load Google Sign-In", success: "" });

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, [handleGoogleResponse]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading((prev) => ({ ...prev, form: true }));
      setStatus({ error: "", success: "" });

      try {
        const { data } = await axios.post<AuthResponse>(
          "/api/register",
          formData
        );
        handleAuthResponse(data, "regular");
      } catch (error) {
        handleAuthError(error, "Registration failed");
      } finally {
        setLoading((prev) => ({ ...prev, form: false }));
      }
    },
    [formData, handleAuthResponse, handleAuthError]
  );

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-[#1D1D1D] to-black overflow-hidden">
      {/* Background Effects */}
      <ParticleBackground />

      {/* Cursor Glow Effect */}
      <CursorGlow />

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8"
        >
          {/* Header */}
          <motion.div
            variants={fadeInVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-6 shadow-2xl"
              style={{
                boxShadow: "0 20px 40px rgba(236, 72, 153, 0.3)",
              }}
            >
              <UserPlus className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              Create your account
            </h2>
            <p className="mt-3 text-base sm:text-lg text-gray-300">
              Join us to start creating amazing shorts
            </p>
          </motion.div>

          {/* Messages */}
          {status.error && <MessageAlert type="error" message={status.error} />}
          {status.success && (
            <MessageAlert type="success" message={status.success} />
          )}

          <motion.div
            variants={fadeInVariants}
            initial="hidden"
            animate="visible"
            custom={0.1}
            className="rounded-3xl p-8 sm:p-10 shadow-2xl"
            style={{
              backgroundColor: "rgba(31, 31, 31, 0.3)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {formFields.map((field, index) => (
                <FormInput
                  key={field.id}
                  field={field}
                  value={formData[field.name as keyof typeof formData]}
                  onChange={handleInputChange}
                  delay={0.2 + index * 0.05}
                />
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <motion.button
                  variants={scaleVariants}
                  initial="idle"
                  whileHover={isAnyLoading ? "idle" : "hover"}
                  whileTap={isAnyLoading ? "idle" : "tap"}
                  type="submit"
                  disabled={isAnyLoading}
                  className="group w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    boxShadow: "0 10px 30px rgba(236, 72, 153, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isAnyLoading) {
                      e.currentTarget.style.boxShadow =
                        "0 15px 40px rgba(236, 72, 153, 0.4)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 10px 30px rgba(236, 72, 153, 0.3)";
                  }}
                >
                  {loading.form ? (
                    <>
                      <LoadingSpinner />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div
                  className="w-full h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                  }}
                />
              </div>
              <div className="relative flex justify-center text-sm">
                <span
                  className="px-4 text-gray-400 rounded-full"
                  style={{
                    backgroundColor: "rgba(31, 31, 31, 0.3)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                  }}
                >
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
              <GoogleButton
                isLoaded={isGoogleLoaded}
                isLoading={loading.google}
                onClick={() => window.google?.accounts.id.prompt()}
              />
            </motion.div>

            {/* Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex items-center justify-center text-sm mt-8"
            >
              <span className="text-gray-300">Already have an account?</span>
              <Link
                href="/login"
                className="ml-2 text-pink-400 hover:text-pink-300 font-medium transition-colors duration-300"
              >
                Sign in
              </Link>
            </motion.div>
          </motion.div>

          {/* Development Info */}
          {process.env.NODE_ENV === "development" && (
            <motion.div
              variants={fadeInVariants}
              initial="hidden"
              animate="visible"
              custom={0.7}
              className="p-4 rounded-xl opacity-50"
              style={{
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
              }}
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
          )}
        </motion.div>
      </div>
    </div>
  );
}
