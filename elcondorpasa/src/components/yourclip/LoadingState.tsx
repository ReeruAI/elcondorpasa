// components/LoadingState.tsx
import React from "react";
import { Loader2 } from "lucide-react";

const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh]">
      <Loader2 className="w-12 h-12 animate-spin text-pink-500 mb-4" />
      <p className="text-gray-400 animate-pulse">
        Loading your masterpieces...
      </p>
    </div>
  );
};

export default LoadingState;
