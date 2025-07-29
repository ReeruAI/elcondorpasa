import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { StreamingProgressProps } from "@/types";

export const StreamingProgress: React.FC<StreamingProgressProps> = ({
  message,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="rounded-3xl p-10 sm:p-12 shadow-2xl"
    style={{
      backgroundColor: "rgba(31, 31, 31, 0.2)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    }}
  >
    <div className="flex items-center justify-center mb-8">
      <motion.div
        className="relative"
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(214, 140, 184, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 8px 32px rgba(214, 140, 184, 0.2)",
          }}
        >
          <Sparkles className="w-10 h-10 text-pink-400" />
        </div>

        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background:
              "radial-gradient(circle at center, rgba(214, 140, 184, 0.3) 0%, transparent 70%)",
            filter: "blur(20px)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
      </motion.div>
    </div>

    <AnimatePresence mode="wait">
      <motion.p
        key={message}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="text-center text-gray-200 font-medium text-lg leading-relaxed"
      >
        {message}
      </motion.p>
    </AnimatePresence>

    {/* Subtle animated dots */}
    <div className="flex justify-center gap-2 mt-6">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-pink-400 rounded-full"
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

    <style jsx>{`
      @keyframes pulse {
        0%,
        100% {
          opacity: 0.6;
          transform: scale(1);
        }
        50% {
          opacity: 0.8;
          transform: scale(1.1);
        }
      }
    `}</style>
  </motion.div>
);
