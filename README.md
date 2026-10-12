# TASCO Renewal Journey Demo

BeyondPilot × Tasco (GenAI Fund) prototype: AI-assisted **TNDS** renewal with lead scoring, Zalo-style chat, voice handover, RBAC personas, admin LLM settings, and a workflow visualizer.

## Quick start

```bash
cd app
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Sign in as…**

Works without AI keys (deterministic demo replies). Add `AI_GATEWAY_API_KEY` or another provider key for live LLM. Optional: Upstash Redis, ElevenLabs.

## Demo path (≈3 min)

1. **Campaign manager** → Run renewal campaign on `/ops`
2. **Anh Minh (customer)** → confirm → pay → digital certificate
3. **Chị Lan (customer)** → voice call → ask for human
4. **Telesales** → reveal-with-reason → send renewal link → log outcome
5. **Admin** → `/admin/workflow` + AI provider settings
6. **Metrics / Compliance** → funnel + audit log

## Personas

| Persona | Sees |
|--------|------|
| Customer | Chat / VETC / voice / verify (own policy) |
| Telesales | Handover queue, PII reveal, renewal link |
| Campaign manager | Ops scoring + metrics |
| Compliance | Consent ledger + audit |
| Executive | Metrics only |
| Admin | Everything + settings + workflow map |

## Stack

Next.js 16 · Tailwind · AI SDK · optional Upstash Redis · React Flow · Web Speech / ElevenLabs
