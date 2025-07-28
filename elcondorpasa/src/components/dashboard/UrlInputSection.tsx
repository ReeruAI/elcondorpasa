import { motion } from "framer-motion";
import { Link, Zap, Loader2, CheckCircle } from "lucide-react";

interface UrlInputSectionProps {
  url: string;
  setUrl: (url: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCheckProgress?: () => void;
  isProcessing?: boolean;
}

export const UrlInputSection: React.FC<UrlInputSectionProps> = ({
  url,
  setUrl,
  isLoading,
  onSubmit,
  onCheckProgress,
  isProcessing = false,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="bg-[#2A2A2A] rounded-2xl p-6 sm:p-8 mb-12"
  >
    <div className="flex items-center gap-3 mb-4">
      <Link className="w-6 h-6 text-[#D68CB8]" />
      <h2 className="text-xl sm:text-2xl font-semibold">
        Generate from YouTube URL
      </h2>
    </div>

    <form onSubmit={onSubmit} className="space-y-4">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste YouTube URL here..."
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D68CB8] focus:border-transparent transition-all duration-300"
        required
        disabled={isProcessing}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <motion.button
          whileHover={{ scale: isProcessing ? 1 : 1.02 }}
          whileTap={{ scale: isProcessing ? 1 : 0.98 }}
          type="submit"
          disabled={isLoading || isProcessing}
          className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#D68CB8] to-pink-400 rounded-xl font-semibold hover:shadow-lg hover:shadow-pink-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Generate Clips
            </>
          )}
        </motion.button>

        {onCheckProgress && isProcessing && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onCheckProgress}
            className="w-full sm:w-auto px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Check Progress
          </motion.button>
        )}
      </div>

      {isProcessing && (
        <p className="text-sm text-yellow-400 mt-2">
          A video is currently being processed. You can check its progress or
          close this window.
        </p>
      )}
    </form>
  </motion.div>
);
