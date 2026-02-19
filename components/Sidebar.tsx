"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOpenClaw } from "@/contexts/OpenClawContext";
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  List,
  Cpu,
  Mic,
  Server,
  Zap,
  Radio,
  Clock,
  Settings,
  ScrollText,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/sessions", label: "Sessions", icon: List },
  { href: "/models", label: "Models", icon: Cpu },
  { href: "/voice", label: "Voice & STT", icon: Mic },
  { href: "/nodes", label: "Nodes", icon: Server },
  { href: "/skills", label: "Skills", icon: Zap },
  { href: "/channels", label: "Channels", icon: Radio },
  { href: "/cron", label: "Cron", icon: Clock },
  { href: "/config", label: "Config", icon: Settings },
  { href: "/logs", label: "Logs", icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { state, isConnected } = useOpenClaw();

  return (
    <aside
      className="w-56 flex-shrink-0 border-r flex flex-col h-full"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🦞</span>
          <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            OpenClaw
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">
            Dashboard
          </span>
        </div>
      </div>

      {/* Connection status */}
      <div className="px-4 py-2 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          {state === "connected" ? (
            <Wifi className="w-3.5 h-3.5 text-green-500" />
          ) : state === "connecting" || state === "authenticating" ? (
            <Loader2 className="w-3.5 h-3.5 text-yellow-500 animate-spin" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-red-500" />
          )}
          <span
            className="text-[11px] font-medium"
            style={{
              color: isConnected
                ? "#22c55e"
                : state === "connecting" || state === "authenticating"
                  ? "#eab308"
                  : "#ef4444",
            }}
          >
            {state === "connected"
              ? "Connected"
              : state === "connecting"
                ? "Connecting..."
                : state === "authenticating"
                  ? "Authenticating..."
                  : state === "error"
                    ? "Error"
                    : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-600/10 text-blue-400 font-medium"
                  : "hover:bg-white/5"
              }`}
              style={!isActive ? { color: "var(--text-secondary)" } : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-4 py-3 border-t text-[10px]"
        style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
      >
        OpenClaw Dashboard
      </div>
    </aside>
  );
}
