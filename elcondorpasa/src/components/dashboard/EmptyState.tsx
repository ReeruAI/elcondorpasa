import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useRef, MouseEvent } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl p-10 sm:p-12 text-center relative overflow-hidden"
      style={{
        backgroundColor: "rgba(31, 31, 31, 0.2)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cursor glow effect */}
      <div
        className="absolute pointer-events-none transition-opacity duration-300"
        style={{
          width: "400px",
          height: "400px",
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
          transform: "translate(-50%, -50%)",
          opacity: isHovered ? 0.6 : 0,
          background: `radial-gradient(circle at center,
            rgba(168, 85, 247, 0.2) 0%,
            rgba(236, 72, 153, 0.15) 30%,
            transparent 60%)`,
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />

      {/* Content with higher z-index */}
      <div className="relative z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(214, 140, 184, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Icon className="w-10 h-10 text-pink-400" />
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold mb-3 text-white"
        >
          {title}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-300 leading-relaxed"
        >
          {description}
        </motion.p>
      </div>
    </motion.div>
  );
};
