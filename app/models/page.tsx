"use client";

import { useState } from "react";
import { useOpenClawModels } from "@/hooks/use-openclaw-models";
import { useOpenClaw } from "@/contexts/OpenClawContext";
import { Cpu, RefreshCw, Loader2, Brain, AlertCircle, Filter } from "lucide-react";
import type { ModelChoice } from "@/lib/types";

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#10a37f",
  anthropic: "#d97706",
  google: "#4285f4",
  groq: "#f97316",
  ollama: "#888",
  mistral: "#ff7000",
  deepseek: "#0ea5e9",
  xai: "#333",
};

// Providers that are configured locally (have API keys or are local)
const CONFIGURED_PROVIDERS = new Set(["ollama", "google"]);

export default function OpenClawModelsPage() {
  const { isConnected } = useOpenClaw();
  const { models, byProvider, loading, error, refresh } = useOpenClawModels();
  const [showAll, setShowAll] = useState(false);

  const filteredProviders = showAll
    ? Object.entries(byProvider)
    : Object.entries(byProvider).filter(([p]) => CONFIGURED_PROVIDERS.has(p.toLowerCase()));

  const filteredCount = filteredProviders.reduce((n, [, m]) => n + m.length, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Models
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {showAll
              ? `${models.length} models from ${Object.keys(byProvider).length} providers`
              : `${filteredCount} configured models`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: showAll ? "var(--accent)" : "var(--card)",
              color: showAll ? "#fff" : "var(--text-secondary)",
              borderColor: "var(--border)",
              borderWidth: 1,
            }}
          >
            <Filter className="w-3 h-3" />
            {showAll ? "All providers" : "Configured only"}
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {!isConnected && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm" style={{ background: "var(--card)", color: "var(--text-secondary)" }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          Connecting to gateway...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading && models.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--text-secondary)" }} />
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="text-center py-20" style={{ color: "var(--text-secondary)" }}>
          <Cpu className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No models found</p>
        </div>
      ) : (
        filteredProviders.map(([provider, providerModels]) => (
          <div key={provider}>
            <h2
              className="text-sm font-semibold mb-3 flex items-center gap-2 capitalize"
              style={{ color: "var(--text-primary)" }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: PROVIDER_COLORS[provider.toLowerCase()] || "#888" }}
              />
              {provider}
              <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>
                ({providerModels.length})
              </span>
              {CONFIGURED_PROVIDERS.has(provider.toLowerCase()) && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-500">
                  configured
                </span>
              )}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {providerModels.map((model) => (
                <ModelCard key={`${provider}/${model.id}`} model={model} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ModelCard({ model }: { model: ModelChoice }) {
  const color = PROVIDER_COLORS[model.provider.toLowerCase()] || "#888";

  return (
    <div
      className="rounded-xl border p-4 hover:border-blue-500/30 transition-colors"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4" style={{ color }} />
          <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {model.name}
          </h3>
        </div>
        {model.reasoning && (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
            <Brain className="w-3 h-3" />
            Reasoning
          </span>
        )}
      </div>
      <p className="text-xs mt-2 font-mono" style={{ color: "var(--text-secondary)" }}>
        {model.provider}/{model.id}
      </p>
      <div className="flex items-center gap-3 mt-2">
        {model.contextWindow && (
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Context: {model.contextWindow >= 1000000 ? `${(model.contextWindow / 1000000).toFixed(1)}M` : `${(model.contextWindow / 1000).toFixed(0)}K`}
          </p>
        )}
        {model.input && model.input.length > 0 && (
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Input: {model.input.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
