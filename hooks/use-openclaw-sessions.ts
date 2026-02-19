"use client";

import { useState, useCallback, useEffect } from "react";
import { useOpenClaw } from "@/contexts/OpenClawContext";
import type { SessionSummary, SessionsListParams } from "@/lib/types";

export function useOpenClawSessions(params?: SessionsListParams) {
  const { rpc, isConnected } = useOpenClaw();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isConnected) return;
    setLoading(true);
    setError(null);
    try {
      const result = await rpc("sessions.list", {
        limit: 50,
        ...params,
      }) as { sessions?: SessionSummary[] };
      setSessions(Array.isArray(result?.sessions) ? result.sessions : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, [rpc, isConnected, params]);

  useEffect(() => {
    if (isConnected) refresh();
  }, [isConnected, refresh]);

  const deleteSession = useCallback(
    async (key: string) => {
      await rpc("sessions.delete", { key });
      await refresh();
    },
    [rpc, refresh]
  );

  const resetSession = useCallback(
    async (key: string) => {
      await rpc("sessions.reset", { key });
      await refresh();
    },
    [rpc, refresh]
  );

  const compactSession = useCallback(
    async (key: string) => {
      await rpc("sessions.compact", { key });
    },
    [rpc]
  );

  return { sessions, loading, error, refresh, deleteSession, resetSession, compactSession };
}
