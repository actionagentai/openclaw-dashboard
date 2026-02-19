"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  GatewayClient,
  type GatewayClientOptions,
} from "@/lib/gateway-client";
import type {
  GatewayConnectionState,
  HelloOk,
  EventFrame,
  GatewayEventName,
  GatewayEventMap,
  RPCMethodMap,
  RPCParams,
  RPCResult,
} from "@/lib/types";

interface UseOpenClawGatewayOptions {
  url?: string;
  token?: string;
  autoConnect?: boolean;
}

interface UseOpenClawGatewayReturn {
  state: GatewayConnectionState;
  isConnected: boolean;
  hello: HelloOk | null;
  error: Error | null;
  rpc: <M extends keyof RPCMethodMap>(
    method: M,
    ...args: RPCParams<M> extends void ? [] : [RPCParams<M>]
  ) => Promise<RPCResult<M>>;
  subscribe: <E extends GatewayEventName>(
    event: E,
    callback: (payload: GatewayEventMap[E]) => void
  ) => () => void;
  connect: () => void;
  disconnect: () => void;
}

export function useOpenClawGateway(
  options: UseOpenClawGatewayOptions = {}
): UseOpenClawGatewayReturn {
  const {
    url = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL ?? "ws://localhost:18789",
    token = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN,
    autoConnect = true,
  } = options;

  const [state, setState] = useState<GatewayConnectionState>("disconnected");
  const [hello, setHello] = useState<HelloOk | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const clientRef = useRef<GatewayClient | null>(null);

  // Initialize client once
  useEffect(() => {
    const client = new GatewayClient({
      url,
      ...(token ? { token } : {}),
      onStateChange: setState,
      onHello: setHello,
      onError: setError,
    });

    clientRef.current = client;

    if (autoConnect) {
      client.connect();
    }

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [url, token, autoConnect]);

  const rpc = useCallback(
    <M extends keyof RPCMethodMap>(
      method: M,
      ...args: RPCParams<M> extends void ? [] : [RPCParams<M>]
    ): Promise<RPCResult<M>> => {
      if (!clientRef.current) {
        return Promise.reject(new Error("Gateway client not initialized"));
      }
      return clientRef.current.rpc(method, ...args);
    },
    []
  );

  const subscribe = useCallback(
    <E extends GatewayEventName>(
      event: E,
      callback: (payload: GatewayEventMap[E]) => void
    ): (() => void) => {
      if (!clientRef.current) return () => {};
      return clientRef.current.on(event, callback);
    },
    []
  );

  const connect = useCallback(() => {
    clientRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
  }, []);

  return {
    state,
    isConnected: state === "connected",
    hello,
    error,
    rpc,
    subscribe,
    connect,
    disconnect,
  };
}
