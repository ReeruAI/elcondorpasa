// components/PageHeader.tsx
import React from "react";
import { motion } from "framer-motion";

const PageHeader: React.FC = () => {
  return (
    <div className="relative overflow-hidden lg:pt-16">
      <div className="absolute inset-0" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
            Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-pink-400">
              Clips
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            All your AI-generated viral shorts in one place
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default PageHeader;
