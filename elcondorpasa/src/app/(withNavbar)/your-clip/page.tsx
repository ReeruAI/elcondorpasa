// page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { VideoShort } from "@/types"; // Adjust the import path as necessary
import { useUserShorts } from "@/hooks/useUserShorts"; // Adjust the import path as necessary
import PageHeader from "../../../components/yourclip/PageHeader"; // Adjust the import path as necessary
import VideoGrid from "../../../components/yourclip/VideoGrid";
import VideoModal from "../../../components/yourclip/VideoModal";
import LoadingState from "../../../components/yourclip/LoadingState";
import EmptyState from "../../../components/yourclip/EmptyState";
import ParticleBackground from "@/components/yourclip/ParticleBackground";
import CursorGlow from "@/components/CursorGlow";

export default function YourClipsPage() {
  const { shorts, isLoading } = useUserShorts();
  const [selectedVideo, setSelectedVideo] = useState<VideoShort | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Handle YouTube OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("youtube") === "connected") {
      console.log("YouTube connected successfully!");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleVideoClick = useCallback((video: VideoShort) => {
    setSelectedVideo(video);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedVideo(null);
  }, []);

  useEffect(() => {
    const title = `ReeruAI - Your Clips`;
    document.title = title;
  }, []);

  return (
    <>
      <VideoModal
        isOpen={showModal}
        onClose={handleCloseModal}
        video={selectedVideo}
      />

      <div className="min-h-screen relative">
        {/* Particle Background */}
        <ParticleBackground />

        {/* Cursor Glow Effect */}
        <CursorGlow />

        {/* Main Content */}
        <div className="relative z-10">
          <PageHeader />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            {isLoading ? (
              <LoadingState />
            ) : shorts.length === 0 ? (
              <EmptyState />
            ) : (
              <VideoGrid videos={shorts} onVideoClick={handleVideoClick} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
