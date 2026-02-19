"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useOpenClaw } from "@/contexts/OpenClawContext";
import {
  ScrollText,
  RefreshCw,
  Loader2,
  Pause,
  Play,
  Trash2,
  Download,
  Filter,
} from "lucide-react";

type LogLevel = "all" | "info" | "warn" | "error";

const LEVEL_COLORS: Record<string, string> = {
  ERROR: "#ef4444",
  WARN: "#eab308",
  INFO: "#3b82f6",
  DEBUG: "#6b7280",
};

export default function OpenClawLogsPage() {
  const { rpc, isConnected, subscribe } = useOpenClaw();
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState<LogLevel>("all");
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  // Initial log load
  const loadLogs = useCallback(async () => {
    if (!isConnected) return;
    setLoading(true);
    try {
      const result = await rpc("logs.tail", { lines: 200 });
      setLogs(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLoading(false);
    }
  }, [rpc, isConnected]);

  useEffect(() => {
    if (isConnected) loadLogs();
  }, [isConnected, loadLogs]);

  // Subscribe to live log events (via "agent" event or tick)
  useEffect(() => {
    if (!isConnected || paused) return;

    // Poll for new logs every 3 seconds
    const interval = setInterval(async () => {
      try {
        const result = await rpc("logs.tail", { lines: 50 });
        if (Array.isArray(result) && result.length > 0) {
          setLogs((prev) => {
            // Deduplicate by keeping last 500 lines
            const combined = [...prev, ...result];
            const unique = [...new Set(combined)];
            return unique.slice(-500);
          });
        }
      } catch {
        // Ignore poll errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isConnected, paused, rpc]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  // Handle scroll to detect user scrolling up
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 50;
  };

  // Filter logs
  const filteredLogs = logs.filter((line) => {
    if (filter && !line.toLowerCase().includes(filter.toLowerCase())) return false;
    if (levelFilter !== "all") {
      const level = levelFilter.toUpperCase();
      if (!line.includes(level)) return false;
    }
    return true;
  });

  const downloadLogs = () => {
    const blob = new Blob([filteredLogs.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `openclaw-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
            Logs
          </h1>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {filteredLogs.length} lines {paused ? "(paused)" : "(live)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Level filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as LogLevel)}
            className="px-2 py-1.5 rounded-lg border bg-transparent text-xs outline-none"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-primary)",
              background: "var(--card)",
            }}
          >
            <option value="all">All Levels</option>
            <option value="error">Errors</option>
            <option value="warn">Warnings</option>
            <option value="info">Info</option>
          </select>

          {/* Text filter */}
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter..."
            className="w-40 px-2 py-1.5 rounded-lg border bg-transparent text-xs outline-none"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          />

          <button
            onClick={() => setPaused(!paused)}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
            title={paused ? "Resume" : "Pause"}
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setLogs([])}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
            title="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={downloadLogs}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
            title="Download logs"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={loadLogs}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Log content */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-2 font-mono text-xs leading-5"
        style={{
          background: "#0d1117",
          color: "#c9d1d9",
        }}
      >
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            No logs to display
          </div>
        ) : (
          filteredLogs.map((line, i) => {
            // Color-code by level
            let color = "#c9d1d9";
            for (const [level, c] of Object.entries(LEVEL_COLORS)) {
              if (line.includes(level)) {
                color = c;
                break;
              }
            }
            return (
              <div
                key={i}
                className="hover:bg-white/5 px-2 py-0.5 rounded whitespace-pre-wrap break-all"
                style={{ color }}
              >
                {line}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
