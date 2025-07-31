import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Zap, Loader2, Play } from "lucide-react";
import { ModalProps } from "@/types";

interface ExtendedModalProps extends ModalProps {
  isProcessing?: boolean;
}

export const VideoOptionsModal: React.FC<ExtendedModalProps> = ({
  isOpen,
  onClose,
  video,
  onGenerateClip,
  isProcessing = false,
}) => (
  <AnimatePresence>
    {isOpen && video && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="rounded-3xl p-8 max-w-md w-full shadow-2xl"
          style={{
            backgroundColor: "rgba(31, 31, 31, 0.4)",
            backdropFilter: "blur(30px)",
            WebkitBackdropFilter: "blur(30px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <motion.h3
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-white pr-4 mb-2"
              >
                {video.title}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm text-gray-300 flex items-center gap-2"
              >
                <Play className="w-3 h-3" />
                {video.channel}
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm text-gray-300 flex items-center gap-2 mt-2"
              >
                <Play className="w-3 h-3" />
                {video.description}
              </motion.p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-full transition-all duration-300 flex-shrink-0"
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

          {/* Divider */}
          <div
            className="h-px w-full mb-6"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
            }}
          />

          {/* Actions */}
          <div className="space-y-4">
            <motion.a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl transition-all duration-300 group"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
            >
              <ExternalLink className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
              <span className="font-medium text-gray-200 group-hover:text-white transition-colors">
                View on YouTube
              </span>
            </motion.a>

            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: isProcessing ? 1 : 1.02 }}
              whileTap={{ scale: isProcessing ? 1 : 0.98 }}
              onClick={() => {
                if (!isProcessing) {
                  onGenerateClip(video.url);
                  onClose();
                }
              }}
              disabled={isProcessing}
              className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg"
              style={{
                boxShadow: isProcessing
                  ? "none"
                  : "0 10px 30px rgba(236, 72, 153, 0.3)",
              }}
              onMouseEnter={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.boxShadow =
                    "0 15px 40px rgba(236, 72, 153, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.boxShadow =
                    "0 10px 30px rgba(236, 72, 153, 0.3)";
                }
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Generate Clips</span>
                </>
              )}
            </motion.button>

            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl mt-3"
                style={{
                  backgroundColor: "rgba(251, 191, 36, 0.1)",
                  border: "1px solid rgba(251, 191, 36, 0.2)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                }}
              >
                <p className="text-xs text-yellow-400 text-center flex items-center justify-center gap-2">
                  <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  A video is currently being processed
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
