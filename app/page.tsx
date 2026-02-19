"use client";

import { useEffect, useState } from "react";
import { useOpenClaw } from "@/contexts/OpenClawContext";
import {
  Activity,
  Bot,
  Clock,
  Cpu,
  Radio,
  Server,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import type { HealthStatus, ChannelMeta, ChannelDetail, ModelChoice } from "@/lib/types";

export default function OpenClawOverviewPage() {
  const { isConnected, state, hello, snapshot, rpc, subscribe } = useOpenClaw();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [channelMeta, setChannelMeta] = useState<ChannelMeta[]>([]);
  const [channelDetails, setChannelDetails] = useState<Record<string, ChannelDetail>>({});
  const [agentCount, setAgentCount] = useState(0);
  const [modelCount, setModelCount] = useState(0);

  useEffect(() => {
    if (!isConnected) return;

    Promise.allSettled([
      rpc("health").then((r: any) => setHealth(r)),
      rpc("channels.status").then((r: any) => {
        if (r?.channelMeta) setChannelMeta(r.channelMeta);
        if (r?.channels) setChannelDetails(r.channels);
      }),
      rpc("models.list").then((r: any) => {
        const models = r?.models ?? r;
        setModelCount(Array.isArray(models) ? models.length : 0);
      }),
      rpc("agents.list").then((r: any) => setAgentCount(r?.agents?.length ?? 0)),
    ]);
  }, [isConnected, rpc]);

  useEffect(() => {
    if (!isConnected) return;
    return subscribe("health", (payload) => {
      if (payload && typeof payload === "object") {
        setHealth(payload as HealthStatus);
      }
    });
  }, [isConnected, subscribe]);

  const uptime = snapshot?.uptimeMs ? formatUptime(snapshot.uptimeMs) : "—";
  const serverVersion = hello?.server?.version ?? "—";
  const connectedClients = snapshot?.presence?.length ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            OpenClaw
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Personal AI Assistant Dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              isConnected
                ? "bg-green-500/10 text-green-500"
                : state === "connecting" || state === "authenticating"
                ? "bg-yellow-500/10 text-yellow-500"
                : "bg-red-500/10 text-red-500"
            }`}
          >
            {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {state === "connected"
              ? "Connected"
              : state === "connecting"
              ? "Connecting..."
              : state === "authenticating"
              ? "Authenticating..."
              : "Disconnected"}
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          icon={<Activity className="w-5 h-5" />}
          label="Health"
          value={health?.ok ? "Healthy" : health === null ? "—" : "Unhealthy"}
          color={health?.ok ? "#22c55e" : "#ef4444"}
        />
        <StatusCard
          icon={<Clock className="w-5 h-5" />}
          label="Uptime"
          value={uptime}
        />
        <StatusCard
          icon={<Server className="w-5 h-5" />}
          label="Version"
          value={serverVersion}
        />
        <StatusCard
          icon={<Wifi className="w-5 h-5" />}
          label="Connected Clients"
          value={String(connectedClients)}
        />
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ResourceCard icon={<Bot className="w-5 h-5" />} label="Agents" count={agentCount} href="agents" />
        <ResourceCard icon={<Cpu className="w-5 h-5" />} label="Models" count={modelCount} href="models" />
        <ResourceCard icon={<Radio className="w-5 h-5" />} label="Channels" count={channelMeta.length} href="channels" />
        <ResourceCard icon={<Zap className="w-5 h-5" />} label="Skills" count={0} href="skills" />
      </div>

      {/* Connected Clients / Presence */}
      {snapshot?.presence && snapshot.presence.length > 0 && (
        <div
          className="rounded-xl border p-4"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            Connected Clients
          </h2>
          <div className="space-y-2">
            {snapshot.presence.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-lg"
                style={{ background: "var(--background)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                    {p.host || p.platform || "Unknown"}
                  </span>
                  {p.mode && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "var(--border)", color: "var(--text-secondary)" }}
                    >
                      {p.mode}
                    </span>
                  )}
                </div>
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {p.version ?? ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Channels */}
      {channelMeta.length > 0 && (
        <div
          className="rounded-xl border p-4"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            Channel Status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {channelMeta.map((ch) => {
              const detail = channelDetails[ch.id];
              const isLinked = detail?.linked ?? false;
              const isConnected = detail?.connected ?? false;
              const selfNum = detail?.self?.e164;

              return (
                <div
                  key={ch.id}
                  className="flex items-center justify-between py-3 px-4 rounded-lg"
                  style={{ background: "var(--background)" }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isLinked ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    <div>
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {ch.label}
                      </span>
                      {selfNum && (
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {selfNum}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isLinked ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-400"
                    }`}
                  >
                    {isLinked ? "Linked" : "Not linked"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      className="rounded-xl border p-4 flex items-center gap-4"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="p-2 rounded-lg" style={{ background: "var(--background)" }}>
        <span style={{ color: color ?? "var(--text-secondary)" }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</p>
        <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p>
      </div>
    </div>
  );
}

function ResourceCard({
  icon,
  label,
  count,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  href: string;
}) {
  return (
    <a
      href={href}
      className="rounded-xl border p-4 flex items-center gap-4 hover:border-blue-500/50 transition-colors"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="p-2 rounded-lg" style={{ background: "var(--background)", color: "var(--text-secondary)" }}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{count}</p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</p>
      </div>
    </a>
  );
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}
