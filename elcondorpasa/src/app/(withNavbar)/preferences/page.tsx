"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios, { AxiosError } from "axios";
import {
  Monitor,
  FlaskConical,
  Trophy,
  Vote,
  DollarSign,
  Film,
  Brain,
  Newspaper,
  Gamepad2,
  Church,
  UtensilsCrossed,
  Laugh,
  X,
  Check,
  Sparkles,
  Globe,
} from "lucide-react";
import CursorGlow from "@/components/CursorGlow"; // Import CursorGlow
import ParticleBackground from "@/components/yourclip/ParticleBackground"; // Import ParticleBackground

// Configure axios defaults
axios.defaults.withCredentials = true;

// Types
interface PreferenceItem {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

interface LanguageOption {
  id: string;
  name: string;
  nativeName: string;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  preference: PreferenceItem | null;
  language: LanguageOption | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

interface PreferenceApiResponse {
  success: boolean;
  modifiedCount?: string;
  error?: string;
}

// Constants
const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    id: "English",
    name: "English",
    nativeName: "English",
  },
  {
    id: "Indonesia",
    name: "Indonesian",
    nativeName: "Indonesia",
  },
];

const PREFERENCE_ITEMS: PreferenceItem[] = [
  {
    id: "tech",
    name: "Tech",
    description: "Technology and innovation content",
    icon: Monitor,
    color: "from-blue-500 to-cyan-400",
  },
  {
    id: "science",
    name: "Science",
    description: "Scientific discoveries and research",
    icon: FlaskConical,
    color: "from-green-500 to-emerald-400",
  },
  {
    id: "sports",
    name: "Sports",
    description: "Athletic competitions and news",
    icon: Trophy,
    color: "from-orange-500 to-yellow-400",
  },
  {
    id: "politics",
    name: "Politics",
    description: "Political news and discussions",
    icon: Vote,
    color: "from-red-500 to-pink-400",
  },
  {
    id: "finance",
    name: "Finance",
    description: "Financial markets and economics",
    icon: DollarSign,
    color: "from-purple-500 to-indigo-400",
  },
  {
    id: "entertainment",
    name: "Entertainment",
    description: "Movies, shows, and celebrity news",
    icon: Film,
    color: "from-pink-500 to-rose-400",
  },
  {
    id: "psychology",
    name: "Psychology",
    description: "Mental health and behavioral science",
    icon: Brain,
    color: "from-teal-500 to-cyan-400",
  },
  {
    id: "news",
    name: "News",
    description: "Breaking news and current events",
    icon: Newspaper,
    color: "from-gray-600 to-gray-400",
  },
  {
    id: "esports",
    name: "Esports",
    description: "Competitive gaming and tournaments",
    icon: Gamepad2,
    color: "from-violet-500 to-purple-400",
  },
  {
    id: "religion",
    name: "Religion",
    description: "Spiritual and religious content",
    icon: Church,
    color: "from-amber-600 to-orange-400",
  },
  {
    id: "food",
    name: "Food",
    description: "Culinary experiences and recipes",
    icon: UtensilsCrossed,
    color: "from-red-600 to-pink-500",
  },
  {
    id: "comedy",
    name: "Comedy",
    description: "Humor and entertainment content",
    icon: Laugh,
    color: "from-yellow-500 to-orange-400",
  },
];

const cardVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay },
  }),
  hover: {
    scale: 1.05,
    y: -5,
    transition: { duration: 0.2 },
  },
  tap: { scale: 0.95 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

// Preference Card Component with Glass Effect
const PreferenceCard: React.FC<{
  item: PreferenceItem;
  delay: number;
  onClick: () => void;
  disabled: boolean;
}> = ({ item, delay, onClick, disabled }) => {
  const { name, description, icon: Icon, color } = item;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={!disabled ? "hover" : undefined}
      whileTap={!disabled ? "tap" : undefined}
      custom={delay}
      onClick={!disabled ? onClick : undefined}
      className={`rounded-2xl p-6 group relative overflow-hidden flex flex-col h-full transition-all duration-300 ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
      style={{
        backgroundColor: "rgba(31, 31, 31, 0.2)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
      />

      <div className="relative z-10 flex flex-col h-full">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.2 }}
          className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${color} rounded-full mb-4 mx-auto shadow-lg`}
          style={{
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }}
        >
          <Icon className="w-8 h-8 text-white" />
        </motion.div>

        <div className="text-center flex-grow flex flex-col justify-center">
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-pink-300 transition-colors duration-300">
            {name}
          </h3>
          <p className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors duration-300">
            {description}
          </p>
        </div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: delay + 0.4 }}
          className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition-all duration-300 transform group-hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled}
        >
          Add to Favorites
        </motion.button>
      </div>
    </motion.div>
  );
};

// Confirmation Modal Component with Glass Effect
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  preference,
  language,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  if (!preference || !language) return null;

  const { name, icon: Icon, color } = preference;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onCancel}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
            style={{
              backgroundColor: "rgba(31, 31, 31, 0.7)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div
              className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${color} rounded-full mb-6 mx-auto shadow-lg`}
            >
              <Icon className="w-10 h-10 text-white" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-4">
              Set Your Preferences?
            </h3>
            <p className="text-gray-300 mb-2">
              <strong>Content:</strong> {name}
            </p>
            <p className="text-gray-300 mb-8">
              <strong>Language:</strong> {language.nativeName}
            </p>
            <p className="text-gray-400 mb-8">
              This will personalize your experience with {name.toLowerCase()}{" "}
              content in {language.nativeName}.
            </p>

            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "white",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.1)";
                }}
              >
                <X className="w-4 h-4" />
                No, Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Yes, Set it
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Main Component
export default function PreferencePage() {
  const [selectedPreference, setSelectedPreference] =
    useState<PreferenceItem | null>(null);
  const [selectedLanguage, setSelectedLanguage] =
    useState<LanguageOption | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handlePreferenceClick = useCallback(
    (item: PreferenceItem) => {
      if (!selectedLanguage) {
        setError("Please select a language first");
        setTimeout(() => setError(""), 3000);
        return;
      }
      setSelectedPreference(item);
      setIsModalOpen(true);
    },
    [selectedLanguage]
  );

  const handleConfirm = useCallback(async () => {
    if (!selectedPreference || !selectedLanguage) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.put<PreferenceApiResponse>(
        "/api/preferences",
        {
          contentPreference: selectedPreference.name,
          languagePreference: selectedLanguage.id,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        await router.push("/dashboard");
      } else {
        setError(response.data.error || "Failed to save preference");
        setIsModalOpen(false);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiErrorResponse>;

        if (axiosError.response?.status === 401) {
          await router.push("/login");
          return;
        }

        setError(
          axiosError.response?.data?.error ||
            axiosError.response?.data?.message ||
            "Failed to save preference"
        );
      } else {
        setError("An unexpected error occurred");
      }
      setIsModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPreference, selectedLanguage, router]);

  const handleCancel = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPreference(null);
  }, []);

  const handleLanguageSelect = useCallback((language: LanguageOption) => {
    setSelectedLanguage(language);
    setError("");
  }, []);

  const pathname = usePathname();
  useEffect(() => {
    const currentPath = pathname.split("/")[1];
    const title = `ReeruAI - ${
      currentPath.charAt(0).toUpperCase() + currentPath.slice(1)
    }`;
    document.title = title;
  }, [pathname]);

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-[#1D1D1D] to-black overflow-hidden">
      {/* Background Effects */}
      <ParticleBackground />

      {/* Cursor Glow Effect */}
      <CursorGlow />

      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full shadow-2xl"
              style={{
                boxShadow: "0 20px 40px rgba(236, 72, 153, 0.3)",
              }}
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-pink-200 to-pink-600 bg-clip-text text-transparent mb-4">
              Choose Your{" "}
              <span className="bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent">
                Preferences
              </span>
            </h1>
            <p className="text-lg text-gray-300 mb-2">
              Personalize your experience by selecting your preferred language
              and content type.
            </p>
            <p className="text-sm text-gray-400">
              First select a language, then choose your favorite content genre.
            </p>
          </motion.div>

          {/* Language Selection with Glass Effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto mb-12"
          >
            <div
              className="rounded-3xl p-8"
              style={{
                backgroundColor: "rgba(31, 31, 31, 0.2)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <h2 className="text-2xl font-bold text-white text-center mb-6 flex items-center justify-center gap-2">
                <Globe className="w-6 h-6 text-pink-400" />
                Select Your Language
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {LANGUAGE_OPTIONS.map((language, index) => (
                  <motion.button
                    key={language.id}
                    initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLanguageSelect(language)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      selectedLanguage?.id === language.id
                        ? "border-pink-400 bg-pink-400/20 text-white shadow-lg shadow-pink-500/20"
                        : "border-white/20 bg-white/5 text-gray-300 hover:border-pink-400/50 hover:text-white"
                    }`}
                    style={{
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                    }}
                  >
                    <div className="text-lg font-semibold">
                      {language.nativeName}
                    </div>
                    <div className="text-sm opacity-70">{language.name}</div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Error message with Glass Effect */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-md mx-auto mb-8 px-4 py-3 rounded-xl text-center"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#fca5a5",
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content Preference Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              Choose Your Favorite Content
            </h2>
            <p className="text-gray-300">
              {selectedLanguage
                ? `Select content type for ${selectedLanguage.nativeName} preference`
                : "Please select a language first"}
            </p>
          </motion.div>

          {/* Preference Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {PREFERENCE_ITEMS.map((item, index) => (
              <PreferenceCard
                key={item.id}
                item={item}
                delay={0.6 + index * 0.05}
                onClick={() => handlePreferenceClick(item)}
                disabled={!selectedLanguage}
              />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        preference={selectedPreference}
        language={selectedLanguage}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}
