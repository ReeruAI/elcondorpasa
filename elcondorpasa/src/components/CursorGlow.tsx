// components/CursorGlow.tsx
import React, { useEffect, useState } from "react";

const CursorGlow: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Use clientX/clientY for viewport-relative positioning
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30"
      style={{
        overflow: "hidden",
      }}
    >
      <div
        className="absolute transition-opacity duration-300"
        style={{
          width: "600px",
          height: "600px",
          left: `${mousePosition.x - 300}px`, // Center by subtracting half the width
          top: `${mousePosition.y - 300}px`, // Center by subtracting half the height
          opacity: isVisible ? 1 : 0,
          background: `radial-gradient(circle at center,
            rgba(168, 85, 247, 0.12) 0%,
            rgba(236, 72, 153, 0.12) 25%,
            rgba(168, 85, 247, 0.08) 50%,
            transparent 70%)`,
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default CursorGlow;
