"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BiMenu } from "react-icons/bi";
import { RiNextjsFill } from "react-icons/ri";
import { IoClose } from "react-icons/io5";

export default function Navbar() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateNavbarVisibility = () => {
      const currentScrollY = window.scrollY;
      const halfViewport = window.innerHeight / 2; // Half viewport height

      // Hide navbar when scrolled down more than half viewport
      if (currentScrollY > halfViewport && currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Show navbar when scrolling up
        setIsVisible(true);
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateNavbarVisibility);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/contact", label: "Contact" },
  ];

  const isActiveLink = (href: string) => {
    return pathname === href;
  };

  return (
    <>
      <nav
        className={`fixed w-full backdrop-blur-md transition-transform duration-300 z-50 ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{ backgroundColor: "rgb(29,29,29)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 md:h-24">
            {" "}
            {/* Increased height */}
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <RiNextjsFill className="text-5xl md:text-6xl text-white hover:text-gray-300 transition-colors" />
                <span className="font-bold text-xl md:text-2xl hidden sm:block text-white">
                  YourBrand
                </span>
              </Link>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 text-base font-medium transition-all duration-200 ${
                    isActiveLink(link.href)
                      ? "text-blue-400 border-b-2 border-blue-400"
                      : "text-gray-300 hover:text-white hover:border-b-2 hover:border-gray-300"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <IoClose className="h-7 w-7" />
                ) : (
                  <BiMenu className="h-7 w-7" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen
              ? "max-h-screen opacity-100"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div
            className="px-2 pt-2 pb-3 space-y-1 shadow-lg"
            style={{ backgroundColor: "rgb(29,29,29)" }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-3 rounded-md text-base font-medium transition-colors duration-200 ${
                  isActiveLink(link.href)
                    ? "text-white bg-blue-600"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from hiding under fixed navbar */}
      <div className="h-20 md:h-24"></div>
    </>
  );
}
