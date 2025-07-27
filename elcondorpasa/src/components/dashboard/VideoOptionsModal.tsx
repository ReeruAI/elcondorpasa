import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Zap, Loader2 } from "lucide-react";
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
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-[#2A2A2A] rounded-2xl p-6 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold pr-4">{video.title}</h3>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          <p className="text-sm text-gray-400 mb-6">{video.channel}</p>

          <div className="space-y-3">
            <motion.a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300"
            >
              <ExternalLink className="w-5 h-5" />
              <span className="font-medium">View on YouTube</span>
            </motion.a>

            <motion.button
              whileHover={{ scale: isProcessing ? 1 : 1.02 }}
              whileTap={{ scale: isProcessing ? 1 : 0.98 }}
              onClick={() => {
                if (!isProcessing) {
                  onGenerateClip(video.url);
                  onClose();
                }
              }}
              disabled={isProcessing}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-gradient-to-r from-[#D68CB8] to-pink-400 hover:shadow-lg hover:shadow-pink-500/25 rounded-xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
              <p className="text-xs text-yellow-400 text-center mt-2">
                A video is currently being processed
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
