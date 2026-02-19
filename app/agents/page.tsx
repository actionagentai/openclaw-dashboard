"use client";

import { useState } from "react";
import { useOpenClawAgents } from "@/hooks/use-openclaw-agents";
import { useOpenClaw } from "@/contexts/OpenClawContext";
import {
  Bot,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Loader2,
  Star,
  AlertCircle,
} from "lucide-react";
import type { AgentSummary } from "@/lib/types";

export default function OpenClawAgentsPage() {
  const { isConnected } = useOpenClaw();
  const { agents, defaultId, loading, error, refresh, deleteAgent } = useOpenClawAgents();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this agent?")) return;
    setDeleting(id);
    try {
      await deleteAgent(id);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Agents
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Manage your AI agents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <a
            href="agents/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Agent
          </a>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {!isConnected && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-yellow-500/10 text-yellow-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          Gateway disconnected. Connect to manage agents.
        </div>
      )}

      {/* Agent Grid */}
      {loading && agents.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--text-secondary)" }} />
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-20">
          <Bot className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--text-secondary)" }} />
          <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>
            No agents yet
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Create your first agent to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isDefault={agent.id === defaultId}
              onDelete={() => handleDelete(agent.id)}
              deleting={deleting === agent.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AgentCard({
  agent,
  isDefault,
  onDelete,
  deleting,
}: {
  agent: AgentSummary;
  isDefault: boolean;
  onDelete: () => void;
  deleting: boolean;
}) {
  const name = agent.identity?.name || agent.name || agent.id;
  const emoji = agent.identity?.emoji;

  return (
    <div
      className="rounded-xl border p-4 hover:border-blue-500/30 transition-colors group"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            style={{ background: "var(--background)" }}
          >
            {emoji || "🤖"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                {name}
              </h3>
              {isDefault && (
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {agent.id}
            </p>
          </div>
        </div>
      </div>

      {agent.identity?.theme && (
        <p
          className="text-xs mt-3 line-clamp-2"
          style={{ color: "var(--text-secondary)" }}
        >
          {agent.identity.theme}
        </p>
      )}

      <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={`agents/${agent.id}`}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs hover:bg-white/5 transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <Edit2 className="w-3 h-3" />
          Edit
        </a>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          {deleting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
          Delete
        </button>
      </div>
    </div>
  );
}
