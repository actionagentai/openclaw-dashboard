"use client";

import React, { createContext, useContext, type ReactNode } from "react";
import { useOpenClawGateway } from "@/hooks/use-openclaw-gateway";
import type {
  GatewayConnectionState,
  HelloOk,
  GatewayEventName,
  GatewayEventMap,
  RPCMethodMap,
  RPCParams,
  RPCResult,
  Snapshot,
} from "@/lib/types";

interface OpenClawContextValue {
  state: GatewayConnectionState;
  isConnected: boolean;
  hello: HelloOk | null;
  snapshot: Snapshot | null;
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

const OpenClawContext = createContext<OpenClawContextValue | undefined>(undefined);

export function OpenClawProvider({ children }: { children: ReactNode }) {
  const gateway = useOpenClawGateway({ autoConnect: true });

  const value: OpenClawContextValue = {
    ...gateway,
    snapshot: gateway.hello?.snapshot ?? null,
  };

  return (
    <OpenClawContext.Provider value={value}>
      {children}
    </OpenClawContext.Provider>
  );
}

export function useOpenClaw() {
  const context = useContext(OpenClawContext);
  if (context === undefined) {
    throw new Error("useOpenClaw must be used within an OpenClawProvider");
  }
  return context;
}
