# TASCO TNDS Renewal Demo

BeyondPilot × Tasco (GenAI Fund) prototype: AI-assisted **TNDS** (compulsory motor liability) renewal.

The demo is a full Next.js app with six RBAC personas, rule-based lead scoring, Zalo-style chat, VETC entry, AI voice, telesales handover, a walkable HD-2D Virtual Office, claims (demo-only), digital certificate verify, VI/EN toggle, and a workflow visualizer.

**Live:** https://tasco-renewal-demo.vercel.app  
**GitHub:** https://github.com/eendra69/PIC_tasco-renewal-demo (this repo) · upstream https://github.com/jrrqd/tasco-renewal-demo (private)

This repository root **is** the Next.js app (`package.json` lives here). Parent folders outside this git repo are not part of the deploy.

## Documentation

| Doc | Audience | Contents |
|-----|----------|----------|
| [AGENTS.md](./AGENTS.md) | Agents | Next.js 16 notes + how to continue this project |
| [docs/README.md](./docs/README.md) | Both | Index of all docs |
| [docs/PRODUCT.md](./docs/PRODUCT.md) | Both | Demo story, personas, hard product rules |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Both | Stack, routes, session, APIs, files |
| [docs/VIRTUAL-OFFICE.md](./docs/VIRTUAL-OFFICE.md) | Both | HD-2D office map, sprites, panels |
| [docs/I18N.md](./docs/I18N.md) | Both | VI/EN cookie, dictionaries, agent language |
| [docs/DEPLOY.md](./docs/DEPLOY.md) | Both | Vercel, git-author block, env vars |
| [docs/CONTINUING.md](./docs/CONTINUING.md) | Both | Conventions, known gaps, safe next work |

## Quick start

```bash
cp .env.example .env.local
# set AUTH_SECRET to a long random string
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Sign in as…**

No AI keys required. Without keys, chat uses deterministic replies in `src/lib/agent/demo-reply.ts`.

## Demo path (~3 minutes)

1. **Campaign manager** → `/ops` → run renewal campaign  
2. **Anh Minh (customer)** → Virtual Office or Classic chat → confirm → pay → certificate  
3. **Chị Lan (customer)** → `/call/...` → ask for a human  
4. **Telesales** → `/agent` → reveal PII with reason → send renewal link  
5. **Admin** → `/admin` + `/admin/workflow`  
6. **Metrics / Compliance** → funnel + consent/audit  

Header **VI | EN** switches UI language. Customers also get **Classic | Virtual Office**.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind 4 · AI SDK · optional Upstash Redis · React Flow · Three.js / R3F (office) · Web Speech or ElevenLabs

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local server |
| `npm run build` | Production build / typecheck |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run office:assets` | Process sprite sheets in `public/office/raw` |
| `npm run test:e2e` | Playwright end-to-end tests (`e2e/`) for every role's scenario; reuses a dev server on port 3457 or starts one |
| `npm run test:e2e:report` | Open the last Playwright HTML report |

## Product constraints (do not break)

- TNDS premiums are **regulated**. Never add discounts, cashback, or fake urgency.
- Claims flow is **demo-only**, not a real insurer claims product.
- All customer data is **synthetic**.
- Default locale is **Vietnamese**. Default customer surface is **Virtual Office**.
