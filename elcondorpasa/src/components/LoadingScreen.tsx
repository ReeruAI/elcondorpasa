"use client";
import { useEffect, useState } from "react";

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
      className={`fixed inset-0 z-999 flex items-center justify-center
         transition-all duration-500 ${
           isLoading
             ? "opacity-100 translate-y-0"
             : "opacity-0 -translate-y-full pointer-events-none"
         }`}
      style={{ background: "#1D1D1D" }}
    >
      <div className="text-center w-full max-w-xs px-8">
        {/* Logo and Text Container */}
        <div className="mb-8 h-24 relative">
          {/* Container that holds both logo and text */}
          <div className="flex items-center justify-center h-full">
            {/* SVG Logo with slide from top animation */}
            <div
              className={`transition-all duration-700 ease-out ${
                logoAnimated
                  ? "translate-y-0 opacity-100"
                  : "-translate-y-20 opacity-0"
              }`}
            >
              <svg
                width="60"
                height="60"
                viewBox="0 0 60 60"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Black background rounded square */}
                <rect
                  x="0"
                  y="0"
                  width="60"
                  height="60"
                  rx="12"
                  ry="12"
                  fill="black"
                />

                {/* Abstract 'R' shape */}
                <path d="M18 18 L18 42 L30 30 L18 30 Z" fill="white" />

                {/* Play triangle */}
                <polygon points="34,25 44,30 34,35" fill="white" />
              </svg>
            </div>

            {/* Text with slide from right animation */}
            <div
              className={`transition-all duration-700 ease-out ml-4 ${
                textAnimated ? "opacity-100" : "opacity-0"
              }`}
              style={{
                transform: textAnimated ? "translateX(0)" : "translateX(80px)",
              }}
            >
              <h2 className="text-3xl font-bold text-white">
                <span className="text-[#D68CB8]">Reeru</span> AI
              </h2>
            </div>
          </div>
        </div>

        {/* iOS Style Progress Bar */}
        <div className="relative w-full">
          {/* Background track */}
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            {/* Progress fill */}
            <div
              className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
              style={{
                width: `${progress}%`,
                boxShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
              }}
            />
          </div>

          {/* Progress percentage */}
          {/* <p className="text-white/60 text-sm mt-3">{Math.round(progress)}%</p> */}
        </div>
      </div>
    </div>
  );
}
