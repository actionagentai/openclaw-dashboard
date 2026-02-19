"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOpenClaw } from "@/contexts/OpenClawContext";
import { useOpenClawAgents } from "@/hooks/use-openclaw-agents";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import type { AgentSummary } from "@/lib/types";

export default function EditAgentPage() {
  const params = useParams();
  const router = useRouter();
  const { isConnected } = useOpenClaw();
  const { agents, updateAgent, loading } = useOpenClawAgents();

  const agentId = params.id as string;
  const agent = agents.find((a) => a.id === agentId);

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [theme, setTheme] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (agent) {
      setName(agent.identity?.name || agent.name || "");
      setEmoji(agent.identity?.emoji || "");
      setTheme(agent.identity?.theme || "");
    }
  }, [agent]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAgent({
        id: agentId,
        identity: { name, emoji, theme },
      });
      router.push("agents");
    } catch (err) {
      console.error("Failed to update agent:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !agent) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--text-secondary)" }} />
      </div>
    );
  }

  if (!agent && !loading) {
    return (
      <div className="p-6">
        <p style={{ color: "var(--text-secondary)" }}>Agent not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("agents")}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Edit Agent
        </h1>
      </div>

      <div className="space-y-4">
        <Field label="Name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </Field>

        <Field label="Emoji">
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-20 px-3 py-2 rounded-lg border bg-transparent text-sm text-center outline-none focus:ring-2 focus:ring-blue-500/50"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
            maxLength={4}
          />
        </Field>

        <Field label="Theme / System Prompt">
          <textarea
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none resize-y focus:ring-2 focus:ring-blue-500/50"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </Field>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !isConnected}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
