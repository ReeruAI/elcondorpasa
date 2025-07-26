"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, Sparkles, X, User, LogOut, Coins } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

// Debounce hook for optimized scroll handling
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

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
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userTokens, setUserTokens] = useState<number>(0);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const authCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedTokens = useRef(false);

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

  // Optimized token fetching with error handling
  const fetchUserTokens = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingTokens || hasLoadedTokens.current) return;

    try {
      setIsLoadingTokens(true);
      const response = await axios.get("/api/profile", {
        withCredentials: true,
        timeout: 5000,
      });

      if (response.data?.success && response.data?.user) {
        setUserTokens(response.data.user.reeruToken || 0);
        hasLoadedTokens.current = true;
      }
    } catch (error) {
      console.error("Error fetching user tokens:", error);
      setUserTokens(0);
    } finally {
      setIsLoadingTokens(false);
    }
  }, [isLoadingTokens]);

  // Optimized auth checking with cleanup
  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = getAuthStatus();
      const wasLoggedIn = isLoggedIn;
      setIsLoggedIn(isAuthenticated);

      // Reset token loaded flag if user logged out
      if (wasLoggedIn && !isAuthenticated) {
        hasLoadedTokens.current = false;
      }
    };

    checkAuth();

    // Only check every 5 seconds instead of every second
    authCheckInterval.current = setInterval(checkAuth, 5000);

    const handleFocus = () => checkAuth();
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      if (authCheckInterval.current) {
        clearInterval(authCheckInterval.current);
      }
    };
  }, [getAuthStatus, isLoggedIn]);

  // Fetch tokens when login status changes
  useEffect(() => {
    if (isLoggedIn && !hasLoadedTokens.current) {
      fetchUserTokens();
    } else if (!isLoggedIn) {
      setUserTokens(0);
      hasLoadedTokens.current = false;
    }
  }, [isLoggedIn, fetchUserTokens]);

  // Optimized scroll handler with debouncing
  const debouncedScrollY = useDebounce(lastScrollY, 100);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (debouncedScrollY > lastScrollY && debouncedScrollY > 100) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }, [debouncedScrollY, lastScrollY]);

  // Handle outside clicks
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
      setUserTokens(0);
      hasLoadedTokens.current = false;
      router.push("/login");
    }
  }, [router]);

  // Simplified token display component
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
      <span className="text-gray-300 font-medium">
        {isLoadingTokens ? "..." : userTokens.toLocaleString()}
      </span>
    </motion.div>
  );

  return (
    <nav
      className={`fixed w-full backdrop-blur-md transition-transform duration-300 z-50 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
      style={{ backgroundColor: "rgba(29,29,29,0.95)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 md:h-24">
          {/* Logo */}
          <div className="flex items-center">
            <a
              href="/"
              onClick={(e) => handleNavClick(e, "/")}
              className="flex items-center space-x-2"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 180 }}
                transition={{ duration: 0.3 }}
                className="text-[#D68CB8]"
              >
                <Sparkles className="w-8 h-8 md:w-10 md:h-10" />
              </motion.div>
              <span className="font-bold text-xl md:text-2xl text-white">
                Reeru AI
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:border-b-2 hover:border-[#D68CB8] transition-all duration-200"
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
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-pink-300 to-pink-400 hover:shadow-lg hover:shadow-pink-500/30 transition-all duration-200"
                  >
                    <User className="w-5 h-5 text-gray-900" />
                  </motion.button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-black-900 border border-black-700"
                      >
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:bg-black-800 hover:text-white transition-colors rounded-lg"
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
                className="px-6 py-2.5 bg-gradient-to-r from-pink-300 to-pink-400 rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300"
              >
                Get Started
              </ScaleButton>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500"
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
              style={{ backgroundColor: "rgb(29,29,29)" }}
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="block px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}

              <div className="pt-2 border-t border-gray-700">
                {isLoggedIn ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-pink-300 to-pink-400 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-900" />
                        </div>
                        <TokenDisplay compact />
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <ScaleButton
                    onClick={handleGetStarted}
                    className="w-full px-6 py-2.5 bg-gradient-to-r from-pink-300 to-pink-400 rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300"
                  >
                    Get Started
                  </ScaleButton>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
