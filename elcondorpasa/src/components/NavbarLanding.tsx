import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Menu, Sparkles, X } from "lucide-react";

export default function NavbarLanding() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

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

  return (
    <>
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
                href="#home"
                onClick={(e) => handleNavClick(e, "#home")}
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
              <ScaleButton className="px-6 py-2.5 bg-gradient-to-r from-pink-300 to-pink-400 rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300">
                Get Started
              </ScaleButton>
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
        <motion.div
          initial={false}
          animate={{
            height: isMobileMenuOpen ? "auto" : 0,
            opacity: isMobileMenuOpen ? 1 : 0,
          }}
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
            <div className="pt-2">
              <ScaleButton className="w-full px-6 py-2.5 bg-gradient-to-r from-pink-300 to-pink-400 rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300">
                Get Started
              </ScaleButton>
            </div>
          </div>
        </motion.div>
      </nav>
    </>
  );
}
