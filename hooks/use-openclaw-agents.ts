"use client";

import { useState, useCallback, useEffect } from "react";
import { useOpenClaw } from "@/contexts/OpenClawContext";
import type { AgentSummary } from "@/lib/types";

export function useOpenClawAgents() {
  const { rpc, isConnected } = useOpenClaw();
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [defaultId, setDefaultId] = useState<string>("main");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isConnected) return;
    setLoading(true);
    setError(null);
    try {
      const result = (await rpc("agents.list")) as any;
      setAgents(result?.agents ?? []);
      if (result?.defaultId) setDefaultId(result.defaultId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, [rpc, isConnected]);

  useEffect(() => {
    if (isConnected) refresh();
  }, [isConnected, refresh]);

  const createAgent = useCallback(
    async (agent: Partial<AgentSummary>) => {
      await rpc("agents.create", agent as any);
      await refresh();
    },
    [rpc, refresh]
  );

  const updateAgent = useCallback(
    async (agent: Partial<AgentSummary> & { id: string }) => {
      await rpc("agents.update", agent);
      await refresh();
    },
    [rpc, refresh]
  );

  const deleteAgent = useCallback(
    async (id: string) => {
      await rpc("agents.delete", { id });
      await refresh();
    },
    [rpc, refresh]
  );

  return { agents, defaultId, loading, error, refresh, createAgent, updateAgent, deleteAgent };
}
