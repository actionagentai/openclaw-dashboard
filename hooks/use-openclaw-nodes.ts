"use client";

import { useState, useCallback, useEffect } from "react";
import { useOpenClaw } from "@/contexts/OpenClawContext";
import type { NodeInfo, DeviceInfo } from "@/lib/types";

export function useOpenClawNodes() {
  const { rpc, isConnected } = useOpenClaw();
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isConnected) return;
    setLoading(true);
    setError(null);
    try {
      const [nodeResult, deviceResult] = await Promise.all([
        rpc("node.list").catch(() => []),
        rpc("device.pair.list").catch(() => []),
      ]);
      const nodeList = (nodeResult as any)?.nodes ?? (Array.isArray(nodeResult) ? nodeResult : []);
      setNodes(nodeList);
      const deviceList = (deviceResult as any)?.devices ?? (Array.isArray(deviceResult) ? deviceResult : []);
      setDevices(deviceList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load nodes");
    } finally {
      setLoading(false);
    }
  }, [rpc, isConnected]);

  useEffect(() => {
    if (isConnected) refresh();
  }, [isConnected, refresh]);

  const approveDevice = useCallback(
    async (deviceId: string) => {
      await rpc("device.pair.approve", { deviceId });
      await refresh();
    },
    [rpc, refresh]
  );

  const rejectDevice = useCallback(
    async (deviceId: string) => {
      await rpc("device.pair.reject", { deviceId });
      await refresh();
    },
    [rpc, refresh]
  );

  const removeDevice = useCallback(
    async (deviceId: string) => {
      await rpc("device.pair.remove", { deviceId });
      await refresh();
    },
    [rpc, refresh]
  );

  const renameNode = useCallback(
    async (nodeId: string, displayName: string) => {
      await rpc("node.rename", { nodeId, displayName });
      await refresh();
    },
    [rpc, refresh]
  );

  return {
    nodes,
    devices,
    loading,
    error,
    refresh,
    approveDevice,
    rejectDevice,
    removeDevice,
    renameNode,
  };
}
