"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Sparkles, X, User, LogOut, Coins } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { clearUserRecommendationData } from "@/app/(withNavbar)/dashboard/page";

// Token context for global state management
import { createContext, useContext } from "react";
import Link from "next/link";
import Image from "next/image";

interface TokenContextType {
  tokens: number;
  updateTokens: (newTokens: number) => void;
  addTokens: (amount: number) => void;
  refreshTokens: () => Promise<void>;
  isLoading: boolean;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedTokens = useRef(false);

  const refreshTokens = useCallback(async () => {
    if (isLoading || !document.cookie.includes("isLoggedIn=true")) return;

    try {
      setIsLoading(true);
      const response = await axios.get("/api/profile", {
        withCredentials: true,
        timeout: 5000,
      });

      if (response.data?.success && response.data?.user) {
        setTokens(response.data.user.reeruToken || 0);
        hasLoadedTokens.current = true;
      }
    } catch (error) {
      console.error("Error fetching user tokens:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const updateTokens = useCallback((newTokens: number) => {
    setTokens(newTokens);
  }, []);

  const addTokens = useCallback((amount: number) => {
    setTokens((prev) => prev + amount);
  }, []);

  // Initial load
  useEffect(() => {
    if (
      !hasLoadedTokens.current &&
      document.cookie.includes("isLoggedIn=true")
    ) {
      refreshTokens();
    }
  }, [refreshTokens]);

  return (
    <TokenContext.Provider
      value={{ tokens, updateTokens, addTokens, refreshTokens, isLoading }}
    >
      {children}
    </TokenContext.Provider>
  );
}

export const useTokens = () => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error("useTokens must be used within TokenProvider");
  }
  return context;
};

// Scale button component
interface ScaleButtonProps extends React.ComponentProps<typeof motion.button> {
  children: React.ReactNode;
  className?: string;
}

const ScaleButton: React.FC<ScaleButtonProps> = ({
  children,
  className = "",
  ...props
}) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={className}
    {...props}
  >
    {children}
  </motion.button>
);

export default function Navbar() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollRef = useRef(0);

  // Use token context
  const {
    tokens: userTokens,
    isLoading: isLoadingTokens,
    refreshTokens,
  } = useTokens();

  const navLinks = useMemo(
    () => [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/your-clip", label: "Your-clip" },
      { href: "/telegram-service", label: "Telegram Service" },
      { href: "/top-up", label: "Top-up" },
    ],
    []
  );

  // Optimized auth status check
  const getAuthStatus = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    try {
      const cookies = document.cookie.split("; ");
      const authCookie = cookies.find((row) => row.startsWith("isLoggedIn="));
      return authCookie?.split("=")[1] === "true";
    } catch {
      return false;
    }
  }, []);

  // Optimized scroll handler - fixes blinking
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Clear any existing timeout
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }

          // Only hide navbar when scrolling down past threshold
          if (currentScrollY > lastScrollRef.current && currentScrollY > 100) {
            setIsVisible(false);
          } else if (
            currentScrollY < lastScrollRef.current ||
            currentScrollY <= 100
          ) {
            setIsVisible(true);
          }

          lastScrollRef.current = currentScrollY;
          setScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Auth checking
  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = getAuthStatus();
      setIsLoggedIn(isAuthenticated);
    };

    checkAuth();

    // Check auth status on tab focus
    const handleFocus = () => checkAuth();
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [getAuthStatus]);

  // Handle outside clicks for dropdown
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault();
      router.push(href);
      setIsMobileMenuOpen(false);
    },
    [router]
  );

  const handleGetStarted = useCallback(() => {
    router.push("/register");
  }, [router]);

  const handleLogout = useCallback(async () => {
    try {
      // Clear user-specific recommendation data
      clearUserRecommendationData();

      // Dispatch logout event for any components listening
      window.dispatchEvent(new Event("userLogout"));

      // Call logout API
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggedIn(false);
      setIsDropdownOpen(false);
      setIsMobileMenuOpen(false);
      router.push("/login");
    }
  }, [router]);

  // Token display component
  const TokenDisplay = ({ compact = false }: { compact?: boolean }) => (
    <motion.div
      className={`flex items-center space-x-2 ${
        compact ? "text-sm" : "text-base"
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: isLoadingTokens ? 360 : 0 }}
          transition={{
            duration: 1,
            repeat: isLoadingTokens ? Infinity : 0,
            ease: "linear",
          }}
        >
          <Coins
            className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-pink-400`}
          />
        </motion.div>
      </div>
      <span className="text-gray-200 font-medium">
        {isLoadingTokens ? "..." : userTokens.toLocaleString()}
      </span>
    </motion.div>
  );

  return (
    <motion.nav
      initial={false}
      animate={{
        transform: isVisible ? "translateY(0%)" : "translateY(-100%)",
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      className="fixed w-full z-50"
      style={{
        backgroundColor: "rgba(29, 29, 29, 0.1)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 md:h-24">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/dashboard"
              onClick={(e) => handleNavClick(e, "/dashboard")}
              className="flex items-center space-x-2"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="text-[#D68CB8]"
              >
                <Image
                  src="/logo.svg"
                  alt="Reeru AI Logo"
                  width={100}
                  height={100}
                  priority
                  className="w-15 h-15 md:w-15 md:h-15 lg:w-20 lg:h-20"
                />
              </motion.div>
              <span className="font-bold text-xl md:text-2xl bg-gradient-to-r from-[#ec4899] to-[#a855f3] bg-clip-text text-transparent">
                ReeruAI
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-4 py-2 text-base font-medium text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                {link.label}
              </a>
            ))}

            {isLoggedIn ? (
              <div className="flex items-center space-x-6">
                <TokenDisplay />

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <motion.button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-[#ec4899] to-[#a855f3] hover:shadow-lg hover:shadow-pink-500/30 transition-all duration-200"
                  >
                    <User className="w-5 h-5 text-white" />
                  </motion.button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg"
                        style={{
                          backgroundColor: "rgba(31, 31, 31, 0.7)",
                          backdropFilter: "blur(20px)",
                          WebkitBackdropFilter: "blur(20px)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-200 hover:bg-white/10 hover:text-white transition-colors rounded-lg"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <ScaleButton
                onClick={handleGetStarted}
                className="px-6 py-2.5 bg-gradient-to-r from-[#D68CB8] to-pink-400 rounded-full font-semibold text-sm text-white hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300"
              >
                Get Started
              </ScaleButton>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-200 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/20"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-7 w-7" />
              ) : (
                <Menu className="h-7 w-7" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden"
          >
            <div
              className="px-2 pt-2 pb-3 space-y-1 shadow-lg"
              style={{
                backgroundColor: "rgba(29, 29, 29, 0.1)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="block px-3 py-3 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  {link.label}
                </a>
              ))}

              <div className="pt-2 border-t border-white/10">
                {isLoggedIn ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#ec4899] to-[#a855f3] flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <TokenDisplay compact />
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <ScaleButton
                    onClick={handleGetStarted}
                    className="w-full px-6 py-2.5 bg-gradient-to-r from-[#D68CB8] to-pink-400 rounded-full font-semibold text-sm text-white hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300"
                  >
                    Get Started
                  </ScaleButton>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
