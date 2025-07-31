"use client";

import { motion } from "framer-motion";

const Footer = () => {
  const socialLinks = [
    { id: 1, url: "https://www.instagram.com/haehikoo/", label: "Instagram 1" },
    { id: 2, url: "https://www.instagram.com/voyvoync/", label: "Instagram 2" },
    {
      id: 3,
      url: "https://www.instagram.com/ihsanibba/",
      label: "Instagram 3",
    },
  ];

  return (
    <footer className="relative z-10 mt-20 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        <div
          className="rounded-3xl p-6 shadow-2xl"
          style={{
            backgroundColor: "rgba(31, 31, 31, 0.3)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="text-center space-y-4">
            {/* Made with love */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-2 text-gray-300"
            >
              <span>Made with</span>
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-pink-500"
              >
                ❤️
              </motion.span>
              <span>by</span>
              <span className="font-semibold bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent">
                HCK-84
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-2 text-gray-300"
            >
              <span className="font-semibold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                Keep Running Forward, Viva El Condor Pasa!
              </span>
            </motion.div>

            {/* Copyright */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-gray-400"
            >
              © 2025 All rights reserved
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-1"
            >
              <span className="text-gray-400 text-sm mr-2">Follow us</span>
              <div className="flex gap-2">
                {socialLinks.map((link, index) => (
                  <motion.a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg transition-all duration-300 flex items-center justify-center"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(236, 72, 153, 0.2)";
                      e.currentTarget.style.boxShadow =
                        "0 0 20px rgba(236, 72, 153, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* Instagram SVG Icon */}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-300"
                    >
                      <rect
                        x="2"
                        y="2"
                        width="20"
                        height="20"
                        rx="5"
                        ry="5"
                      ></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;
