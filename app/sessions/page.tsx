"use client";

import { useState } from "react";
import { useOpenClawSessions } from "@/hooks/use-openclaw-sessions";
import { useOpenClaw } from "@/contexts/OpenClawContext";
import {
  Folder,
  Trash2,
  RotateCcw,
  RefreshCw,
  Loader2,
  MessageSquare,
  Clock,
  Bot,
  Archive,
  AlertCircle,
} from "lucide-react";
import type { SessionSummary } from "@/lib/types";

export default function OpenClawSessionsPage() {
  const { isConnected } = useOpenClaw();
  const { sessions, loading, error, refresh, deleteSession, resetSession, compactSession } =
    useOpenClawSessions();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = sessions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.displayName?.toLowerCase().includes(q) ||
      s.key.toLowerCase().includes(q) ||
      s.channel?.toLowerCase().includes(q) ||
      s.origin?.label?.toLowerCase().includes(q)
    );
  });

  const handleAction = async (key: string, action: "delete" | "reset" | "compact") => {
    if (action === "delete" && !confirm("Delete this session and all its messages?")) return;
    setActionLoading(`${key}-${action}`);
    try {
      if (action === "delete") await deleteSession(key);
      else if (action === "reset") await resetSession(key);
      else await compactSession(key);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Sessions
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Browse and manage conversation sessions
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search sessions..."
        className="w-full max-w-md px-3 py-2 rounded-lg border bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
        style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
      />

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading && sessions.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--text-secondary)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Folder className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--text-secondary)" }} />
          <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>
            {search ? "No matching sessions" : "No sessions yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((session) => (
            <SessionRow
              key={session.key}
              session={session}
              actionLoading={actionLoading}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionRow({
  session,
  actionLoading,
  onAction,
}: {
  session: SessionSummary;
  actionLoading: string | null;
  onAction: (key: string, action: "delete" | "reset" | "compact") => void;
}) {
  const title = session.displayName || session.key;
  const timeAgo = session.updatedAt ? formatTimeAgo(session.updatedAt) : "";
  const agentId = session.key.split(":")[1] ?? session.agentId;

  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl border group hover:border-blue-500/30 transition-colors"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <MessageSquare className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
        <div className="min-w-0">
          <h3 className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {title}
          </h3>
          <div className="flex items-center gap-3 mt-0.5">
            {agentId && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                <Bot className="w-3 h-3" />
                {agentId}
              </span>
            )}
            {session.channel && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--background)", color: "var(--text-secondary)" }}>
                {session.channel}
              </span>
            )}
            {timeAgo && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                <Clock className="w-3 h-3" />
                {timeAgo}
              </span>
            )}
            {session.totalTokens != null && (
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {(session.totalTokens / 1000).toFixed(1)}K tokens
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <ActionBtn
          icon={<RotateCcw className="w-3 h-3" />}
          label="Reset"
          loading={actionLoading === `${session.key}-reset`}
          onClick={() => onAction(session.key, "reset")}
        />
        <ActionBtn
          icon={<Archive className="w-3 h-3" />}
          label="Compact"
          loading={actionLoading === `${session.key}-compact`}
          onClick={() => onAction(session.key, "compact")}
        />
        <ActionBtn
          icon={<Trash2 className="w-3 h-3" />}
          label="Delete"
          loading={actionLoading === `${session.key}-delete`}
          onClick={() => onAction(session.key, "delete")}
          danger
        />
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  loading,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={label}
      className={`p-1.5 rounded-md text-xs transition-colors ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "hover:bg-white/5"
      }`}
      style={danger ? undefined : { color: "var(--text-secondary)" }}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : icon}
    </button>
  );
}

function formatTimeAgo(ts: number | string): string {
  const date = typeof ts === "number" ? ts : new Date(ts).getTime();
  const now = Date.now();
  const diff = now - date;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
