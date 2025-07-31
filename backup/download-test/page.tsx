//ini ntar boleh dihapus

"use client";

import DownloadButton from "@/components/DownloadButton";

export default function DownloadTestPage() {
  const videoUrl =
    "https://storage.googleapis.com/klap-renders/A3oYRKDQ3fVi8dL4.mp4";

  const handleDownloadSuccess = () => {
    console.log("Download completed successfully!");
    // You could show a toast notification here
  };

  const handleDownloadError = (error: string) => {
    console.error("Download failed:", error);
    // You could show an error toast here
  };

  const handleDownloadStart = () => {
    console.log("Download started...");
  };

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "1000px",
        margin: "0 auto",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h1
        style={{
          color: "#333",
          marginBottom: "30px",
          fontSize: "2.5rem",
          textAlign: "center",
        }}
      >
        Streaming vs Blob Download Comparison
      </h1>

      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "40px",
          border: "1px solid #dee2e6",
        }}
      >
        <p style={{ margin: "0 0 10px 0", fontWeight: "600" }}>
          Test Video URL:
        </p>
        <code
          style={{
            backgroundColor: "#fff",
            padding: "12px",
            borderRadius: "4px",
            display: "block",
            wordBreak: "break-all",
            fontSize: "14px",
            border: "1px solid #e9ecef",
          }}
        >
          {videoUrl}
        </code>
      </div>

      {/* Download Method Comparison */}
      <section style={{ marginBottom: "50px" }}>
        <h2 style={{ marginBottom: "30px", color: "#495057" }}>
          Download Methods Comparison
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "30px",
            marginBottom: "30px",
          }}
        >
          {/* Direct Download */}
          <div
            style={{
              backgroundColor: "#e8f5e8",
              padding: "25px",
              borderRadius: "12px",
              border: "2px solid #28a745",
            }}
          >
            <h3
              style={{
                color: "#155724",
                marginBottom: "15px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              ⚡ Direct Download (Recommended)
            </h3>
            <div style={{ marginBottom: "20px" }}>
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "14px",
                  color: "#155724",
                }}
              >
                <strong>✅ Immediate "Save As" dialog</strong>
              </p>
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "14px",
                  color: "#155724",
                }}
              >
                <strong>✅ Browser handles download progress</strong>
              </p>
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "14px",
                  color: "#155724",
                }}
              >
                <strong>✅ No memory usage (streaming)</strong>
              </p>
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "14px",
                  color: "#155724",
                }}
              >
                <strong>✅ Works with large files</strong>
              </p>
              <p
                style={{
                  margin: "0 0 0 0",
                  fontSize: "14px",
                  color: "#155724",
                }}
              >
                <strong>✅ Can pause/resume download</strong>
              </p>
            </div>
            <DownloadButton
              url={videoUrl}
              filename="video-direct-download.mp4"
              variant="success"
              downloadMethod="direct"
              onSuccess={handleDownloadSuccess}
              onError={handleDownloadError}
              onStart={handleDownloadStart}
            >
              🚀 Direct Download
            </DownloadButton>
          </div>

          {/* Blob Download */}
          <div
            style={{
              backgroundColor: "#fff3cd",
              padding: "25px",
              borderRadius: "12px",
              border: "2px solid #ffc107",
            }}
          >
            <h3
              style={{
                color: "#856404",
                marginBottom: "15px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              💾 Blob Download (Traditional)
            </h3>
            <div style={{ marginBottom: "20px" }}>
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "14px",
                  color: "#856404",
                }}
              >
                <strong>⚠️ Downloads to memory first</strong>
              </p>
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "14px",
                  color: "#856404",
                }}
              >
                <strong>⚠️ "Save As" appears after download</strong>
              </p>
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "14px",
                  color: "#856404",
                }}
              >
                <strong>⚠️ Uses RAM during download</strong>
              </p>
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "14px",
                  color: "#856404",
                }}
              >
                <strong>✅ Shows custom progress bar</strong>
              </p>
              <p
                style={{
                  margin: "0 0 0 0",
                  fontSize: "14px",
                  color: "#856404",
                }}
              >
                <strong>✅ Can process file before save</strong>
              </p>
            </div>
            <DownloadButton
              url={videoUrl}
              filename="video-blob-download.mp4"
              variant="warning"
              downloadMethod="blob"
              onSuccess={handleDownloadSuccess}
              onError={handleDownloadError}
              onStart={handleDownloadStart}
            >
              📦 Blob Download
            </DownloadButton>
          </div>
        </div>

        {/* Flow Comparison */}
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid #dee2e6",
          }}
        >
          <h3 style={{ marginBottom: "20px", color: "#495057" }}>
            Download Flow Comparison
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            <div>
              <h4 style={{ color: "#28a745", marginBottom: "10px" }}>
                ⚡ Direct Download Flow:
              </h4>
              <ol style={{ paddingLeft: "20px", margin: 0, color: "#495057" }}>
                <li>User clicks button</li>
                <li>
                  <strong>"Save As" dialog appears immediately</strong>
                </li>
                <li>User chooses location/filename</li>
                <li>Browser downloads directly to chosen location</li>
                <li>Browser shows download progress in its UI</li>
              </ol>
            </div>

            <div>
              <h4 style={{ color: "#ffc107", marginBottom: "10px" }}>
                💾 Blob Download Flow:
              </h4>
              <ol style={{ paddingLeft: "20px", margin: 0, color: "#495057" }}>
                <li>User clicks button</li>
                <li>File downloads to browser memory</li>
                <li>Custom progress bar shows download progress</li>
                <li>After download completes, "Save As" dialog appears</li>
                <li>User chooses location/filename</li>
                <li>Browser saves from memory to disk</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Different Variants with Both Methods */}
      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ marginBottom: "20px", color: "#495057" }}>
          Different Button Styles
        </h2>
        <div
          style={{
            display: "flex",
            gap: "15px",
            flexWrap: "wrap",
            alignItems: "flex-start",
            marginBottom: "25px",
          }}
        >
          <DownloadButton
            url={videoUrl}
            filename="video-primary-direct.mp4"
            variant="primary"
            downloadMethod="direct"
            onSuccess={handleDownloadSuccess}
            onError={handleDownloadError}
          >
            Primary Direct
          </DownloadButton>

          <DownloadButton
            url={videoUrl}
            filename="video-primary-blob.mp4"
            variant="primary"
            downloadMethod="blob"
            onSuccess={handleDownloadSuccess}
            onError={handleDownloadError}
          >
            Primary Blob
          </DownloadButton>

          <DownloadButton
            url={videoUrl}
            filename="video-success-direct.mp4"
            variant="success"
            size="large"
            downloadMethod="direct"
            onSuccess={handleDownloadSuccess}
            onError={handleDownloadError}
          >
            🎬 Large Direct Download
          </DownloadButton>

          <DownloadButton
            url={videoUrl}
            filename="video-danger-blob.mp4"
            variant="danger"
            size="small"
            downloadMethod="blob"
            onSuccess={handleDownloadSuccess}
            onError={handleDownloadError}
          >
            Small Blob
          </DownloadButton>
        </div>
      </section>

      {/* Custom Styling Examples */}
      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ marginBottom: "20px", color: "#495057" }}>
          Custom Styling Examples
        </h2>
        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <DownloadButton
            url={videoUrl}
            filename="video-gradient.mp4"
            variant="primary"
            downloadMethod="direct"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "25px",
              padding: "15px 30px",
              boxShadow: "0 8px 25px 0 rgba(116, 75, 162, 0.3)",
              transform: "translateY(0)",
              transition: "all 0.3s ease",
            }}
            onSuccess={handleDownloadSuccess}
            onError={handleDownloadError}
          >
            🌟 Gradient Direct
          </DownloadButton>

          <DownloadButton
            url={videoUrl}
            filename="video-neon.mp4"
            variant="success"
            downloadMethod="blob"
            style={{
              backgroundColor: "#00ff88",
              color: "#000",
              border: "2px solid #00ff88",
              borderRadius: "8px",
              textShadow: "0 0 10px rgba(0, 255, 136, 0.5)",
              boxShadow: "0 0 20px rgba(0, 255, 136, 0.3)",
            }}
            onSuccess={handleDownloadSuccess}
            onError={handleDownloadError}
          >
            ⚡ Neon Blob
          </DownloadButton>

          <DownloadButton
            url={videoUrl}
            filename="video-minimal.mp4"
            variant="secondary"
            downloadMethod="direct"
            showProgress={false}
            style={{
              backgroundColor: "transparent",
              color: "#007bff",
              border: "2px solid #007bff",
              borderRadius: "4px",
              padding: "12px 24px",
            }}
            onSuccess={handleDownloadSuccess}
            onError={handleDownloadError}
          >
            Minimal Direct
          </DownloadButton>
        </div>
      </section>

      {/* Technical Notes */}
      <section>
        <h2 style={{ marginBottom: "20px", color: "#495057" }}>
          Technical Notes
        </h2>
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #dee2e6",
          }}
        >
          <h4 style={{ margin: "0 0 15px 0", color: "#495057" }}>
            When to use each method:
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            <div>
              <h5 style={{ color: "#28a745", margin: "0 0 10px 0" }}>
                Use Direct Download when:
              </h5>
              <ul style={{ margin: 0, paddingLeft: "20px", color: "#495057" }}>
                <li>File size is large (&gt;50MB)</li>
                <li>You want traditional download UX</li>
                <li>Memory usage is a concern</li>
                <li>You want browser's native progress</li>
                <li>Users might want to pause/resume</li>
              </ul>
            </div>
            <div>
              <h5 style={{ color: "#ffc107", margin: "0 0 10px 0" }}>
                Use Blob Download when:
              </h5>
              <ul style={{ margin: 0, paddingLeft: "20px", color: "#495057" }}>
                <li>File size is small (&lt;50MB)</li>
                <li>You need custom progress UI</li>
                <li>You want to process file before saving</li>
                <li>You need to validate file content</li>
                <li>You want complete control over the process</li>
              </ul>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#d1ecf1",
              padding: "15px",
              borderRadius: "6px",
              border: "1px solid #bee5eb",
            }}
          >
            <strong style={{ color: "#0c5460" }}>💡 Recommendation:</strong>
            <p style={{ margin: "5px 0 0 0", color: "#0c5460" }}>
              For most use cases, especially video files, use the{" "}
              <strong>Direct Download method</strong>. It provides better user
              experience and handles large files efficiently without memory
              concerns.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
