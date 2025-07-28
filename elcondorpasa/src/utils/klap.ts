import { KlapStreamData, ProcessingState } from "@/types";

// Save processing state to localStorage
export const saveProcessingState = (state: ProcessingState) => {
  localStorage.setItem(
    "klapProcessingState",
    JSON.stringify({
      ...state,
      timestamp: Date.now(),
    })
  );
};

// Get processing state from localStorage
export const getProcessingState = (): ProcessingState | null => {
  const saved = localStorage.getItem("klapProcessingState");
  if (!saved) return null;

  try {
    const state = JSON.parse(saved);
    // Check if state is older than 24 hours
    if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
      clearProcessingState();
      return null;
    }
    return state;
  } catch {
    return null;
  }
};

// Clear processing state
export const clearProcessingState = () => {
  localStorage.removeItem("klapProcessingState");
};

// Process Klap streaming response
export const processKlapStream = async (
  response: Response,
  onProgress: (data: KlapStreamData) => void,
  onComplete: (data: KlapStreamData) => void,
  onError: (error: string) => void
) => {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    onError("Failed to read response stream");
    return;
  }

  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim() === "") continue;

        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();

          try {
            const parsed: KlapStreamData = JSON.parse(data);

            // Update progress
            onProgress(parsed);

            // Check if completed
            if (
              parsed.status === "completed" ||
              parsed.status === "export_complete"
            ) {
              onComplete(parsed);
            } else if (parsed.status === "error") {
              onError(parsed.message);
            }
          } catch (e) {
            console.error("Error parsing Klap stream data:", e);
          }
        }
      }
    }
  } catch (error) {
    onError(`Stream processing error: ${error}`);
  } finally {
    reader.releaseLock();
  }
};
