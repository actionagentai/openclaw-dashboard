"use client";

import { useEffect, useRef, useState } from "react";
import { useOpenClawChat, type ChatMessage } from "@/hooks/use-openclaw-chat";
import { useOpenClaw } from "@/contexts/OpenClawContext";
import { Send, Square, Bot, User, Loader2, AlertCircle } from "lucide-react";

export default function OpenClawChatPage() {
  const { isConnected } = useOpenClaw();
  const { messages, isStreaming, error, sendMessage, abort, loadHistory } = useOpenClawChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load history on connect
  useEffect(() => {
    if (isConnected) loadHistory();
  }, [isConnected, loadHistory]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Chat
          </h1>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Talk to your OpenClaw AI assistant
          </p>
        </div>
        {!isConnected && (
          <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-500">
            Disconnected
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot
              className="w-16 h-16 mb-4"
              style={{ color: "var(--text-secondary)" }}
            />
            <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>
              Start a conversation
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Type a message or use the mic button to speak
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {error && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="px-6 py-4 border-t flex-shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="flex items-end gap-3 rounded-xl border p-3"
          style={{
            background: "var(--card)",
            borderColor: "var(--border)",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed"
            style={{
              color: "var(--text-primary)",
              maxHeight: "120px",
            }}
            disabled={!isConnected}
          />
          {isStreaming ? (
            <button
              onClick={abort}
              className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors flex-shrink-0"
              title="Stop generating"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || !isConnected}
              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-40 disabled:hover:bg-blue-600 flex-shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isStreaming = message.state === "delta";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: isUser ? "var(--primary, #3b82f6)" : "var(--border)",
        }}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        )}
      </div>
      <div
        className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
          isUser ? "rounded-br-sm" : "rounded-bl-sm"
        }`}
        style={{
          background: isUser ? "var(--primary, #3b82f6)" : "var(--card)",
          color: isUser ? "white" : "var(--text-primary)",
          borderColor: isUser ? undefined : "var(--border)",
          border: isUser ? undefined : "1px solid var(--border)",
        }}
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-current opacity-60 animate-pulse" />
          )}
        </div>
        {message.state === "error" && (
          <div className="text-xs mt-1 opacity-70">Error generating response</div>
        )}
      </div>
    </div>
  );
}
