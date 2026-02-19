"use client";

import { useEffect, useRef } from "react";
import { Send, X } from "lucide-react";

interface VoiceTranscriptPreviewProps {
  interimTranscript: string;
  finalTranscript: string;
  isListening: boolean;
  mode: "inject" | "chat";
  onSendToChat?: (text: string) => void;
  onDismiss?: () => void;
}

export function VoiceTranscriptPreview({
  interimTranscript,
  finalTranscript,
  isListening,
  mode,
  onSendToChat,
  onDismiss,
}: VoiceTranscriptPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasContent = interimTranscript || finalTranscript;

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [interimTranscript, finalTranscript]);

  if (!isListening && !hasContent) return null;

  return (
    <div
      className="
        fixed bottom-20 right-4 z-50
        w-80 max-h-48 rounded-xl
        border shadow-2xl backdrop-blur-xl
        overflow-hidden
        animate-in slide-in-from-bottom-2 fade-in duration-200
      "
      style={{
        background: "var(--card, #1a1a2e)",
        borderColor: "var(--border, #2a2a4a)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: "var(--border, #2a2a4a)" }}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isListening ? "bg-red-500 animate-pulse" : "bg-gray-400"}`} />
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary, #888)" }}>
            {isListening ? "Listening..." : "Paused"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {mode === "chat" && finalTranscript && (
            <button
              onClick={() => onSendToChat?.(finalTranscript)}
              className="p-1 rounded-md hover:bg-white/10 transition-colors"
              title="Send to Chat"
            >
              <Send className="w-3.5 h-3.5 text-blue-400" />
            </button>
          )}
          <button
            onClick={onDismiss}
            className="p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" style={{ color: "var(--text-secondary, #888)" }} />
          </button>
        </div>
      </div>

      {/* Transcript content */}
      <div
        ref={containerRef}
        className="px-3 py-2 max-h-32 overflow-y-auto text-sm leading-relaxed"
      >
        {finalTranscript && (
          <span style={{ color: "var(--text-primary, #eee)" }}>
            {finalTranscript}
          </span>
        )}
        {interimTranscript && (
          <span style={{ color: "var(--text-secondary, #666)" }}>
            {interimTranscript}
          </span>
        )}
        {!hasContent && isListening && (
          <span
            className="text-xs italic"
            style={{ color: "var(--text-secondary, #666)" }}
          >
            Start speaking...
          </span>
        )}
      </div>
    </div>
  );
}
