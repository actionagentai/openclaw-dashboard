"use client";

import { useEffect, useState } from "react";
import { useOpenClaw } from "@/contexts/OpenClawContext";
import {
  Radio,
  RefreshCw,
  Loader2,
  LogOut,
  Wifi,
  WifiOff,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import type { ChannelMeta, ChannelDetail } from "@/lib/types";

export default function OpenClawChannelsPage() {
  const { rpc, isConnected } = useOpenClaw();
  const [channelMeta, setChannelMeta] = useState<ChannelMeta[]>([]);
  const [channelDetails, setChannelDetails] = useState<Record<string, ChannelDetail>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!isConnected) return;
    setLoading(true);
    setError(null);
    try {
      const result = await rpc("channels.status") as any;
      if (result?.channelMeta) setChannelMeta(result.channelMeta);
      if (result?.channels) setChannelDetails(result.channels);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load channels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) refresh();
  }, [isConnected]);

  const handleLogout = async (id: string) => {
    try {
      await rpc("channels.logout", { id });
      await refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const linkedCount = channelMeta.filter((c) => channelDetails[c.id]?.linked).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Channels
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {linkedCount} of {channelMeta.length} channels linked
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

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading && channelMeta.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--text-secondary)" }} />
        </div>
      ) : channelMeta.length === 0 ? (
        <div className="text-center py-20">
          <Radio className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: "var(--text-secondary)" }} />
          <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>
            No channels configured
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Configure messaging channels in your OpenClaw config
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {channelMeta.map((ch) => {
            const detail = channelDetails[ch.id];
            const isLinked = detail?.linked ?? false;
            const hasError = !!detail?.lastError;
            const selfNum = detail?.self?.e164;
            const authAge = detail?.authAgeMs
              ? formatAge(detail.authAgeMs)
              : null;

            return (
              <div
                key={ch.id}
                className="flex items-center justify-between px-4 py-4 rounded-xl border"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-lg ${
                      isLinked ? "bg-green-500/10" : hasError ? "bg-red-500/10" : "bg-gray-500/10"
                    }`}
                  >
                    {isLinked ? (
                      <Wifi className="w-5 h-5 text-green-500" />
                    ) : hasError ? (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : (
                      <WifiOff className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {ch.label}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {ch.detailLabel && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "var(--background)", color: "var(--text-secondary)" }}
                        >
                          {ch.detailLabel}
                        </span>
                      )}
                      {selfNum && (
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {selfNum}
                        </span>
                      )}
                      {authAge && (
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          auth {authAge} ago
                        </span>
                      )}
                    </div>
                    {detail?.lastError && (
                      <p className="text-xs text-red-400 mt-1">{detail.lastError}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      isLinked ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-400"
                    }`}
                  >
                    {isLinked ? "Linked" : "Not linked"}
                  </span>
                  {isLinked && (
                    <button
                      onClick={() => handleLogout(ch.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-3 h-3" />
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatAge(ms: number): string {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  return `${hr}h`;
}
