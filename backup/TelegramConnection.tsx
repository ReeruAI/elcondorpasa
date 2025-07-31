// File: components/dashboard/TelegramConnection.tsx
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
  AlertCircle,
} from "lucide-react";

interface OTPStatus {
  isConnected: boolean;
  telegramUsername?: string;
  hasActiveOTP: boolean;
  otpCode?: string;
  otpExpiresAt?: string;
}

interface OTPData {
  otpCode: string;
  expiresAt: string;
  instructions: string;
}

export default function TelegramConnection() {
  const [otpStatus, setOtpStatus] = useState<OTPStatus | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Fetch current status
  const fetchStatus = async () => {
    try {
      const response = await axios.get("/api/telegram/generate-otp");
      if (response.data.success) {
        setOtpStatus(response.data.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch OTP status:", error);
      if (error.response?.status !== 401) {
        setError("Failed to load connection status");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate new OTP
  const generateOTP = async () => {
    setIsGenerating(true);
    setError("");

    try {
      const response = await axios.post("/api/telegram/generate-otp");

      if (response.data.success) {
        // Refresh status to show new OTP
        await fetchStatus();
      } else {
        setError(response.data.message || "Failed to generate OTP");
      }
    } catch (error: any) {
      console.error("Failed to generate OTP:", error);
      setError(
        error.response?.data?.message ||
          "Failed to generate OTP. Please try again."
      );
    } finally {
      setIsGenerating(false);
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
        console.error("Failed to copy:", error);
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

  useEffect(() => {
    fetchStatus();

    // Auto-refresh every 10 seconds if has active OTP
    const interval = setInterval(() => {
      if (otpStatus?.hasActiveOTP) {
        fetchStatus();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [otpStatus?.hasActiveOTP]);

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="animate-pulse">
          <div className="h-4 bg-white/10 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
    >
      <div className="flex items-center gap-3 mb-4">
        <MessageCircle className="w-6 h-6 text-[#D68CB8]" />
        <h3 className="text-xl font-semibold text-white">
          Telegram Connection
        </h3>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}

      {otpStatus?.isConnected ? (
        // Connected State
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-green-400 font-semibold mb-2">✅ Connected!</p>
          <p className="text-gray-400 text-sm">
            Telegram: @{otpStatus.telegramUsername || "Connected"}
          </p>
        </div>
      ) : (
        // Not Connected State
        <div className="space-y-4">
          {otpStatus?.hasActiveOTP && otpStatus.otpCode ? (
            // Show Active OTP
            <div className="bg-[#D68CB8]/10 border border-[#D68CB8]/30 rounded-lg p-4">
              <div className="text-center mb-3">
                <p className="text-[#D68CB8] font-semibold mb-2">
                  Your OTP Code:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-2xl font-mono bg-white/10 px-4 py-2 rounded-lg text-white">
                    {otpStatus.otpCode}
                  </code>
                  <button
                    onClick={copyOTP}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-center text-sm text-gray-400">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-4 h-4" />
                  <span>Expires in: {getRemainingTime()}</span>
                </div>
                <p>Send this code to @ReeruBot on Telegram</p>
              </div>
            </div>
          ) : (
            // Generate OTP State
            <div className="text-center">
              <p className="text-gray-400 mb-4">
                Connect your Telegram account to receive notifications
              </p>

              <button
                onClick={generateOTP}
                disabled={isGenerating}
                className="bg-[#D68CB8] hover:bg-pink-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    Generate OTP Code
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 mt-3">
                OTP expires in 5 minutes
              </p>
            </div>
          )}

          <div className="border-t border-white/10 pt-4">
            <p className="text-sm text-gray-400 text-center">
              <strong>Instructions:</strong>
            </p>
            <ol className="text-xs text-gray-500 mt-2 space-y-1">
              <li>1. Click "Generate OTP Code" above</li>
              <li>2. Open Telegram and find @ReeruBot</li>
              <li>3. Send the 6-digit code to the bot</li>
              <li>4. Your account will be connected automatically</li>
            </ol>
          </div>
        </div>
      )}
    </motion.div>
  );
}
