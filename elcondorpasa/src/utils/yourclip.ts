import { VideoShort } from "@/types";

export const downloadVideo = async (video: VideoShort): Promise<void> => {
  try {
    const response = await fetch(video.download_url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${video.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mp4`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Download error:", error);
    throw error;
  }
};

export const copyToClipboard = async (text: string): Promise<void> => {
  await navigator.clipboard.writeText(text);
};

export const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^a-z0-9]/gi, "_");
};

export const createVideoFile = async (
  downloadUrl: string,
  title: string
): Promise<File> => {
  const response = await fetch(downloadUrl);
  const blob = await response.blob();
  return new File([blob], `${sanitizeFileName(title)}.mp4`, {
    type: "video/mp4",
  });
};

export const openPopupWindow = (url: string, name: string): Window | null => {
  const width = 500;
  const height = 600;
  const left = window.innerWidth / 2 - width / 2;
  const top = window.innerHeight / 2 - height / 2;

  return window.open(
    url,
    name,
    `width=${width},height=${height},left=${left},top=${top}`
  );
};
