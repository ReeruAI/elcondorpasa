import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu,
  Sparkles,
  X,
  User,
  LogOut,
  LayoutDashboard,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function NavbarLanding() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  interface ScaleButtonProps
    extends React.ComponentProps<typeof motion.button> {
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

  const navLinks = [
    { href: "#home", label: "Home" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#showcase", label: "Showcase" },
    { href: "#pricing", label: "Pricing" },
    { href: "#features", label: "Features" },
  ];

  // Function to check auth status
  const getAuthStatus = (): boolean => {
    if (typeof window === "undefined") return false;
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("isLoggedIn="))
        ?.split("=")[1] === "true"
    );
  };

  // Check cookies for auth status
  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = getAuthStatus();
      console.log("NavbarLanding: Rendered with isLoggedIn =", isAuthenticated);
      setIsLoggedIn(isAuthenticated);
    };

    checkAuth();
    // Check auth status when component mounts and when focus returns to window
    window.addEventListener("focus", checkAuth);

    // Also check when cookies might change
    const interval = setInterval(checkAuth, 1000); // Check every second

    return () => {
      window.removeEventListener("focus", checkAuth);
      clearInterval(interval);
    };
  }, []);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  const handleRegister = () => {
    router.push("/register");
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleLogin = () => {
    router.push("/login");
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleDashboard = () => {
    router.push("/dashboard");
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      setIsLoggedIn(false);
      setIsDropdownOpen(false);
      setIsMobileMenuOpen(false);

      // Optionally show a success message if you have a toast system
      // showToast.success("Logout successful");

      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggedIn(false);
      setIsDropdownOpen(false);
      setIsMobileMenuOpen(false);
      router.push("/login");
    }
  };

  return (
    <>
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
                href="#home"
                onClick={(e) => handleNavClick(e, "#home")}
                className="flex items-center space-x-2"
              >
                <motion.div
                  whileHover={{ scale: 1.2 }}
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
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="px-4 py-2 text-base font-medium text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  {link.label}
                </Link>
              ))}

              {/* User Dropdown - Always show user icon */}
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
                      {isLoggedIn ? (
                        <>
                          <button
                            onClick={handleDashboard}
                            className="flex items-center w-full px-4 py-3 text-sm text-gray-200 hover:bg-white/10 hover:text-white transition-colors rounded-t-lg"
                          >
                            <LayoutDashboard className="w-4 h-4 mr-3" />
                            Dashboard
                          </button>
                          <div className="border-t border-white/10"></div>
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-3 text-sm text-gray-200 hover:bg-white/10 hover:text-white transition-colors rounded-b-lg"
                          >
                            <LogOut className="w-4 h-4 mr-3" />
                            Logout
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleRegister}
                            className="flex items-center w-full px-4 py-3 text-sm text-gray-200 hover:bg-white/10 hover:text-white transition-colors rounded-t-lg"
                          >
                            <UserPlus className="w-4 h-4 mr-3" />
                            Register
                          </button>
                          <div className="border-t border-white/10"></div>
                          <button
                            onClick={handleLogin}
                            className="flex items-center w-full px-4 py-3 text-sm text-gray-200 hover:bg-white/10 hover:text-white transition-colors rounded-b-lg"
                          >
                            <LogIn className="w-4 h-4 mr-3" />
                            Log In
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="block px-3 py-3 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-2 border-t border-white/10">
                  {isLoggedIn ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 px-3 py-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#ec4899] to-[#a855f3] flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-gray-200">
                          Hello, User!
                        </span>
                      </div>
                      <button
                        onClick={handleDashboard}
                        className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 mr-3" />
                        Dashboard
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={handleRegister}
                        className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <UserPlus className="w-4 h-4 mr-3" />
                        Register
                      </button>
                      <button
                        onClick={handleLogin}
                        className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <LogIn className="w-4 h-4 mr-3" />
                        Log In
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
