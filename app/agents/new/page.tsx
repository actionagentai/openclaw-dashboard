"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOpenClaw } from "@/contexts/OpenClawContext";
import { useOpenClawAgents } from "@/hooks/use-openclaw-agents";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function NewAgentPage() {
  const router = useRouter();
  const { isConnected } = useOpenClaw();
  const { createAgent } = useOpenClawAgents();

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🤖");
  const [theme, setTheme] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createAgent({
        name,
        identity: { name, emoji, theme },
      });
      router.push("agents");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setSaving(false);
    }
  };

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
          New Agent
        </h1>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Agent"
            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Emoji
          </label>
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-20 px-3 py-2 rounded-lg border bg-transparent text-sm text-center outline-none focus:ring-2 focus:ring-blue-500/50"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            maxLength={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Theme / System Prompt
          </label>
          <textarea
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            rows={6}
            placeholder="You are a helpful assistant..."
            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none resize-y focus:ring-2 focus:ring-blue-500/50"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleCreate}
            disabled={saving || !isConnected}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Agent
          </button>
        </div>
      </div>
    </div>
  );
}
