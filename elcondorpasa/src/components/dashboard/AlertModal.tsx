// components/dashboard/AlertModal.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: "error" | "warning" | "info";
  showTopUpButton?: boolean;
}

export function AlertModal({
  isOpen,
  onClose,
  title = "Insufficient Tokens",
  message,
  type = "error",
  showTopUpButton = true,
}: AlertModalProps) {
  const router = useRouter();

  const handleTopUp = useCallback(() => {
    onClose();
    router.push("/top-up");
  }, [onClose, router]);

  const typeStyles = useMemo(() => {
    switch (type) {
      case "error":
        return {
          iconColor: "text-red-400",
          gradientColor: "from-red-500/20 to-pink-500/20",
        };
      case "warning":
        return {
          iconColor: "text-yellow-400",
          gradientColor: "from-yellow-500/20 to-orange-500/20",
        };
      case "info":
        return {
          iconColor: "text-blue-400",
          gradientColor: "from-blue-500/20 to-cyan-500/20",
        };
      default:
        return {
          iconColor: "text-red-400",
          gradientColor: "from-red-500/20 to-pink-500/20",
        };
    }
  }, [type]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={onClose}
          >
            <div
              className="relative w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative rounded-2xl p-6 shadow-2xl alert-modal-bg">
                {/* Gradient background effect */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-black/30 to-transparent opacity-30`}
                />

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>

                {/* Content */}
                <div className="relative">
                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <div
                      className={`p-3 rounded-full bg-gradient-to-br ${typeStyles.gradientColor}`}
                    >
                      <AlertCircle
                        className={`w-8 h-8 ${typeStyles.iconColor}`}
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-center text-white mb-3">
                    {title}
                  </h3>

                  {/* Message */}
                  <p className="text-gray-300 text-center mb-6">{message}</p>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {showTopUpButton && (
                      <button
                        onClick={handleTopUp}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-pink-500/30 transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        Top Up Tokens
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className={`${
                        showTopUpButton ? "flex-1" : "w-full"
                      } px-6 py-3 rounded-xl font-semibold text-gray-300 glass-button hover:bg-white/20 transform hover:-translate-y-0.5 transition-all duration-200`}
                    >
                      {showTopUpButton ? "Cancel" : "OK"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
