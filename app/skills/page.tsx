"use client";

import { useEffect, useState } from "react";
import { useOpenClaw } from "@/contexts/OpenClawContext";
import {
  Zap,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import type { SkillInfo } from "@/lib/types";

export default function OpenClawSkillsPage() {
  const { rpc, isConnected } = useOpenClaw();
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "ready" | "missing">("all");

  const refresh = async () => {
    if (!isConnected) return;
    setLoading(true);
    setError(null);
    try {
      const result = await rpc("skills.status") as any;
      const skillList = result?.skills ?? result;
      setSkills(Array.isArray(skillList) ? skillList : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load skills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) refresh();
  }, [isConnected]);

  const isReady = (s: SkillInfo) =>
    s.eligible === true && !s.disabled && (!s.missing?.bins?.length);

  const filtered = skills.filter((s) => {
    if (filter === "ready" && !isReady(s)) return false;
    if (filter === "missing" && isReady(s)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
  });

  const readyCount = skills.filter(isReady).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Skills
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {readyCount} of {skills.length} skills ready
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

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search skills..."
          className="flex-1 max-w-md px-3 py-2 rounded-lg border bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
        <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          {(["all", "ready", "missing"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 text-xs font-medium capitalize transition-colors"
              style={{
                background: filter === f ? "var(--accent)" : "transparent",
                color: filter === f ? "#fff" : "var(--text-secondary)",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading && skills.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--text-secondary)" }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((skill) => {
            const ready = isReady(skill);
            const missingBins = skill.missing?.bins ?? [];

            return (
              <div
                key={skill.skillKey || skill.name}
                className="rounded-xl border p-4 hover:border-blue-500/30 transition-colors"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{skill.emoji || "🧩"}</span>
                    <div>
                      <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {skill.name}
                      </h3>
                      <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                        {skill.source ?? "unknown"}
                      </p>
                    </div>
                  </div>
                  {ready ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
                  )}
                </div>
                {skill.description && (
                  <p className="text-xs mt-2 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                    {skill.description}
                  </p>
                )}
                {missingBins.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] mb-1" style={{ color: "var(--text-secondary)" }}>
                      Missing:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {missingBins.map((bin) => (
                        <span
                          key={bin}
                          className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-red-500/10 text-red-400"
                        >
                          {bin}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {skill.install && skill.install.length > 0 && !ready && (
                  <div className="mt-2 flex gap-1">
                    {skill.install.slice(0, 2).map((inst) => (
                      <span
                        key={inst.id}
                        className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                        style={{ background: "var(--background)", color: "var(--text-secondary)" }}
                      >
                        {inst.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
