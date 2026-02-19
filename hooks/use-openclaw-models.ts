"use client";

import { useState, useCallback, useEffect } from "react";
import { useOpenClaw } from "@/contexts/OpenClawContext";
import type { ModelChoice } from "@/lib/types";

export function useOpenClawModels() {
  const { rpc, isConnected } = useOpenClaw();
  const [models, setModels] = useState<ModelChoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isConnected) return;
    setLoading(true);
    setError(null);
    try {
      const result = await rpc("models.list") as { models?: ModelChoice[] };
      setModels(Array.isArray(result?.models) ? result.models : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load models");
    } finally {
      setLoading(false);
    }
  }, [rpc, isConnected]);

  useEffect(() => {
    if (isConnected) refresh();
  }, [isConnected, refresh]);

  // Group models by provider
  const byProvider = models.reduce<Record<string, ModelChoice[]>>((acc, m) => {
    const key = m.provider;
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(m);
    return acc;
  }, {});

  return { models, byProvider, loading, error, refresh };
}
