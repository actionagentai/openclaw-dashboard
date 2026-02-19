"use client";

import { useEffect, useState, useCallback } from "react";
import { useOpenClaw } from "@/contexts/OpenClawContext";
import {
  Settings,
  RefreshCw,
  Loader2,
  Save,
  AlertCircle,
  Check,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

type ConfigData = {
  path?: string;
  config?: Record<string, unknown>;
  resolved?: Record<string, unknown>;
};

export default function OpenClawConfigPage() {
  const { rpc, isConnected } = useOpenClaw();
  const [configData, setConfigData] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isConnected) return;
    setLoading(true);
    setError(null);
    try {
      const result = await rpc("config.get") as any;
      setConfigData({
        path: result?.path,
        config: result?.config ?? result?.parsed ?? result,
        resolved: result?.resolved,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load config");
    } finally {
      setLoading(false);
    }
  }, [rpc, isConnected]);

  useEffect(() => {
    if (isConnected) refresh();
  }, [isConnected, refresh]);

  const handleSave = async () => {
    if (!editKey) return;
    setSaving(true);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(editValue);
      } catch {
        parsed = editValue;
      }
      await rpc("config.set", { key: editKey, value: parsed });
      setSaved(editKey);
      setEditKey(null);
      setTimeout(() => setSaved(null), 2000);
      await refresh();
    } catch (err) {
      console.error("Config save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const config = configData?.config ?? {};

  // Top-level sections from the config
  const sections = Object.keys(config).filter((key) => {
    if (!search) return true;
    const q = search.toLowerCase();
    // Check if section name or any nested key matches
    if (key.toLowerCase().includes(q)) return true;
    const val = JSON.stringify(config[key] ?? "").toLowerCase();
    return val.includes(q);
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Configuration
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            OpenClaw system settings
            {configData?.path && (
              <span className="ml-2 font-mono text-xs opacity-60">
                {configData.path}
              </span>
            )}
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

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search config..."
        className="w-full max-w-md px-3 py-2 rounded-lg border bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
        style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
      />

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading && !configData ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--text-secondary)" }} />
        </div>
      ) : sections.length === 0 ? (
        <div className="text-center py-20">
          <Settings className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: "var(--text-secondary)" }} />
          <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>
            No config data
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section) => (
            <ConfigSection
              key={section}
              name={section}
              data={config[section]}
              prefix={section}
              editKey={editKey}
              editValue={editValue}
              saving={saving}
              saved={saved}
              onEdit={(key, value) => {
                setEditKey(key);
                setEditValue(typeof value === "string" ? value : JSON.stringify(value, null, 2));
              }}
              onSave={handleSave}
              onCancel={() => setEditKey(null)}
              onEditValueChange={setEditValue}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ConfigSection({
  name,
  data,
  prefix,
  editKey,
  editValue,
  saving,
  saved,
  onEdit,
  onSave,
  onCancel,
  onEditValueChange,
}: {
  name: string;
  data: unknown;
  prefix: string;
  editKey: string | null;
  editValue: string;
  saving: boolean;
  saved: string | null;
  onEdit: (key: string, value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  onEditValueChange: (v: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const isObject = data !== null && typeof data === "object" && !Array.isArray(data);
  const entries = isObject ? Object.entries(data as Record<string, unknown>) : [];

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        ) : (
          <ChevronRight className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        )}
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {name}
        </span>
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {isObject ? `${entries.length} keys` : typeof data}
        </span>
      </button>

      {expanded && (
        <div className="border-t" style={{ borderColor: "var(--border)" }}>
          {isObject ? (
            entries.map(([key, value]) => {
              const fullKey = `${prefix}.${key}`;
              const isNested = value !== null && typeof value === "object";
              const isEditing = editKey === fullKey;
              const isSaved = saved === fullKey;
              const displayValue = isNested
                ? JSON.stringify(value, null, 2)
                : String(value ?? "");
              const isRedacted = displayValue.includes("__OPENCLAW_REDACTED__");

              return (
                <div
                  key={key}
                  className="px-4 py-2.5 border-t first:border-t-0"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-mono font-medium" style={{ color: "var(--text-primary)" }}>
                        {fullKey}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isSaved && <Check className="w-3.5 h-3.5 text-green-500" />}
                      {!isEditing && !isRedacted && (
                        <button
                          onClick={() => onEdit(fullKey, value)}
                          className="text-[10px] px-1.5 py-0.5 rounded text-blue-400 hover:bg-blue-500/10"
                        >
                          edit
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-1.5 space-y-2">
                      <textarea
                        value={editValue}
                        onChange={(e) => onEditValueChange(e.target.value)}
                        rows={isNested ? Math.min(displayValue.split("\n").length, 10) : 1}
                        className="w-full px-2 py-1.5 rounded border bg-transparent text-xs font-mono outline-none focus:ring-1 focus:ring-blue-500/50"
                        style={{
                          borderColor: "var(--primary, #3b82f6)",
                          color: "var(--text-primary)",
                        }}
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={onSave}
                          disabled={saving}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-600 text-white hover:bg-blue-700"
                        >
                          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          Save
                        </button>
                        <button
                          onClick={onCancel}
                          className="px-2 py-1 rounded text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <pre
                      className="mt-1 text-xs font-mono whitespace-pre-wrap break-all"
                      style={{
                        color: isRedacted ? "var(--text-secondary)" : "var(--text-primary)",
                        opacity: isRedacted ? 0.5 : 0.8,
                      }}
                    >
                      {isNested
                        ? displayValue.length > 200
                          ? displayValue.substring(0, 200) + "..."
                          : displayValue
                        : displayValue}
                    </pre>
                  )}
                </div>
              );
            })
          ) : (
            <div className="px-4 py-3">
              <pre
                className="text-xs font-mono whitespace-pre-wrap"
                style={{ color: "var(--text-primary)", opacity: 0.8 }}
              >
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
