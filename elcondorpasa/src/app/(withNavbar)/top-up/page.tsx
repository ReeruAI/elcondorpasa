"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Sparkles,
  Zap,
  Crown,
  Check,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { useTokens } from "@/components/Navbar"; // Import the token hook
import ParticleBackground from "@/components/yourclip/ParticleBackground";
import CursorGlow from "@/components/CursorGlow"; // Import CursorGlow

interface SnapCallbacks {
  onSuccess?: (result: SnapResult) => void;
  onPending?: (result: SnapResult) => void;
  onError?: (result: SnapResult) => void;
  onClose?: () => void;
}

interface Snap {
  pay: (token: string, callbacks?: SnapCallbacks) => void;
}

declare global {
  interface Window {
    snap: Snap;
  }
}

// Types
interface Package {
  id: string;
  name: string;
  price: number;
  reeruToken: number;
  popular?: boolean;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
  features: string[];
}

interface MidtransResponse {
  message: string;
  data: {
    token: string;
    redirect_url: string;
    order_id: string;
    transaction_id: string;
    package: {
      name: string;
      price: number;
      reeruToken: number;
    };
  };
}

interface SnapResult {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
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

// Package data
const packages: Package[] = [
  {
    id: "68838f3c3d6a8b11084c7f7a",
    name: "Starter",
    price: 25000,
    reeruToken: 1,
    icon: Sparkles,
    color: "from-blue-400 to-blue-600",
    bgGradient: "bg-blue-500/10",
    features: ["1 Reeru Token", "Basic features", "24/7 Support"],
  },
  {
    id: "68838f3c3d6a8b11084c7f7b",
    name: "Pro",
    price: 120000,
    reeruToken: 6,
    popular: true,
    icon: Zap,
    color: "from-[#D68CB8] to-pink-400",
    bgGradient: "bg-[#D68CB8]/10",
    features: [
      "6 Reeru Tokens",
      "All Pro features",
      "Priority support",
      "20% Bonus",
    ],
  },
  {
    id: "68838f3c3d6a8b11084c7f7c",
    name: "Studio",
    price: 225000,
    reeruToken: 10,
    icon: Crown,
    color: "from-purple-400 to-purple-600",
    bgGradient: "bg-purple-500/10",
    features: [
      "10 Reeru Tokens",
      "All Studio features",
      "Dedicated support",
      "Best value",
    ],
  },
];

// Reusable components
const FadeInView: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = "" }) => (
  <motion.div
    variants={fadeInVariants}
    initial="hidden"
    animate="visible"
    custom={delay}
    className={className}
  >
    {children}
  </motion.div>
);

const SuccessModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  packageName: string;
}> = ({ isOpen, onClose, packageName }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
        >
          <div className="bg-[#1D1D1D] border border-white/10 rounded-2xl p-8 shadow-2xl">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4"
              >
                <Check className="w-8 h-8 text-green-400" />
              </motion.div>

              <h3 className="text-2xl font-bold text-white mb-2">
                Top Up Successful!
              </h3>
              <p className="text-gray-400">
                Your {packageName} package has been activated successfully.
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-[#D68CB8] to-pink-400 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all duration-300"
              >
                Continue
              </motion.button>
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const PackageCard: React.FC<{
  pkg: Package;
  onSelect: (pkg: Package) => void;
  isLoading: boolean;
  delay: number;
}> = ({ pkg, onSelect, isLoading, delay }) => {
  const Icon = pkg.icon;

  return (
    <motion.div
      variants={fadeInVariants}
      initial="hidden"
      animate="visible"
      custom={delay}
      whileHover={{ y: -8 }}
      className="relative h-full"
    >
      {pkg.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <span className="bg-gradient-to-r from-[#D68CB8] to-pink-400 text-white text-xs font-bold px-3 py-1 rounded-full">
            MOST POPULAR
          </span>
        </div>
      )}

      <motion.div
        variants={scaleVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        className={`relative h-full bg-white/5 backdrop-blur-sm rounded-2xl p-6 border ${
          pkg.popular ? "border-[#D68CB8]/50" : "border-white/10"
        } cursor-pointer transition-all duration-300 hover:border-white/20 flex flex-col`}
        onClick={() => onSelect(pkg)}
      >
        <div
          className={`inline-flex items-center justify-center w-12 h-12 ${pkg.bgGradient} rounded-xl mb-4`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>

        <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>

        <div className="mb-6">
          <span className="text-3xl font-bold text-white">
            Rp {pkg.price.toLocaleString("id-ID")}
          </span>
        </div>

        <ul className="space-y-3 mb-6 flex-grow">
          {pkg.features.map((feature, index) => (
            <li key={index} className="flex items-start text-gray-300 text-sm">
              <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <button
          disabled={isLoading}
          className={`w-full py-3 px-4 bg-gradient-to-r ${pkg.color} text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-auto`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Select Package"
          )}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default function TopUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isSnapLoaded, setIsSnapLoaded] = useState(false);

  // Use the token context
  const { addTokens } = useTokens();

  // Load Midtrans Snap script with better error handling
  useEffect(() => {
    const loadMidtransScript = () => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="snap.js"]');
      if (existingScript) {
        // Check if snap is actually loaded
        if (window.snap && typeof window.snap.pay === "function") {
          setIsSnapLoaded(true);
        }
        return;
      }

      const script = document.createElement("script");
      const isProduction = process.env.NODE_ENV === "production";

      script.src = isProduction
        ? "https://app.sandbox.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js";

      const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

      if (!clientKey) {
        console.error("Midtrans client key is missing");
        setError("Payment configuration error. Please contact support.");
        return;
      }

      script.setAttribute("data-client-key", clientKey);
      script.async = true;
      script.id = "midtrans-snap-script";

      const timeout = setTimeout(() => {
        setError(
          "Payment system is taking too long to load. Please refresh the page."
        );
      }, 10000); // 10 second timeout

      script.onload = () => {
        clearTimeout(timeout);
        // console.log("Midtrans Snap loaded successfully");

        // Double check that window.snap is available
        if (window.snap && typeof window.snap.pay === "function") {
          setIsSnapLoaded(true);
          setError(""); // Clear any previous errors
        } else {
          console.error("Snap loaded but not available on window");
          setError("Payment system loaded but not initialized properly.");
        }
      };

      script.onerror = () => {
        clearTimeout(timeout);
        console.error("Failed to load Midtrans Snap");
        setError(
          "Failed to load payment system. Please check your internet connection and refresh the page."
        );
      };

      document.body.appendChild(script);
    };

    // Add a small delay to ensure the page is fully loaded
    const timer = setTimeout(loadMidtransScript, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Debug logging for production
  // useEffect(() => {
  //   if (process.env.NODE_ENV === "production") {
  //     console.log("Production environment check:", {
  //       hasClientKey: !!process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
  //       clientKeyLength:
  //         process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.length || 0,
  //       nodeEnv: process.env.NODE_ENV,
  //       snapLoaded: isSnapLoaded,
  //       windowSnapExists: !!window.snap,
  //       windowSnapPayExists: !!(window.snap && window.snap.pay),
  //     });
  //   }
  // }, [isSnapLoaded]);

  const checkTransactionStatus = useCallback(
    async (orderId: string, pkg: Package) => {
      let attempts = 0;
      const maxAttempts = 20;
      let intervalId: NodeJS.Timeout | null = null;

      const check = async () => {
        try {
          const statusResponse = await axios.get(
            `/api/transaction/status?orderId=${orderId}`,
            {
              timeout: 15000, // 15 second timeout
              validateStatus: (status) => status < 500, // Don't throw on 4xx errors
            }
          );

          if (statusResponse.status === 404) {
            // Transaction might not be created yet, keep checking
            if (attempts < 3) {
              attempts++;
              return;
            }
          }

          if (
            statusResponse.data.status === "paid" ||
            statusResponse.data.status === "settlement"
          ) {
            if (pkg.reeruToken) {
              addTokens(pkg.reeruToken);
            }
            setShowSuccess(true);
            setError("");
            if (intervalId) clearInterval(intervalId);
          } else if (
            statusResponse.data.status === "failed" ||
            statusResponse.data.status === "expired" ||
            statusResponse.data.status === "deny"
          ) {
            setError("Transaction was not completed. Please try again.");
            if (intervalId) clearInterval(intervalId);
          } else if (attempts >= maxAttempts) {
            setError(
              "Transaction verification timeout. Please check your payment status or contact support."
            );
            if (intervalId) clearInterval(intervalId);
          }

          attempts++;
        } catch (err) {
          console.error("Status check error:", err);
          attempts++;

          if (attempts >= maxAttempts) {
            setError(
              "Unable to verify payment status. Please contact support if you were charged."
            );
            if (intervalId) clearInterval(intervalId);
          }
        }
      };

      // Initial check after 3 seconds
      setTimeout(check, 3000);

      // Then check every 5 seconds
      intervalId = setInterval(check, 5000);

      // Clean up interval after max time
      setTimeout(() => {
        if (intervalId) clearInterval(intervalId);
      }, maxAttempts * 5000);
    },
    [addTokens]
  );

  const handlePackageSelect = useCallback(
    async (pkg: Package) => {
      if (!isSnapLoaded) {
        setError(
          "Payment system is still loading. Please wait a moment and try again."
        );
        return;
      }

      if (!window.snap || typeof window.snap.pay !== "function") {
        setError(
          "Payment system is not properly initialized. Please refresh the page."
        );
        return;
      }

      setIsLoading(true);
      setError("");
      setSelectedPackage(pkg);

      try {
        // Configure axios defaults for production
        const axiosConfig = {
          timeout: 30000, // 30 second timeout
          headers: {
            "Content-Type": "application/json",
          },
        };

        const response = await axios.post<MidtransResponse>(
          "/api/midtrans",
          { package_id: pkg.id },
          axiosConfig
        );

        if (
          !response.data ||
          !response.data.data ||
          !response.data.data.token
        ) {
          throw new Error("Invalid response from payment server");
        }

        const { token, order_id } = response.data.data;

        // Open Midtrans Snap popup
        window.snap.pay(token, {
          onSuccess: async function (result: SnapResult) {
            console.log("Payment success:", result);
            // Update tokens in the navbar immediately
            if (pkg.reeruToken) {
              addTokens(pkg.reeruToken);
            }
            setShowSuccess(true);
            setIsLoading(false);
            setError("");
          },
          onPending: function (result: SnapResult) {
            console.log("Payment pending:", result);
            setError("Payment is pending. Please complete your payment.");
            setIsLoading(false);

            // Start checking transaction status for pending payments
            checkTransactionStatus(order_id, pkg);
          },
          onError: function (result: SnapResult) {
            console.log("Payment error:", result);
            setError(
              result.status_message || "Payment failed. Please try again."
            );
            setIsLoading(false);
          },
          onClose: function () {
            // console.log("Payment popup closed");
            setIsLoading(false);

            // Check if payment was made even if popup was closed
            checkTransactionStatus(order_id, pkg);
          },
        });
      } catch (err) {
        console.error("Payment error details:", err);

        let errorMessage = "Failed to initiate payment. Please try again.";

        if (axios.isAxiosError(err)) {
          if (err.code === "ECONNABORTED") {
            errorMessage =
              "Request timeout. Please check your internet connection and try again.";
          } else if (err.response) {
            switch (err.response.status) {
              case 400:
                errorMessage =
                  "Invalid request. Please refresh the page and try again.";
                break;
              case 401:
                errorMessage = "Authentication error. Please refresh the page.";
                break;
              case 404:
                errorMessage =
                  "Payment service not found. Please contact support.";
                break;
              case 500:
              case 502:
              case 503:
                errorMessage =
                  "Server error. Please try again in a few moments.";
                break;
              default:
                errorMessage = err.response.data?.message || errorMessage;
            }
          } else if (err.request) {
            errorMessage =
              "Network error. Please check your internet connection.";
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        setIsLoading(false);
      }
    },
    [isSnapLoaded, addTokens, checkTransactionStatus]
  );

  useEffect(() => {
    const title = `ReeruAI - Top up`;
    document.title = title;
  }, []);

  return (
    <>
      <div className="min-h-screen relative bg-[#1D1D1D] overflow-hidden">
        {/* Background Effects */}
        <ParticleBackground />

        {/* Cursor Glow Effect */}
        <CursorGlow />

        {/* Main Content */}
        <div className="relative z-10 flex items-center justify-center pt-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl w-full">
            <FadeInView className="text-center mb-12">
              <div className="relative overflow-hidden lg:pt-16">
                <div className="absolute inset-0" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-pink-200 to-pink-600 bg-clip-text text-transparent pb-4">
                      Choose Your{" "}
                      <span className="bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent">
                        Package
                      </span>
                    </h1>
                    <p className="text-gray-400 text-lg">
                      Select the perfect package for your needs. All packages
                      include instant activation and 24/7 support.
                    </p>
                  </motion.div>
                </div>
              </div>
            </FadeInView>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md mx-auto mb-8 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl backdrop-blur-sm flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {!isSnapLoaded && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-md mx-auto mb-8 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-3 rounded-xl backdrop-blur-sm flex items-center gap-2"
              >
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                <span className="text-sm">Loading payment system...</span>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {packages.map((pkg, index) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  onSelect={handlePackageSelect}
                  isLoading={isLoading}
                  delay={0.1 * (index + 1)}
                />
              ))}
            </div>
          </div>
        </div>

        <SuccessModal
          isOpen={showSuccess}
          onClose={() => {
            setShowSuccess(false);
            setIsLoading(false);
            setSelectedPackage(null);
            setError("");
          }}
          packageName={selectedPackage?.name || ""}
        />
      </div>
    </>
  );
}
