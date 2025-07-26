import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { StreamingProgressProps } from "@/types";

export const StreamingProgress: React.FC<StreamingProgressProps> = ({
  message,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="bg-[#2A2A2A] rounded-2xl p-8"
  >
    <div className="flex items-center justify-center mb-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
        className="w-16 h-16"
      >
        <Sparkles className="w-full h-full text-[#D68CB8]" />
      </motion.div>
    </div>
    <AnimatePresence mode="wait">
      <motion.p
        key={message}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="text-center text-gray-300 font-medium"
      >
        {message}
      </motion.p>
    </AnimatePresence>
  </motion.div>
);
