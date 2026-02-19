// OpenClaw Gateway WebSocket Client
// Ported from openclaw/ui/src/ui/gateway.ts to plain TypeScript (no Lit dependency)

import type {
  EventFrame,
  ResponseFrame,
  HelloOk,
  GatewayConnectionState,
  GatewayEventName,
  GatewayEventMap,
  RPCMethodMap,
  RPCParams,
  RPCResult,
} from "./types";

type Pending = {
  resolve: (value: unknown) => void;
  reject: (err: unknown) => void;
  timer?: ReturnType<typeof setTimeout>;
};

type EventListener<E extends GatewayEventName = GatewayEventName> = (
  payload: GatewayEventMap[E]
) => void;

export type GatewayClientOptions = {
  url: string;
  token?: string;
  password?: string;
  clientName?: string;
  clientVersion?: string;
  instanceId?: string;
  autoConnect?: boolean;
  rpcTimeoutMs?: number;
  onStateChange?: (state: GatewayConnectionState) => void;
  onHello?: (hello: HelloOk) => void;
  onEvent?: (evt: EventFrame) => void;
  onError?: (error: Error) => void;
};

const CONNECT_FAILED_CODE = 4008;

export class GatewayClient {
  private ws: WebSocket | null = null;
  private pending = new Map<string, Pending>();
  private listeners = new Map<string, Set<EventListener>>();
  private closed = false;
  private lastSeq: number | null = null;
  private connectNonce: string | null = null;
  private connectSent = false;
  private connectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private backoffMs = 800;
  private opts: Required<
    Pick<GatewayClientOptions, "url" | "rpcTimeoutMs">
  > &
    GatewayClientOptions;

  state: GatewayConnectionState = "disconnected";
  hello: HelloOk | null = null;
  error: Error | null = null;

  constructor(options: GatewayClientOptions) {
    this.opts = {
      rpcTimeoutMs: 30_000,
      ...options,
    };
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  connect() {
    this.closed = false;
    this.error = null;
    this.setState("connecting");
    this.doConnect();
  }

  disconnect() {
    this.closed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.flushPending(new Error("gateway client stopped"));
    this.setState("disconnected");
  }

  get isConnected() {
    return this.state === "connected";
  }

  // ─── RPC ────────────────────────────────────────────────────────────────

  async rpc<M extends keyof RPCMethodMap>(
    method: M,
    ...args: RPCParams<M> extends void ? [] : [RPCParams<M>]
  ): Promise<RPCResult<M>> {
    const params = args[0];
    return this.request(method, params) as Promise<RPCResult<M>>;
  }

  request<T = unknown>(method: string, params?: unknown): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("gateway not connected"));
    }
    const id = crypto.randomUUID();
    const frame = { type: "req", id, method, params };

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`RPC timeout: ${method} (${this.opts.rpcTimeoutMs}ms)`));
      }, this.opts.rpcTimeoutMs);

      this.pending.set(id, {
        resolve: (v) => resolve(v as T),
        reject,
        timer,
      });
      this.ws!.send(JSON.stringify(frame));
    });
  }

  // ─── Event Subscription ─────────────────────────────────────────────────

  on<E extends GatewayEventName>(
    event: E,
    callback: (payload: GatewayEventMap[E]) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(callback as EventListener);

    return () => {
      set.delete(callback as EventListener);
      if (set.size === 0) this.listeners.delete(event);
    };
  }

  // ─── Internal ───────────────────────────────────────────────────────────

  private setState(s: GatewayConnectionState) {
    if (this.state === s) return;
    this.state = s;
    this.opts.onStateChange?.(s);
  }

  private doConnect() {
    if (this.closed) return;

    try {
      this.ws = new WebSocket(this.opts.url);
    } catch (err) {
      this.error = err instanceof Error ? err : new Error(String(err));
      this.setState("error");
      this.scheduleReconnect();
      return;
    }

    this.ws.addEventListener("open", () => {
      this.setState("authenticating");
      this.queueConnect();
    });

    this.ws.addEventListener("message", (ev) => {
      this.handleMessage(String(ev.data ?? ""));
    });

    this.ws.addEventListener("close", (ev) => {
      this.ws = null;
      this.flushPending(
        new Error(`gateway closed (${ev.code}): ${ev.reason ?? ""}`)
      );
      if (!this.closed) {
        this.setState("disconnected");
        this.scheduleReconnect();
      }
    });

    this.ws.addEventListener("error", () => {
      // Close handler will fire
    });
  }

  private scheduleReconnect() {
    if (this.closed) return;
    const delay = this.backoffMs;
    this.backoffMs = Math.min(this.backoffMs * 1.7, 15_000);
    this.reconnectTimer = setTimeout(() => {
      this.setState("connecting");
      this.doConnect();
    }, delay);
  }

  private flushPending(err: Error) {
    for (const [, p] of this.pending) {
      if (p.timer) clearTimeout(p.timer);
      p.reject(err);
    }
    this.pending.clear();
  }

  private queueConnect() {
    this.connectNonce = null;
    this.connectSent = false;
    if (this.connectTimer) clearTimeout(this.connectTimer);
    // Wait briefly for challenge nonce, then send connect anyway
    this.connectTimer = setTimeout(() => {
      this.sendConnect();
    }, 750);
  }

  private sendConnect() {
    if (this.connectSent) return;
    this.connectSent = true;
    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }

    const auth =
      this.opts.token || this.opts.password
        ? { token: this.opts.token, password: this.opts.password }
        : undefined;

    const params = {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: this.opts.clientName ?? "openclaw-control-ui",
        version: this.opts.clientVersion ?? "1.0.0",
        platform: typeof navigator !== "undefined" ? navigator.platform : "web",
        mode: "webchat",
        instanceId: this.opts.instanceId,
      },
      role: "operator",
      scopes: ["operator.admin", "operator.approvals", "operator.pairing"],
      caps: [],
      auth,
      locale: typeof navigator !== "undefined" ? navigator.language : "en",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    };

    this.request<HelloOk>("connect", params)
      .then((hello) => {
        this.hello = hello;
        this.backoffMs = 800;
        this.setState("connected");
        this.opts.onHello?.(hello);
      })
      .catch((err) => {
        this.error = err instanceof Error ? err : new Error(String(err));
        this.setState("error");
        this.opts.onError?.(this.error);
        this.ws?.close(CONNECT_FAILED_CODE, "connect failed");
      });
  }

  private handleMessage(raw: string) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }

    const frame = parsed as { type?: string };

    if (frame.type === "event") {
      const evt = parsed as EventFrame;

      // Handle connect challenge
      if (evt.event === "connect.challenge") {
        const payload = evt.payload as { nonce?: string } | undefined;
        if (payload?.nonce) {
          this.connectNonce = payload.nonce;
          this.sendConnect();
        }
        return;
      }

      // Sequence gap detection
      const seq = typeof evt.seq === "number" ? evt.seq : null;
      if (seq !== null && this.lastSeq !== null && seq > this.lastSeq + 1) {
        console.warn(
          `[openclaw] event sequence gap: expected ${this.lastSeq + 1}, got ${seq}`
        );
      }
      if (seq !== null) this.lastSeq = seq;

      // Notify global handler
      this.opts.onEvent?.(evt);

      // Notify typed listeners
      const listeners = this.listeners.get(evt.event);
      if (listeners) {
        for (const cb of listeners) {
          try {
            cb(evt.payload as never);
          } catch (err) {
            console.error("[openclaw] event listener error:", err);
          }
        }
      }
      return;
    }

    if (frame.type === "res") {
      const res = parsed as ResponseFrame;
      const pending = this.pending.get(res.id);
      if (!pending) return;
      this.pending.delete(res.id);
      if (pending.timer) clearTimeout(pending.timer);
      if (res.ok) {
        pending.resolve(res.payload);
      } else {
        pending.reject(
          new Error(res.error?.message ?? "request failed")
        );
      }
    }
  }
}
