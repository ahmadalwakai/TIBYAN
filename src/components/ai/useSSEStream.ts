import { useCallback, useRef, useState } from "react";

// SSE message format from API: {delta: string} | {done: true, ...} | {message: string (error)}
interface UseSSEStreamOptions {
  batchIntervalMs?: number;
  onDelta?: (delta: string) => void;
  onStop?: () => void;
  onError?: (error: string) => void;
}

export function useSSEStream(options: UseSSEStreamOptions = {}) {
  const { batchIntervalMs = 80, onDelta, onStop, onError } = options;
  const abortControllerRef = useRef<AbortController | null>(null);
  const bufferRef = useRef<string>("");
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Flush buffered deltas to state
  const flushBuffer = useCallback(() => {
    if (bufferRef.current) {
      onDelta?.(bufferRef.current);
      bufferRef.current = "";
    }
  }, [onDelta]);

  // Schedule flush
  const scheduleBatchFlush = useCallback(() => {
    if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    batchTimerRef.current = setTimeout(flushBuffer, batchIntervalMs);
  }, [flushBuffer, batchIntervalMs]);

  const stream = useCallback(
    async (
      endpoint: string,
      payload: Record<string, any>,
      headers: Record<string, string> = {}
    ) => {
      // Cancel previous stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsStreaming(true);
      bufferRef.current = "";

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify(payload),
          signal: abortControllerRef.current.signal,
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Response body missing");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            const dataStr = line.slice(6).trim();
            if (!dataStr || dataStr === "[DONE]") continue;

            try {
              // API sends {delta:"..."} and {done:true}, not {type:"delta"} format
              const msg = JSON.parse(dataStr) as { delta?: string; done?: boolean; message?: string };

              if (msg.delta) {
                bufferRef.current += msg.delta;
                scheduleBatchFlush();
              } else if (msg.done === true) {
                flushBuffer();
                onStop?.();
              } else if (msg.message) {
                // Error message from API
                flushBuffer();
                onError?.(msg.message);
              }
            } catch (parseError) {
              if (process.env.NODE_ENV === "development") {
                console.error("Failed to parse SSE message:", dataStr, parseError);
              }
            }
          }
        }
      } catch (err) {
        flushBuffer();
        if (err instanceof Error && err.name !== "AbortError") {
          onError?.(err.message);
        }
      } finally {
        setIsStreaming(false);
        if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
      }
    },
    [flushBuffer, scheduleBatchFlush, onDelta, onStop, onError]
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    flushBuffer();
    setIsStreaming(false);
  }, [flushBuffer]);

  return {
    stream,
    abort,
    isStreaming,
  };
}
