import { motion } from "framer-motion";
import { Link, Zap, Loader2, CheckCircle } from "lucide-react";
import { useState, useRef, MouseEvent } from "react";

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
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-3xl p-8 sm:p-10 mb-12 shadow-2xl relative overflow-hidden"
      style={{
        backgroundColor: "rgba(31, 31, 31, 0.2)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cursor glow effect */}
      <div
        className="absolute pointer-events-none transition-opacity duration-500"
        style={{
          width: "500px",
          height: "500px",
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
          transform: "translate(-50%, -50%)",
          opacity: isHovered ? 0.7 : 0,
          background: `radial-gradient(circle at center,
            rgba(236, 72, 153, 0.15) 0%,
            rgba(168, 85, 247, 0.12) 25%,
            rgba(236, 72, 153, 0.08) 50%,
            transparent 70%)`,
          filter: "blur(60px)",
          zIndex: 0,
        }}
      />

      {/* Content wrapper with higher z-index */}
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-600/20">
            <Link className="w-6 h-6 text-pink-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Generate from YouTube URL
          </h2>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube URL here..."
              className="w-full px-6 py-4 rounded-2xl text-white placeholder-gray-400 focus:outline-none transition-all duration-300"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
              }}
              onFocus={(e) => {
                e.target.style.border = "1px solid rgba(214, 140, 184, 0.5)";
                e.target.style.boxShadow = "0 0 20px rgba(214, 140, 184, 0.2)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1px solid rgba(255, 255, 255, 0.1)";
                e.target.style.boxShadow = "none";
              }}
              required
              disabled={isProcessing}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              whileHover={{ scale: isProcessing ? 1 : 1.02 }}
              whileTap={{ scale: isProcessing ? 1 : 0.98 }}
              type="submit"
              disabled={isLoading || isProcessing}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl font-semibold text-white shadow-lg hover:shadow-pink-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : isProcessing ? (
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

            {onCheckProgress && isProcessing && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onCheckProgress}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-lg"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.15)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 30px rgba(255, 255, 255, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                <CheckCircle className="w-5 h-5" />
                <span>Check Progress</span>
              </motion.button>
            )}
          </div>

          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl"
              style={{
                backgroundColor: "rgba(251, 191, 36, 0.1)",
                border: "1px solid rgba(251, 191, 36, 0.2)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
              }}
            >
              <p className="text-sm text-yellow-400 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                A video is currently being processed. You can check its progress
                or close this window.
              </p>
            </motion.div>
          )}
        </form>
      </div>
    </motion.div>
  );
};
