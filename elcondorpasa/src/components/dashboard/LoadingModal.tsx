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
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#2A2A2A] rounded-2xl p-8 max-w-sm w-full mx-4"
        >
          {canClose && onClose && (
            <div className="flex justify-end mb-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          )}

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-6"
          >
            <Sparkles className="w-full h-full text-[#D68CB8]" />
          </motion.div>

          <h3 className="text-2xl font-bold mb-6 text-center">
            Creating Your Clips
          </h3>

          <ProgressBar progress={progress} message={message} status={status} />

          {status === "completed" ? (
            <p className="text-center text-green-400 mt-4">
              Successfully completed! Redirecting...
            </p>
          ) : (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Loader2 className="w-5 h-5 animate-spin text-[#D68CB8]" />
              <span className="text-sm text-gray-300">
                This may take up to 60 seconds
              </span>
            </div>
          )}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
