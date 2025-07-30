import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";

export const PreferenceSetup: React.FC = () => {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-3xl p-10 sm:p-12 text-center shadow-2xl"
      style={{
        backgroundColor: "rgba(31, 31, 31, 0.2)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      {/* Icon Container with Animation */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="relative inline-block mb-6"
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(214, 140, 184, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 8px 32px rgba(214, 140, 184, 0.3)",
          }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Settings className="w-10 h-10 text-pink-400" />
          </motion.div>
        </div>

        {/* Floating particles */}
        <motion.div
          className="absolute -top-2 -right-2 w-3 h-3 bg-pink-400 rounded-full"
          animate={{
            y: [-5, -10, -5],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-400 rounded-full"
          animate={{
            y: [5, 10, 5],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
      </motion.div>

      {/* Title with gradient */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold mb-4 text-white"
      >
        Set Your Preferences
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-gray-300 mb-8 max-w-md mx-auto leading-relaxed text-lg"
      >
        To get personalized AI video recommendations, please set up your content
        preferences first.
      </motion.p>

      {/* CTA Button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push("/preferences")}
        className="px-10 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl font-semibold text-white shadow-lg hover:shadow-pink-500/30 transition-all duration-300 text-lg"
        style={{
          boxShadow: "0 4px 15px rgba(214, 140, 184, 0.4)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            "0 8px 30px rgba(214, 140, 184, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            "0 4px 15px rgba(214, 140, 184, 0.4)";
        }}
      >
        Set Your Preferences
      </motion.button>
    </motion.div>
  );
};
