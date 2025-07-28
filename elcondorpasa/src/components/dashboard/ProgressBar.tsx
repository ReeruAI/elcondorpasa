import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number;
  message: string;
  status?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  message,
  status,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "from-green-500 to-green-400";
      case "error":
        return "from-red-500 to-red-400";
      case "processing":
        return "from-[#D68CB8] to-pink-400";
      default:
        return "from-[#D68CB8] to-pink-400";
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-gray-300">{message}</p>
        <span className="text-sm text-gray-400">{progress}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${getStatusColor()} rounded-full`}
        />
      </div>
    </div>
  );
};
