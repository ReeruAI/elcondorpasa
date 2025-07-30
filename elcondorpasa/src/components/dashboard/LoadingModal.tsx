import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, X } from "lucide-react";
import { LoadingModalProps } from "@/types";
import { ProgressBar } from "./ProgressBar";

interface ExtendedLoadingModalProps extends LoadingModalProps {
  progress?: number;
  message?: string;
  status?: string;
  onClose?: () => void;
  canClose?: boolean;
}

export const LoadingModal: React.FC<ExtendedLoadingModalProps> = ({
  isOpen,
  progress = 0,
  message = "Our AI is analyzing the video and generating amazing shorts...",
  status = "processing",
  onClose,
  canClose = true,
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl"
          style={{
            backgroundColor: "rgba(31, 31, 31, 0.4)",
            backdropFilter: "blur(30px)",
            WebkitBackdropFilter: "blur(30px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
          }}
        >
          {canClose && onClose && (
            <div className="flex justify-end mb-4">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.1)";
                }}
              >
                <X className="w-5 h-5 text-gray-300" />
              </motion.button>
            </div>
          )}

          <div className="relative">
            {/* Glow effect behind icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-32 h-32 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(214, 140, 184, 0.3) 0%, transparent 70%)",
                  filter: "blur(30px)",
                  animation: "pulse 2s ease-in-out infinite",
                }}
              />
            </div>

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="relative w-24 h-24 mx-auto mb-8"
            >
              <div
                className="w-full h-full rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(214, 140, 184, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 8px 32px rgba(214, 140, 184, 0.3)",
                }}
              >
                <Sparkles className="w-12 h-12 text-pink-400" />
              </div>
            </motion.div>
          </div>

          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl font-bold mb-8 text-center text-white"
          >
            Creating Your Clips
          </motion.h3>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ProgressBar
              progress={progress}
              message={message}
              status={status}
            />
          </motion.div>

          {status === "completed" ? (
            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center text-green-400 mt-6 font-medium text-lg"
            >
              ✨ Successfully completed! Redirecting...
            </motion.p>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-3 mt-8 px-4 py-3 rounded-2xl"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <Loader2 className="w-5 h-5 animate-spin text-pink-400 flex-shrink-0" />
              <span className="text-sm text-gray-300 text-center">
                This may take up to 5 minutes depending on the video length.
              </span>
            </motion.div>
          )}
        </motion.div>

        <style jsx>{`
          @keyframes pulse {
            0%,
            100% {
              opacity: 0.6;
              transform: scale(1);
            }
            50% {
              opacity: 0.8;
              transform: scale(1.2);
            }
          }
        `}</style>
      </motion.div>
    )}
  </AnimatePresence>
);
