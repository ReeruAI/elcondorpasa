import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";

export const PreferenceSetup: React.FC = () => {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#2A2A2A] rounded-2xl p-8 text-center"
    >
      <Settings className="w-16 h-16 text-[#D68CB8] mx-auto mb-4" />
      <h3 className="text-2xl font-bold mb-3">Set Your Preferences</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        To get personalized AI video recommendations, please set up your content
        preferences first.
      </p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push("/preferences")}
        className="px-8 py-3 bg-gradient-to-r from-[#D68CB8] to-pink-400 rounded-xl font-semibold hover:shadow-lg hover:shadow-pink-500/25 transition-all duration-300"
      >
        Set Your Preferences
      </motion.button>
    </motion.div>
  );
};
