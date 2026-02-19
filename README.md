# OpenClaw Dashboard

A React/Next.js visual dashboard for the [OpenClaw](https://github.com/openclaw/openclaw) AI gateway. Every CLI command represented as a visual UI page, with **speech-to-text everywhere** as a first-class feature.

![OpenClaw Dashboard](screenshots/dashboard-tour.gif)

## What is this?

OpenClaw is a self-hosted AI assistant gateway with 35+ CLI commands, 50+ skills, and 20+ messaging channel integrations. This dashboard provides a modern web interface for managing and interacting with your OpenClaw gateway — no terminal required.

### Pages

| Page | CLI Equivalent | Description |
|------|---------------|-------------|
| **Overview** | `openclaw status` / `openclaw health` | Gateway health, channel status, agent overview |
| **Chat** | `openclaw agent --message` | Real-time chat with streaming responses |
| **Agents** | `openclaw agents list/add/delete` | Create, edit, and manage AI agents |
| **Sessions** | `openclaw sessions` | Browse and manage conversation sessions |
| **Models** | `openclaw models list` | View available LLM models by provider |
| **Voice & STT** | `openclaw tts` / `openclaw talk` | TTS testing, speech recognition, talk mode |
| **Nodes** | `openclaw nodes` / `openclaw devices` | Connected nodes and device pairing |
| **Skills** | `openclaw skills list` | Browse skills with eligibility and install status |
| **Channels** | `openclaw channels` | WhatsApp QR login, channel linking, status |
| **Cron** | `openclaw cron list/add/run` | Scheduled job management |
| **Config** | `openclaw config get/set` | Live config editor with collapsible tree view |
| **Logs** | `openclaw logs` | Real-time log streaming |

### Key Features

- **Speech-to-text everywhere** — Floating mic button (Cmd+Shift+M) injects voice transcription into any input field
- **Real-time WebSocket** — Direct connection to the OpenClaw gateway protocol (v3)
- **Streaming chat** — Token-by-token response streaming with abort support
- **Typed RPC client** — Full TypeScript types for all 80+ gateway methods
- **Zero database** — Pure WebSocket client, all data lives in OpenClaw

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [OpenClaw](https://github.com/openclaw/openclaw) gateway running (`openclaw gateway start`)

### Setup

```bash
# Clone
git clone https://github.com/actionagentai/openclaw-dashboard.git
cd openclaw-dashboard

# Install dependencies
npm install

# Configure gateway URL (optional — defaults to ws://localhost:18789)
cp .env.example .env.local
# Edit .env.local if your gateway runs on a different port

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and the dashboard will auto-connect to your running OpenClaw gateway.

### Gateway Configuration

If your gateway requires authentication, add the token to `.env.local`:

```
NEXT_PUBLIC_OPENCLAW_GATEWAY_URL=ws://localhost:18789
NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN=your-token-here
```

You may also need to allow the dashboard origin in your `openclaw.json`:

```json
{
  "gateway": {
    "controlUi": {
      "allowedOrigins": ["http://localhost:3000"],
      "allowInsecureAuth": true
    }
  }
}
```

## Architecture

```
openclaw-dashboard/
├── app/                    # Next.js App Router pages (12 pages + API)
│   ├── page.tsx            # Overview (health, channels, agents)
│   ├── chat/page.tsx       # Streaming chat interface
│   ├── agents/page.tsx     # Agent CRUD
│   ├── sessions/page.tsx   # Session browser
│   ├── models/page.tsx     # Model catalog
│   ├── voice/page.tsx      # TTS/STT/Talk mode
│   ├── nodes/page.tsx      # Node & device management
│   ├── skills/page.tsx     # Skills marketplace
│   ├── channels/page.tsx   # Channel status
│   ├── cron/page.tsx       # Cron scheduler
│   ├── config/page.tsx     # Config tree editor
│   ├── logs/page.tsx       # Log viewer
│   └── api/tts-audio/      # TTS audio file proxy
├── lib/
│   ├── gateway-client.ts   # WebSocket client (challenge-nonce auth, auto-reconnect)
│   └── types.ts            # Full wire protocol types (80+ RPC methods, 17 events)
├── hooks/
│   ├── use-openclaw-gateway.ts   # Gateway connection hook
│   ├── use-openclaw-chat.ts      # Chat with streaming
│   ├── use-openclaw-agents.ts    # Agent CRUD
│   ├── use-openclaw-models.ts    # Model listing
│   ├── use-openclaw-sessions.ts  # Session management
│   ├── use-openclaw-tts.ts       # Text-to-speech
│   ├── use-openclaw-nodes.ts     # Node & device management
│   └── use-speech-to-text.ts     # Browser Web Speech API
├── contexts/
│   └── OpenClawContext.tsx  # Shared gateway connection
└── components/
    ├── Sidebar.tsx          # Navigation with connection status
    ├── FloatingMicButton.tsx # Global STT mic (Cmd+Shift+M)
    └── VoiceTranscriptPreview.tsx  # Live transcript overlay
```

### Gateway Protocol

The dashboard connects to the OpenClaw gateway via WebSocket using the v3 JSON protocol:

1. Server sends `connect.challenge` event with nonce
2. Client sends `connect` request with auth token and client identity
3. Server responds with `hello-ok` containing features, snapshot, and policy
4. Client uses `rpc(method, params)` for typed request/response calls
5. Client subscribes to events (`chat`, `agent`, `health`, `presence`, etc.)

All RPC methods are fully typed — see `lib/types.ts` for the complete `RPCMethodMap`.

## Tech Stack

- **Next.js 15** with App Router
- **React 19**
- **TypeScript** (strict mode)
- **Tailwind CSS v4**
- **Lucide React** for icons
- **Zero external UI libraries** — lightweight, no bloat

## Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run typecheck    # TypeScript check
npm run lint         # ESLint
```

## Contributing

This project follows the [OpenClaw contribution guidelines](https://github.com/openclaw/openclaw/blob/main/CONTRIBUTING.md).

- One thing per PR
- AI-assisted contributions are welcome (label them)
- Run `npm run build && npm run typecheck` before submitting

## License

MIT — same as OpenClaw.
