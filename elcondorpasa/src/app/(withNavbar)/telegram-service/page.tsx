"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import {
  MessageCircle,
  Copy,
  RefreshCw,
  CheckCircle,
  Clock,
  Hash,
  Trash2,
  BookOpen,
  ExternalLink,
  Mail,
  Key,
  Send,
} from "lucide-react";
import CursorGlow from "@/components/CursorGlow";
import ParticleBackground from "@/components/yourclip/ParticleBackground";

interface OTPStatus {
  isConnected: boolean;
  telegramUsername?: string;
  hasActiveOTP: boolean;
  otpCode?: string;
  otpExpiresAt?: string;
}

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

export default function OTPTestPage() {
  const [otpStatus, setOtpStatus] = useState<OTPStatus | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Test Generate OTP
  const testGenerateOTP = async () => {
    setIsGenerating(true);

    try {
      const response = await axios.post(
        "/api/telegram/generate-otp",
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setOtpStatus({
          isConnected: false,
          hasActiveOTP: true,
          otpCode: response.data.data.otpCode,
          otpExpiresAt: response.data.data.expiresAt,
        });
      }
    } catch (error: any) {
      console.error("Generate OTP error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Test Get OTP Status
  const testGetStatus = async () => {
    setIsLoading(true);

    try {
      const response = await axios.get("/api/telegram/generate-otp");

      if (response.data.success) {
        setOtpStatus(response.data.data);
      }
    } catch (error: any) {
      console.error("Get status error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Test Cancel OTP
  const testCancelOTP = async () => {
    try {
      const response = await axios.delete("/api/telegram/generate-otp");

      if (response.data.success) {
        // Refresh status after cancellation
        await testGetStatus();
      }
    } catch (error: any) {
      console.error("Cancel OTP error:", error);
    }
  };

  // Copy OTP to clipboard
  const copyOTP = async () => {
    if (otpStatus?.otpCode) {
      try {
        await navigator.clipboard.writeText(otpStatus.otpCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy OTP");
      }
    }
  };

  // Calculate remaining time
  const getRemainingTime = () => {
    if (!otpStatus?.otpExpiresAt) return null;

    const now = new Date().getTime();
    const expires = new Date(otpStatus.otpExpiresAt).getTime();
    const remaining = expires - now;

    if (remaining <= 0) return "Expired";

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Load initial status
  useEffect(() => {
    testGetStatus();
  }, []);

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-[#1D1D1D] to-black overflow-hidden">
      {/* Background Effects */}
      <ParticleBackground />

      {/* Cursor Glow Effect */}
      <CursorGlow />

      <div className="relative z-10 min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            variants={fadeInVariants}
            initial="hidden"
            animate="visible"
            className="text-center mb-8"
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
              <MessageCircle className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-pink-200 to-pink-600 bg-clip-text text-transparent pb-4">
              OTP Testing{" "}
              <span className="bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent">
                Page
              </span>
            </h1>
            <p className="text-base sm:text-lg text-gray-300">
              Test OTP functionality for Telegram integration
            </p>
          </motion.div>

          <div className="space-y-6">
            {/* Connection Guide Section */}
            <motion.div
              variants={fadeInVariants}
              initial="hidden"
              animate="visible"
              custom={0.05}
              className="rounded-3xl p-6 sm:p-8 shadow-2xl"
              style={{
                backgroundColor: "rgba(31, 31, 31, 0.3)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-pink-400" />
                How to Connect with Telegram
              </h3>

              <div className="space-y-4">
                {/* Step 1 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex gap-3"
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{
                      backgroundColor: "rgba(236, 72, 153, 0.2)",
                      color: "#EC4899",
                    }}
                  >
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-300">
                      Open Telegram on your device
                    </p>
                  </div>
                </motion.div>

                {/* Step 2 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex gap-3"
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{
                      backgroundColor: "rgba(236, 72, 153, 0.2)",
                      color: "#EC4899",
                    }}
                  >
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-300">
                      Invite Reeru Bot{" "}
                      <a
                        href="http://t.me/ReeruBot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-pink-400 hover:text-pink-300 transition-colors"
                      >
                        @ReeruBot
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </motion.div>

                {/* Step 3 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex gap-3"
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{
                      backgroundColor: "rgba(236, 72, 153, 0.2)",
                      color: "#EC4899",
                    }}
                  >
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-300">
                      Type{" "}
                      <code
                        className="px-2 py-1 rounded text-sm font-mono"
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.3)",
                          color: "#EC4899",
                        }}
                      >
                        /start
                      </code>{" "}
                      in the chat
                    </p>
                  </div>
                </motion.div>

                {/* Step 4 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex gap-3"
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{
                      backgroundColor: "rgba(236, 72, 153, 0.2)",
                      color: "#EC4899",
                    }}
                  >
                    4
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-300">
                      Send your ReeruAI registered email to the Telegram bot
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                      <Mail className="w-3 h-3" />
                      <span>Use the same email as your ReeruAI account</span>
                    </div>
                  </div>
                </motion.div>

                {/* Step 5 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex gap-3"
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{
                      backgroundColor: "rgba(236, 72, 153, 0.2)",
                      color: "#EC4899",
                    }}
                  >
                    5
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-300">
                      Return to this website and generate a 6-digit OTP code
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                      <Key className="w-3 h-3" />
                      <span>Click "Generate OTP" button below</span>
                    </div>
                  </div>
                </motion.div>

                {/* Step 6 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-3"
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{
                      backgroundColor: "rgba(236, 72, 153, 0.2)",
                      color: "#EC4899",
                    }}
                  >
                    6
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-300">
                      Send the OTP code to the bot on Telegram
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                      <Send className="w-3 h-3" />
                      <span>Your account will be connected automatically</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Bot Link Button */}
              <motion.a
                href="http://t.me/ReeruBot"
                target="_blank"
                rel="noopener noreferrer"
                variants={scaleVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
                className="w-full mt-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-semibold"
                style={{
                  boxShadow: "0 10px 30px rgba(59, 130, 246, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 15px 40px rgba(59, 130, 246, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 10px 30px rgba(59, 130, 246, 0.3)";
                }}
              >
                <MessageCircle className="w-4 h-4" />
                Open Reeru Bot
                <ExternalLink className="w-4 h-4" />
              </motion.a>
            </motion.div>

            {/* Current Status */}
            <motion.div
              variants={fadeInVariants}
              initial="hidden"
              animate="visible"
              custom={0.1}
              className="rounded-3xl p-6 sm:p-8 shadow-2xl"
              style={{
                backgroundColor: "rgba(31, 31, 31, 0.3)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-pink-400" />
                Current Status
              </h3>

              {otpStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Connected:</span>
                    <span
                      className={
                        otpStatus.isConnected
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {otpStatus.isConnected ? "✅ Yes" : "❌ No"}
                    </span>
                  </div>

                  {otpStatus.telegramUsername && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Username:</span>
                      <span className="text-white">
                        @{otpStatus.telegramUsername}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Active OTP:</span>
                    <span
                      className={
                        otpStatus.hasActiveOTP
                          ? "text-green-400"
                          : "text-gray-500"
                      }
                    >
                      {otpStatus.hasActiveOTP ? "✅ Yes" : "❌ No"}
                    </span>
                  </div>

                  {otpStatus.hasActiveOTP && otpStatus.otpCode && (
                    <div
                      className="rounded-xl p-4"
                      style={{
                        backgroundColor: "rgba(236, 72, 153, 0.1)",
                        border: "1px solid rgba(236, 72, 153, 0.3)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-pink-400 font-semibold">
                          OTP Code:
                        </span>
                        <motion.button
                          variants={scaleVariants}
                          initial="idle"
                          whileHover="hover"
                          whileTap="tap"
                          onClick={copyOTP}
                          className="p-2 rounded-lg transition-all"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(255, 255, 255, 0.2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(255, 255, 255, 0.1)";
                          }}
                        >
                          {copied ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </motion.button>
                      </div>
                      <code
                        className="text-xl font-mono text-white block px-3 py-2 rounded-lg"
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.3)",
                          backdropFilter: "blur(10px)",
                          WebkitBackdropFilter: "blur(10px)",
                        }}
                      >
                        {otpStatus.otpCode}
                      </code>
                      <div className="text-sm text-gray-400 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires in: {getRemainingTime()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400">Loading status...</div>
              )}

              <motion.button
                variants={scaleVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
                onClick={testGetStatus}
                disabled={isLoading}
                className="w-full mt-4 text-white px-4 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.2)";
                    e.currentTarget.style.border =
                      "1px solid rgba(214, 140, 184, 0.5)";
                    e.currentTarget.style.boxShadow =
                      "0 0 20px rgba(214, 140, 184, 0.2)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.border =
                    "1px solid rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh Status
              </motion.button>
            </motion.div>

            {/* OTP Actions */}
            <motion.div
              variants={fadeInVariants}
              initial="hidden"
              animate="visible"
              custom={0.2}
              className="rounded-3xl p-6 sm:p-8 shadow-2xl"
              style={{
                backgroundColor: "rgba(31, 31, 31, 0.3)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Hash className="w-5 h-5 text-pink-400" />
                OTP Actions
              </h3>

              <div className="space-y-3">
                <motion.button
                  variants={scaleVariants}
                  initial="idle"
                  whileHover={isGenerating ? "idle" : "hover"}
                  whileTap={isGenerating ? "idle" : "tap"}
                  onClick={testGenerateOTP}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-4 rounded-xl font-semibold shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    boxShadow: "0 10px 30px rgba(236, 72, 153, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isGenerating) {
                      e.currentTarget.style.boxShadow =
                        "0 15px 40px rgba(236, 72, 153, 0.4)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 10px 30px rgba(236, 72, 153, 0.3)";
                  }}
                >
                  {isGenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageCircle className="w-4 h-4" />
                  )}
                  Generate OTP
                </motion.button>

                <motion.button
                  variants={scaleVariants}
                  initial="idle"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={testCancelOTP}
                  className="w-full text-white px-4 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(239, 68, 68, 0.2)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 30px rgba(239, 68, 68, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(239, 68, 68, 0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Cancel OTP
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
