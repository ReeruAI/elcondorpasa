"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function Loading() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      style={{
        background: "linear-gradient(to bottom, #1D1D1D, #000000)",
      }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-pink-400/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
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
            <div className="relative">
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
            </div>

            {/* Text with gradient */}
            <div className="ml-4">
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
        <p className="text-xs text-gray-400 mt-8 opacity-70">
          Preparing your video editing workspace...
        </p>
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

        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.2;
          }
          90% {
            opacity: 0.2;
          }
          100% {
            transform: translateY(-100px) translateX(20px);
            opacity: 0;
          }
        }

        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
}
