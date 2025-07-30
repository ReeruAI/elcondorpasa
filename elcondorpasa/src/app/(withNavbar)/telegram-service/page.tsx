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
} from "lucide-react";

interface OTPStatus {
  isConnected: boolean;
  telegramUsername?: string;
  hasActiveOTP: boolean;
  otpCode?: string;
  otpExpiresAt?: string;
}

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
    <div className="min-h-screen bg-[#1D1D1D] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            🧪 OTP Testing Page
          </h1>
          <p className="text-gray-400">
            Test OTP functionality for Telegram integration
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Current Status */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#D68CB8]" />
              Current Status
            </h3>

            {otpStatus ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Connected:</span>
                  <span
                    className={
                      otpStatus.isConnected ? "text-green-400" : "text-red-400"
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
                  <div className="bg-[#D68CB8]/10 border border-[#D68CB8]/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#D68CB8] font-semibold">
                        OTP Code:
                      </span>
                      <button
                        onClick={copyOTP}
                        className="p-1 bg-white/10 hover:bg-white/20 rounded transition-colors"
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <code className="text-xl font-mono text-white block bg-black/20 px-3 py-2 rounded">
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

            <button
              onClick={testGetStatus}
              disabled={isLoading}
              className="w-full mt-4 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh Status
            </button>
          </motion.div>

          {/* OTP Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Hash className="w-5 h-5 text-[#D68CB8]" />
              OTP Actions
            </h3>

            <div className="space-y-3">
              <button
                onClick={testGenerateOTP}
                disabled={isGenerating}
                className="w-full bg-[#D68CB8] hover:bg-pink-400 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageCircle className="w-4 h-4" />
                )}
                Generate OTP
              </button>

              <button
                onClick={testCancelOTP}
                className="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Cancel OTP
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
