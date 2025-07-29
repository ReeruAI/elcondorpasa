// File: app/test-otp/page.tsx
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
  User,
  Mail,
  Hash,
  Send,
  Trash2,
} from "lucide-react";

interface OTPStatus {
  isConnected: boolean;
  telegramUsername?: string;
  hasActiveOTP: boolean;
  otpCode?: string;
  otpExpiresAt?: string;
}

interface TestResult {
  type: "success" | "error" | "info";
  message: string;
  data?: any;
}

export default function OTPTestPage() {
  const [otpStatus, setOtpStatus] = useState<OTPStatus | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [copied, setCopied] = useState(false);

  // Test form data
  const [testOTP, setTestOTP] = useState("");
  const [testChatId, setTestChatId] = useState("123456789");
  const [testTelegramName, setTestTelegramName] = useState("Test User");
  const [testTelegramUsername, setTestTelegramUsername] = useState("testuser");

  // Email linking test data
  const [testEmail, setTestEmail] = useState("");

  const addTestResult = (result: TestResult) => {
    setTestResults((prev) => [result, ...prev].slice(0, 10)); // Keep last 10 results
  };

  // 1. Test Generate OTP
  const testGenerateOTP = async () => {
    setIsGenerating(true);
    addTestResult({ type: "info", message: "🔄 Testing Generate OTP..." });

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
        setTestOTP(response.data.data.otpCode); // Auto-fill for testing

        addTestResult({
          type: "success",
          message: "✅ Generate OTP Success!",
          data: response.data,
        });
      } else {
        addTestResult({
          type: "error",
          message: `❌ Generate Failed: ${response.data.message}`,
          data: response.data,
        });
      }
    } catch (error: any) {
      console.error("Generate OTP error:", error);
      addTestResult({
        type: "error",
        message: `❌ Generate Error: ${
          error.response?.data?.message || error.message
        }`,
        data: error.response?.data,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Test Get OTP Status
  const testGetStatus = async () => {
    setIsLoading(true);
    addTestResult({ type: "info", message: "🔄 Testing Get OTP Status..." });

    try {
      const response = await axios.get("/api/telegram/generate-otp");

      if (response.data.success) {
        setOtpStatus(response.data.data);
        addTestResult({
          type: "success",
          message: "✅ Get Status Success!",
          data: response.data,
        });
      } else {
        addTestResult({
          type: "error",
          message: `❌ Get Status Failed: ${response.data.message}`,
          data: response.data,
        });
      }
    } catch (error: any) {
      console.error("Get status error:", error);
      addTestResult({
        type: "error",
        message: `❌ Get Status Error: ${
          error.response?.data?.message || error.message
        }`,
        data: error.response?.data,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Test Verify OTP
  const testVerifyOTP = async () => {
    if (!testOTP || !testChatId || !testTelegramName) {
      addTestResult({
        type: "error",
        message: "❌ Please fill all required fields for verification",
      });
      return;
    }

    addTestResult({ type: "info", message: "🔄 Testing Verify OTP..." });

    try {
      const response = await axios.post("/api/telegram/verify-otp", {
        otpCode: testOTP,
        chatId: parseInt(testChatId),
        telegramName: testTelegramName,
        telegramUsername: testTelegramUsername,
      });

      if (response.data.success) {
        addTestResult({
          type: "success",
          message: "✅ Verify OTP Success! Account Linked!",
          data: response.data,
        });
        // Refresh status after successful verification
        await testGetStatus();
      } else {
        addTestResult({
          type: "error",
          message: `❌ Verify Failed: ${response.data.message}`,
          data: response.data,
        });
      }
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      addTestResult({
        type: "error",
        message: `❌ Verify Error: ${
          error.response?.data?.message || error.message
        }`,
        data: error.response?.data,
      });
    }
  };

  // 6. Test Email → OTP Flow (NEW)
  const testEmailOTPFlow = async () => {
    if (!testEmail || !testChatId || !testTelegramName) {
      addTestResult({
        type: "error",
        message:
          "❌ Please fill email, chat ID, and Telegram name for email-OTP flow",
      });
      return;
    }

    addTestResult({
      type: "info",
      message: "🔄 Testing Email → OTP Flow (Step 1: Email)...",
    });

    try {
      // Step 1: Initiate email linking
      const response = await axios.post(
        "/api/telegram/initiate-email-linking",
        {
          email: testEmail,
          chatId: parseInt(testChatId),
          telegramName: testTelegramName,
          telegramUsername: testTelegramUsername,
        }
      );

      if (response.data.success) {
        addTestResult({
          type: "success",
          message: "✅ Step 1 Success! Email verified, now send OTP...",
          data: response.data,
        });

        // Show instructions for step 2
        addTestResult({
          type: "info",
          message:
            '📝 Step 2: Go to dashboard → Generate OTP → Input OTP in form above → Click "Test Complete Email-OTP Flow"',
        });
      } else {
        addTestResult({
          type: "error",
          message: `❌ Step 1 Failed: ${response.data.message}`,
          data: response.data,
        });
      }
    } catch (error: any) {
      console.error("Email-OTP initiate error:", error);
      addTestResult({
        type: "error",
        message: `❌ Step 1 Error: ${
          error.response?.data?.message || error.message
        }`,
        data: {
          errorCode: error.response?.data?.errorCode,
          ...error.response?.data,
        },
      });
    }
  };

  // 7. Test Complete Email-OTP Flow (Step 2)
  const testCompleteEmailOTP = async () => {
    if (!testOTP || !testChatId) {
      addTestResult({
        type: "error",
        message: "❌ Please fill OTP and chat ID to complete email-OTP flow",
      });
      return;
    }

    addTestResult({
      type: "info",
      message: "🔄 Testing Email → OTP Flow (Step 2: Complete)...",
    });

    try {
      const response = await axios.post(
        "/api/telegram/complete-email-linking",
        {
          otpCode: testOTP,
          chatId: parseInt(testChatId),
        }
      );

      if (response.data.success) {
        addTestResult({
          type: "success",
          message: "✅ Email → OTP Flow Complete! Account Linked!",
          data: response.data,
        });
        // Refresh status after successful linking
        await testGetStatus();
      } else {
        addTestResult({
          type: "error",
          message: `❌ Step 2 Failed: ${response.data.message}`,
          data: response.data,
        });
      }
    } catch (error: any) {
      console.error("Email-OTP complete error:", error);
      addTestResult({
        type: "error",
        message: `❌ Step 2 Error: ${
          error.response?.data?.message || error.message
        }`,
        data: error.response?.data,
      });
    }
  };
  const testEmailLinking = async () => {
    if (!testEmail || !testChatId || !testTelegramName) {
      addTestResult({
        type: "error",
        message:
          "❌ Please fill email, chat ID, and Telegram name for email linking",
      });
      return;
    }

    addTestResult({ type: "info", message: "🔄 Testing Email Linking..." });

    try {
      const response = await axios.post("/api/telegram/link-by-email", {
        email: testEmail,
        chatId: parseInt(testChatId),
        telegramName: testTelegramName,
        telegramUsername: testTelegramUsername,
      });

      if (response.data.success) {
        addTestResult({
          type: "success",
          message: "✅ Email Linking Success! Account Linked!",
          data: response.data,
        });
        // Refresh status after successful linking
        await testGetStatus();
      } else {
        addTestResult({
          type: "error",
          message: `❌ Email Linking Failed: ${response.data.message}`,
          data: response.data,
        });
      }
    } catch (error: any) {
      console.error("Email linking error:", error);
      addTestResult({
        type: "error",
        message: `❌ Email Linking Error: ${
          error.response?.data?.message || error.message
        }`,
        data: {
          errorCode: error.response?.data?.errorCode,
          ...error.response?.data,
        },
      });
    }
  };
  const testCancelOTP = async () => {
    addTestResult({ type: "info", message: "🔄 Testing Cancel OTP..." });

    try {
      const response = await axios.delete("/api/telegram/generate-otp");

      if (response.data.success) {
        addTestResult({
          type: "success",
          message: "✅ Cancel OTP Success!",
          data: response.data,
        });
        // Refresh status after cancellation
        await testGetStatus();
      } else {
        addTestResult({
          type: "error",
          message: `❌ Cancel Failed: ${response.data.message}`,
          data: response.data,
        });
      }
    } catch (error: any) {
      console.error("Cancel OTP error:", error);
      addTestResult({
        type: "error",
        message: `❌ Cancel Error: ${
          error.response?.data?.message || error.message
        }`,
        data: error.response?.data,
      });
    }
  };

  // Copy OTP to clipboard
  const copyOTP = async () => {
    if (otpStatus?.otpCode) {
      try {
        await navigator.clipboard.writeText(otpStatus.otpCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        addTestResult({
          type: "success",
          message: "📋 OTP copied to clipboard!",
        });
      } catch (error) {
        addTestResult({ type: "error", message: "❌ Failed to copy OTP" });
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

  // Clear test results
  const clearResults = () => {
    setTestResults([]);
  };

  // Load initial status
  useEffect(() => {
    testGetStatus();
  }, []);

  return (
    <div className="min-h-screen bg-[#1D1D1D] py-12 px-4">
      <div className="max-w-6xl mx-auto">
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
            Test all OTP functionality for Telegram integration
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Controls */}
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

            {/* Email Linking Test */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#D68CB8]" />
                Test Email Linking
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[#D68CB8] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Chat ID
                  </label>
                  <input
                    type="text"
                    value={testChatId}
                    onChange={(e) => setTestChatId(e.target.value)}
                    placeholder="123456789"
                    className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[#D68CB8] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Telegram Name
                  </label>
                  <input
                    type="text"
                    value={testTelegramName}
                    onChange={(e) => setTestTelegramName(e.target.value)}
                    placeholder="Test User"
                    className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[#D68CB8] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Telegram Username (Optional)
                  </label>
                  <input
                    type="text"
                    value={testTelegramUsername}
                    onChange={(e) => setTestTelegramUsername(e.target.value)}
                    placeholder="testuser"
                    className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[#D68CB8] focus:outline-none"
                  />
                </div>

                <button
                  onClick={testEmailOTPFlow}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Step 1: Test Email → OTP Flow
                </button>

                <button
                  onClick={testCompleteEmailOTP}
                  className="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Step 2: Complete Email-OTP Flow
                </button>

                <div className="border-t border-white/20 pt-4">
                  <button
                    onClick={testEmailLinking}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Test Direct Email Linking (Old)
                  </button>
                </div>
              </div>
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

            {/* Verification Test */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-[#D68CB8]" />
                Test Verification
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    OTP Code
                  </label>
                  <input
                    type="text"
                    value={testOTP}
                    onChange={(e) => setTestOTP(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[#D68CB8] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Chat ID
                  </label>
                  <input
                    type="text"
                    value={testChatId}
                    onChange={(e) => setTestChatId(e.target.value)}
                    placeholder="123456789"
                    className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[#D68CB8] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Telegram Name
                  </label>
                  <input
                    type="text"
                    value={testTelegramName}
                    onChange={(e) => setTestTelegramName(e.target.value)}
                    placeholder="Test User"
                    className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[#D68CB8] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Telegram Username (Optional)
                  </label>
                  <input
                    type="text"
                    value={testTelegramUsername}
                    onChange={(e) => setTestTelegramUsername(e.target.value)}
                    placeholder="testuser"
                    className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[#D68CB8] focus:outline-none"
                  />
                </div>

                <button
                  onClick={testVerifyOTP}
                  className="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Test Verify OTP
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Test Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#D68CB8]" />
                Test Results
              </h3>
              <button
                onClick={clearResults}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No test results yet. Run some tests!
                </div>
              ) : (
                testResults.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border ${
                      result.type === "success"
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : result.type === "error"
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    }`}
                  >
                    <div className="text-sm font-medium">{result.message}</div>
                    {result.data && (
                      <details className="mt-2 text-xs opacity-75">
                        <summary className="cursor-pointer">
                          Show details
                        </summary>
                        <pre className="mt-1 bg-black/20 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-3">
            📋 Testing Instructions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <h4 className="text-white font-medium mb-2">Backend Testing:</h4>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Click "Generate OTP" to create a new OTP</li>
                <li>Check that OTP appears in Current Status</li>
                <li>Copy the OTP code for testing</li>
                <li>Fill verification form with test data</li>
                <li>
                  Click "Test Verify OTP" to simulate Telegram verification
                </li>
              </ol>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">
                Telegram Bot Testing:
              </h4>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Generate OTP from this page</li>
                <li>Go to your Telegram bot</li>
                <li>Send the 6-digit OTP code</li>
                <li>Bot should respond with success message</li>
                <li>Refresh status here to see connection</li>
              </ol>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
