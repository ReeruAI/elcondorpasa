import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number;
  message: string;
  status?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  message,
  status,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "from-green-500 to-green-400";
      case "error":
        return "from-red-500 to-red-400";
      case "processing":
        return "from-pink-500 to-purple-600";
      default:
        return "from-pink-500 to-purple-600";
    }
  };

  const getGlowColor = () => {
    switch (status) {
      case "completed":
        return "rgba(34, 197, 94, 0.4)"; // green-500
      case "error":
        return "rgba(239, 68, 68, 0.4)"; // red-500
      case "processing":
        return "rgba(236, 72, 153, 0.4)"; // pink-500
      default:
        return "rgba(236, 72, 153, 0.4)";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return "✓";
      case "error":
        return "✕";
      case "processing":
        return "•";
      default:
        return "•";
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <motion.p
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-sm text-gray-200 font-medium"
        >
          {message}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <span className="text-sm font-bold text-white">{progress}%</span>
          {status && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`text-xs font-bold ${
                status === "completed"
                  ? "text-green-400"
                  : status === "error"
                  ? "text-red-400"
                  : "text-pink-400"
              }`}
            >
              {getStatusIcon()}
            </motion.span>
          )}
        </motion.div>
      </div>

      {/* Progress bar container with glass effect */}
      <div
        className="w-full rounded-full h-3 overflow-hidden relative"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Animated glow effect */}
        <motion.div
          className="absolute inset-0"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            background: `linear-gradient(90deg, transparent, ${getGlowColor()}, transparent)`,
            transform: `translateX(${progress - 100}%)`,
          }}
        />

        {/* Progress fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${getStatusColor()} rounded-full relative overflow-hidden`}
          style={{
            boxShadow: `0 0 20px ${getGlowColor()}`,
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0"
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div
              className="w-1/3 h-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                transform: "skewX(-20deg)",
              }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Progress indicator dots */}
      <div className="flex justify-center gap-1 mt-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              status === "completed"
                ? "bg-green-400"
                : status === "error"
                ? "bg-red-400"
                : "bg-pink-400"
            }`}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
};
