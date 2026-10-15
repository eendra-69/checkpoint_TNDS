# TASCO TNDS Renewal Journey

BeyondPilot × Tasco (GenAI Fund) prototype: AI-assisted **TNDS** (compulsory motor liability) renewal.

This repository has two halves:

| Path | What it is | Build |
|------|-----------|-------|
| `index.html` + `site.css` | The presentation site — explains the demo and links into it | None. Plain HTML + CSS. |
| `demo/` | The demo app itself — a complete Next.js 16 project | `npm install && npm run dev` |

**Live demo:** https://checkpoint-tnds.vercel.app
**GitHub:** https://github.com/eendra-69/checkpoint_TNDS (private)

Demo links point straight at the live deployment. The local static server still
maps `demo/…` onto the running dev server, so both halves still behave like one
origin locally.

## Quick start

Two terminals, from this directory:

```bash
npm run setup    # installs the demo's dependencies (first time only)
npm run dev      # terminal 1 — demo app on http://localhost:3000
npm run site     # terminal 2 — presentation site on http://localhost:4321
```

Then open <http://localhost:4321> and click through to the demo.

## Repository layout

```
.
├── index.html          presentation site (the front door)
├── site.css            its styles — tokens mirror demo/src/app/globals.css
├── assets/             brand art and real screenshots of the 3 rooms
├── scripts/            zero-dependency static server for the site
├── docs/               product, architecture and how-to docs
├── AGENTS.md           notes for agents working in this repo
├── CHANGELOG.md        release notes
└── demo/               the Next.js app
    ├── src/            app router pages, components, lib
    ├── public/         brand art, sprite atlases, 3D room assets
    ├── e2e/            Playwright end-to-end tests, one spec per role or concern
    ├── scripts/        office asset pipeline
    ├── playwright.config.ts
    └── docs → see ../docs
```

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
| [docs/VERIFICATION.md](./docs/VERIFICATION.md) | Both | Per-role scenarios, test results, fix history (F1–F24) |
| [CHANGELOG.md](./CHANGELOG.md) | Both | Release notes |

## Demo path (~3 minutes)

Sign-in is passwordless (`/login`) and lands on the persona's welcome screen `/`,
except Chị Lan (straight into the AI call) and Anh Tuấn (straight into Classic chat).

1. **Campaign manager** → `/ops` → run renewal campaign
2. **Anh Minh (customer)** → Virtual Office or Classic chat → confirm → pay → certificate
3. **Chị Lan (customer)** → `/call/...` → ask for a human
4. **Anh Tuấn (customer)** → Classic chat → confirm the incomplete vehicle before paying
5. **Telesales** → `/agent` → reveal PII with reason → send renewal link
6. **Admin** → `/admin` + `/admin/workflow`
7. **Metrics / Compliance** → funnel + consent/audit

Header **VI | EN** switches UI language (Vietnamese is the default); **Tour** explains the page you are on. Customers move between Home, the Virtual Office and its renewal / claim processes from the sidebar.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind 4 · AI SDK · optional Upstash Redis · React Flow · Three.js / R3F (office, workshop, lounge) · Web Speech or ElevenLabs

## Scripts

Run from the repository root; each one forwards into `demo/`.

| Script | Purpose |
|--------|---------|
| `npm run site` | Serve the presentation site on :4321 (zero deps) |
| `npm run dev` | Demo dev server on :3000 |
| `npm run build` | Demo production build / typecheck |
| `npm run start` | Serve the demo production build |
| `npm run lint` | ESLint over the demo |
| `npm run typecheck` | Generate Next route types, then `tsc --noEmit` over the demo |
| `npm run assets` | Rebuild the 3D room sprite atlases |
| `npm run setup` | `npm install` inside `demo/` |
| `npm run test:e2e` | Playwright end-to-end tests (`demo/e2e/`) for every role's scenario; reuses a dev server on `E2E_PORT` (default 3457) or starts one |
| `npm run test:e2e:report` | Open the last Playwright HTML report |

The e2e tests drive the installed **Microsoft Edge** by default (no browser
download); set `E2E_CHANNEL=chrome` to use Chrome instead.

## Deploying

The presentation site is static — publish the repository root as-is. The demo is
a normal Next.js project; set the Vercel **root directory to `demo`**. See
[docs/DEPLOY.md](./docs/DEPLOY.md).

All data in the demo is synthetic and watermarked `DEMO — SYNTHETIC`.
