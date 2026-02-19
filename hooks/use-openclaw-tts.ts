"use client";

import { useState, useCallback, useEffect } from "react";
import { useOpenClaw } from "@/contexts/OpenClawContext";
import type { TTSStatus, TTSProviderInfo } from "@/lib/types";

export function useOpenClawTTS() {
  const { rpc, isConnected } = useOpenClaw();
  const [status, setStatus] = useState<TTSStatus | null>(null);
  const [providers, setProviders] = useState<TTSProviderInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isConnected) return;
    setLoading(true);
    setError(null);
    try {
      const [ttsStatus, ttsProviders] = await Promise.all([
        rpc("tts.status"),
        rpc("tts.providers"),
      ]);
      setStatus(ttsStatus as any);
      const provResult = ttsProviders as any;
      const provList = provResult?.providers ?? provResult;
      setProviders(Array.isArray(provList) ? provList : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load TTS status");
    } finally {
      setLoading(false);
    }
  }, [rpc, isConnected]);

  useEffect(() => {
    if (isConnected) refresh();
  }, [isConnected, refresh]);

  const enable = useCallback(async () => {
    await rpc("tts.enable");
    await refresh();
  }, [rpc, refresh]);

  const disable = useCallback(async () => {
    await rpc("tts.disable");
    await refresh();
  }, [rpc, refresh]);

  const setProvider = useCallback(
    async (provider: string, voice?: string) => {
      await rpc("tts.setProvider", { provider, ...(voice ? { voice } : {}) });
      await refresh();
    },
    [rpc, refresh]
  );

  const convert = useCallback(
    async (text: string) => {
      return rpc("tts.convert", { text });
    },
    [rpc]
  );

  return { status, providers, loading, error, refresh, enable, disable, setProvider, convert };
}
