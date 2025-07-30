"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShow, setShouldShow] = useState(true);
  const [progress, setProgress] = useState(0);
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [textAnimated, setTextAnimated] = useState(false);

  useEffect(() => {
    // Check if this is the first visit
    const hasVisited = sessionStorage.getItem("hasVisited");

    if (hasVisited === "true") {
      // Optional: Skip loading screen for returning visitors
      // setShouldShow(false);
      // setIsLoading(false);
      // return;
    }

    // Set the flag for future visits
    sessionStorage.setItem("hasVisited", "true");

    // Start logo animation
    setTimeout(() => {
      setLogoAnimated(true);
      // Start text animation after logo
      setTimeout(() => {
        setTextAnimated(true);
      }, 400);
    }, 100);

    // Animate progress bar
    const duration = 1000; // 2 seconds total
    const interval = 20; // Update every 20ms
    const increment = 100 / (duration / interval);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(progressTimer);
          // Start hiding the loading screen
          setTimeout(() => {
            setIsLoading(false);
            setTimeout(() => {
              setShouldShow(false);
            }, 500);
          }, 200);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(progressTimer);
  }, []);

  if (!shouldShow) return null;

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-center justify-center
         transition-all duration-500 ${
           isLoading
             ? "opacity-100 translate-y-0"
             : "opacity-0 -translate-y-full pointer-events-none"
         }`}
      style={{
        background: "linear-gradient(to bottom, #1D1D1D, #000000)",
      }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-pink-400/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <div className="text-center w-full max-w-xs px-8 relative z-10">
        {/* Logo and Text Container */}
        <div className="mb-12 h-24 relative">
          {/* Container that holds both logo and text */}
          <div className="flex items-center justify-center h-full">
            {/* Logo with glass background */}
            <motion.div
              className={`transition-all duration-700 ease-out relative ${
                logoAnimated
                  ? "translate-y-0 opacity-100"
                  : "-translate-y-20 opacity-0"
              }`}
            >
              <div
                className="absolute inset-0 w-20 h-20 rounded-full -z-10"
                style={{
                  background: "linear-gradient(135deg, #ec4899, #a855f3)",
                  filter: "blur(20px)",
                  opacity: 0.5,
                }}
              />
              <div
                className="p-3 rounded-2xl"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <Image
                  src="/logo.svg"
                  alt="Reeru AI Logo"
                  width={60}
                  height={60}
                  priority
                />
              </div>
            </motion.div>

            {/* Text with gradient animation */}
            <div
              className={`transition-all duration-700 ease-out ml-4 ${
                textAnimated ? "opacity-100" : "opacity-0"
              }`}
              style={{
                transform: textAnimated ? "translateX(0)" : "translateX(80px)",
              }}
            >
              <h2 className="text-3xl font-bold">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                  Reeru
                </span>
                <span className="text-white"> AI</span>
              </h2>
            </div>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="relative w-full">
          {/* Glass container for progress bar */}
          <div
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            {/* Progress track */}
            <div
              className="w-full h-1.5 rounded-full overflow-hidden relative"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              }}
            >
              {/* Animated glow effect */}
              <div
                className="absolute inset-0 opacity-50"
                style={{
                  background: `linear-gradient(90deg, transparent ${
                    progress - 10
                  }%, rgba(236, 72, 153, 0.5) ${progress}%, transparent ${
                    progress + 10
                  }%)`,
                  filter: "blur(4px)",
                }}
              />

              {/* Progress fill */}
              <div
                className="h-full rounded-full transition-all duration-100 ease-linear relative"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #ec4899, #a855f3)",
                  boxShadow: "0 0 20px rgba(236, 72, 153, 0.5)",
                }}
              >
                {/* Shimmer effect */}
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%)",
                    animation: "shimmer 1s infinite",
                  }}
                />
              </div>
            </div>

            {/* Progress text */}
            <div className="mt-3 flex justify-between items-center">
              <p className="text-xs text-gray-400">Loading magic...</p>
              <p className="text-xs text-pink-400 font-medium">
                {Math.round(progress)}%
              </p>
            </div>
          </div>
        </div>

        {/* Loading tips */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: progress > 50 ? 0.7 : 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs text-gray-400 mt-8"
        >
          Preparing your video editing workspace...
        </motion.p>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
}
