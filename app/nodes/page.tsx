"use client";

import { useState } from "react";
import { useOpenClawNodes } from "@/hooks/use-openclaw-nodes";
import { useOpenClaw } from "@/contexts/OpenClawContext";
import {
  Server,
  Smartphone,
  RefreshCw,
  Loader2,
  Check,
  X,
  Trash2,
  Edit2,
  Monitor,
  AlertCircle,
} from "lucide-react";

export default function OpenClawNodesPage() {
  const { isConnected } = useOpenClaw();
  const {
    nodes,
    devices,
    loading,
    error,
    refresh,
    renameNode,
    approveDevice,
    rejectDevice,
    removeDevice,
  } = useOpenClawNodes();
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleRename = async (nodeId: string) => {
    if (!editName.trim()) return;
    await renameNode(nodeId, editName.trim());
    setEditingNode(null);
    setEditName("");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Nodes & Devices
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Manage connected nodes and paired devices
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

      {/* Nodes */}
      <div>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Server className="w-4 h-4" />
          Nodes ({nodes.length})
        </h2>
        {loading && nodes.length === 0 ? (
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-secondary)" }} />
        ) : nodes.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No nodes connected</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nodes.map((node) => (
              <div
                key={node.id}
                className="rounded-xl border p-4"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: "var(--background)" }}>
                      <Monitor className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
                    </div>
                    <div>
                      {editingNode === node.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleRename(node.id)}
                            className="px-2 py-0.5 rounded border bg-transparent text-sm outline-none"
                            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                            autoFocus
                          />
                          <button onClick={() => handleRename(node.id)}>
                            <Check className="w-3 h-3 text-green-500" />
                          </button>
                          <button onClick={() => setEditingNode(null)}>
                            <X className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                            {node.displayName || node.id}
                          </h3>
                          <button
                            onClick={() => { setEditingNode(node.id); setEditName(node.displayName || ""); }}
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <Edit2 className="w-3 h-3" style={{ color: "var(--text-secondary)" }} />
                          </button>
                        </div>
                      )}
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        {node.platform ?? "unknown"} {node.version ? `v${node.version}` : ""}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      node.status === "connected" || !node.status ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                </div>
                {node.caps && node.caps.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {node.caps.map((cap) => (
                      <span
                        key={cap}
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: "var(--background)", color: "var(--text-secondary)" }}
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Devices */}
      <div>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Smartphone className="w-4 h-4" />
          Paired Devices ({devices.length})
        </h2>
        {devices.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No paired devices</p>
        ) : (
          <div className="space-y-2">
            {devices.map((device) => (
              <div
                key={device.deviceId}
                className="flex items-center justify-between px-4 py-3 rounded-xl border"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {device.displayName || device.deviceId}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {device.role} {device.platform ? `| ${device.platform}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => removeDevice(device.deviceId)}
                  className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
