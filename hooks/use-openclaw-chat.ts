"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useOpenClaw } from "@/contexts/OpenClawContext";
import type { ChatEvent, ChatSendParams } from "@/lib/types";

export type ChatMessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: number;
  state?: "delta" | "final" | "aborted" | "error";
  runId?: string;
}

interface UseOpenClawChatOptions {
  sessionKey?: string;
}

export function useOpenClawChat(options: UseOpenClawChatOptions = {}) {
  const { rpc, subscribe, isConnected } = useOpenClaw();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionKeyRef = useRef(options.sessionKey ?? "hn-dashboard-chat");
  const currentRunIdRef = useRef<string | null>(null);

  // Subscribe to chat events for streaming
  // Gateway prefixes sessionKey with "agent:<agentId>:" so we match by suffix
  useEffect(() => {
    if (!isConnected) return;

    return subscribe("chat", (event: ChatEvent) => {
      // Gateway resolves "foo" -> "agent:main:foo", so match by suffix
      if (!event.sessionKey?.endsWith(sessionKeyRef.current)) return;

      if (event.state === "delta") {
        setIsStreaming(true);
        currentRunIdRef.current = event.runId;

        // Chat delta events contain the FULL accumulated text, so REPLACE not append
        const fullText = extractText(event.message);

        setMessages((prev) => {
          const existing = prev.find(
            (m) => m.runId === event.runId && m.role === "assistant"
          );
          if (existing) {
            return prev.map((m) =>
              m.runId === event.runId && m.role === "assistant"
                ? {
                    ...m,
                    content: fullText,
                    state: "delta" as const,
                  }
                : m
            );
          }
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant" as const,
              content: fullText,
              timestamp: Date.now(),
              state: "delta" as const,
              runId: event.runId,
            },
          ];
        });
      } else if (event.state === "final") {
        setIsStreaming(false);
        currentRunIdRef.current = null;
        // Final event also carries the complete message
        const finalText = extractText(event.message);
        setMessages((prev) =>
          prev.map((m) =>
            m.runId === event.runId && m.role === "assistant"
              ? { ...m, content: finalText || m.content, state: "final" as const }
              : m
          )
        );
      } else if (event.state === "aborted" || event.state === "error") {
        setIsStreaming(false);
        currentRunIdRef.current = null;
        if (event.errorMessage) setError(event.errorMessage);
        setMessages((prev) =>
          prev.map((m) =>
            m.runId === event.runId && m.role === "assistant"
              ? { ...m, state: event.state }
              : m
          )
        );
      }
    });
  }, [isConnected, subscribe]);

  // Send a message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setError(null);

      // Add user message
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        await rpc("chat.send", {
          sessionKey: sessionKeyRef.current,
          message: text,
          idempotencyKey: crypto.randomUUID(),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
      }
    },
    [rpc]
  );

  // Abort current stream
  const abort = useCallback(async () => {
    if (!currentRunIdRef.current) return;
    try {
      await rpc("chat.abort", {
        sessionKey: sessionKeyRef.current,
        runId: currentRunIdRef.current,
      });
    } catch {
      // ignore
    }
    setIsStreaming(false);
  }, [rpc]);

  // Load history
  const loadHistory = useCallback(async () => {
    try {
      const result = await rpc("chat.history", {
        sessionKey: sessionKeyRef.current,
        limit: 50,
      }) as any;
      // Response: { sessionKey, sessionId, messages: [...], thinkingLevel }
      const history = result?.messages ?? (Array.isArray(result) ? result : []);
      if (Array.isArray(history) && history.length > 0) {
        const mapped = history.map((h: any) => ({
          id: h.id ?? crypto.randomUUID(),
          role: (h.role ?? "assistant") as ChatMessageRole,
          content: extractText(h),
          timestamp: h.timestamp ?? Date.now(),
          state: "final" as const,
        }));
        setMessages(mapped);
      }
    } catch {
      // History might not be available for new sessions
    }
  }, [rpc]);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    abort,
    loadHistory,
    setSessionKey: (key: string) => {
      sessionKeyRef.current = key;
    },
  };
}

// Extract text from various message formats
// Handles: { content: [{ type: "text", text: "..." }, { type: "thinking", ... }] }
//          { role: "assistant", content: [...] } (history format)
//          { text: "..." } (simple)
//          string (direct)
function extractText(message: unknown): string {
  if (typeof message === "string") return message;
  if (!message) return "";
  if (typeof message === "object") {
    const m = message as any;
    // Handle content array format (filter out thinking blocks)
    if (Array.isArray(m.content)) {
      return m.content
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text ?? "")
        .join("");
    }
    if (typeof m.content === "string") return m.content;
    if (typeof m.text === "string") return m.text;
    if (typeof m.delta === "string") return m.delta;
  }
  return "";
}
