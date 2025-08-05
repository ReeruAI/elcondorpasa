"use client";

import { useState, ReactNode } from "react";

interface DownloadButtonProps {
  url: string;
  filename: string;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger";
  size?: "small" | "medium" | "large";
  showProgress?: boolean;
  downloadMethod?: "direct" | "blob";
  // Add mouse event handlers
  onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function DownloadButton({
  url,
  filename,
  children,
  className = "",
  style = {},
  disabled = false,
  onSuccess,
  onError,
  onStart,
  variant = "primary",
  size = "medium",
  showProgress = true,
  downloadMethod = "direct",
  onMouseEnter,
  onMouseLeave,
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Base styles for different variants
  const variantStyles = {
    primary: {
      backgroundColor: "#007bff",
      color: "white",
      borderColor: "#007bff",
    },
    secondary: {
      backgroundColor: "#6c757d",
      color: "white",
      borderColor: "#6c757d",
    },
    success: {
      backgroundColor: "#28a745",
      color: "white",
      borderColor: "#28a745",
    },
    warning: {
      backgroundColor: "#ffc107",
      color: "#212529",
      borderColor: "#ffc107",
    },
    danger: {
      backgroundColor: "#dc3545",
      color: "white",
      borderColor: "#dc3545",
    },
  };

  // Size styles
  const sizeStyles = {
    small: {
      padding: "6px 12px",
      fontSize: "14px",
    },
    medium: {
      padding: "10px 20px",
      fontSize: "16px",
    },
    large: {
      padding: "14px 28px",
      fontSize: "18px",
    },
  };

  const downloadFileDirect = async () => {
    if (isDownloading || disabled) return;

    setIsDownloading(true);
    setProgress("Initiating download...");
    setDownloadProgress(0);
    onStart?.();

    try {
      // Create the download URL
      const downloadUrl = `/api/download?url=${encodeURIComponent(
        url
      )}&filename=${encodeURIComponent(filename)}`;

      if (showProgress) setProgress("Starting download...");

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (showProgress) {
        setProgress("Download started! Check your downloads folder.");
        setTimeout(() => {
          setProgress("Download should be in progress...");
          setDownloadProgress(100);
        }, 1000);

        setTimeout(() => {
          setProgress("");
          setDownloadProgress(0);
        }, 5000);
      }

      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Download failed";
      console.error("Download error:", error);

      if (showProgress) setProgress("");
      onError?.(errorMessage);

      alert(`Download failed: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadFileBlob = async () => {
    if (isDownloading || disabled) return;

    setIsDownloading(true);
    setProgress("");
    setDownloadProgress(0);
    onStart?.();

    try {
      if (showProgress) setProgress("Fetching file...");

      const response = await fetch(
        `/api/download?url=${encodeURIComponent(
          url
        )}&filename=${encodeURIComponent(filename)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP ${response.status}: Download failed`
        );
      }

      if (showProgress) setProgress("Processing file...");

      // Get the blob from response with progress tracking
      const contentLength = response.headers.get("Content-Length");
      const total = parseInt(contentLength || "0", 10);
      let loaded = 0;

      const reader = response.body?.getReader();
      const chunks: BlobPart[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          chunks.push(value);
          loaded += value.length;

          if (total > 0 && showProgress) {
            const percent = Math.round((loaded / total) * 100);
            setDownloadProgress(percent);
            setProgress(`Downloading... ${percent}%`);
          }
        }
      }

      // Create blob from chunks
      const blob = new Blob(chunks);

      if (showProgress) setProgress("Preparing download...");

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = "none";

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      window.URL.revokeObjectURL(downloadUrl);

      if (showProgress) {
        setProgress("Download completed!");
        setDownloadProgress(100);
        setTimeout(() => {
          setProgress("");
          setDownloadProgress(0);
        }, 2000);
      }

      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Download failed";
      console.error("Download error:", error);

      if (showProgress) {
        setProgress("");
        setDownloadProgress(0);
      }
      onError?.(errorMessage);

      alert(`Download failed: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadFile =
    downloadMethod === "direct" ? downloadFileDirect : downloadFileBlob;

  const buttonStyle: React.CSSProperties = {
    ...sizeStyles[size],
    ...variantStyles[variant],
    borderRadius: "16px",
    cursor: isDownloading || disabled ? "not-allowed" : "pointer",
    fontWeight: "500",
    transition: "all 0.2s ease",
    opacity: isDownloading || disabled ? 0.6 : 1,
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%", // Add this to make button full width
    ...style,
  };

  return (
    <>
      <button
        onClick={downloadFile}
        disabled={isDownloading || disabled}
        className={className}
        style={buttonStyle}
        type="button"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {isDownloading ? (
          <>
            <span
              style={{
                display: "inline-block",
                width: "14px",
                height: "14px",
                border: "2px solid currentColor",
                borderRadius: "50%",
                borderTopColor: "transparent",
                animation: "spin 1s linear infinite",
              }}
            />
            {downloadMethod === "direct" ? "Starting..." : "Downloading..."}
          </>
        ) : (
          <>
            {children || (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download ({downloadMethod})
              </>
            )}
          </>
        )}
      </button>

      {showProgress && (progress || downloadProgress > 0) && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: "0",
            right: "0",
            padding: "8px 12px",
            backgroundColor: "#e9ecef",
            border: "1px solid #dee2e6",
            borderRadius: "4px",
            fontSize: "14px",
            color: "#495057",
            minWidth: "200px",
            zIndex: 10,
          }}
        >
          {progress && (
            <div style={{ marginBottom: downloadProgress > 0 ? "4px" : "0" }}>
              {progress}
            </div>
          )}
          {downloadProgress > 0 && downloadMethod === "blob" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  flex: 1,
                  height: "6px",
                  backgroundColor: "#dee2e6",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    backgroundColor: "#007bff",
                    width: `${downloadProgress}%`,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <span style={{ fontSize: "12px", minWidth: "35px" }}>
                {downloadProgress}%
              </span>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
