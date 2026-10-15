# Continuing this project

Read this after a context reset. Product rules: [PRODUCT.md](./PRODUCT.md). Layout: [ARCHITECTURE.md](./ARCHITECTURE.md).

## Current shipped state (v0.2.0, Oct 2026)

Two halves:

- **Root** — static presentation site (`index.html`, zero JavaScript) explaining the demo. `npm run site` → :4321. Its `/demo/` links 302 to the Next dev server so it feels like one origin.
- **`demo/`** — the Next.js 16 app. `npm run dev` → :3000.

The app:

- Six-persona RBAC demo with scoring, Zalo chat, VETC, voice, telesales, compliance, metrics, admin LLM matrix, workflow visualizer.
- Tasco branding is **lime-forward** (`--tasco-forest` / `--tasco-lime`), not navy/sky. `zalo-blue` and `vetc-green` stay third-party on purpose. Palette lives in `demo/src/app/globals.css`.
- Per-persona welcome screen at `/` — the landing route is persona-aware, not a marketing splash.
- Three HD-2D worlds: `/office`, `/workshop`, `/lounge`. Every world is walkable and fully reachable — verified tile-by-tile.
- Header **Tour** explains the page you are on (`demo/src/lib/page-tours.ts`); the welcome screen is the first-visit introduction.
- Floating pitch assistant; app-wide **VI | EN** (`tasco-locale`), agent `preferredLanguage` synced on chat.
- Claims desk is in-office demo only.
- Production: https://tasco-tnds-demo.vercel.app (Vercel root directory must be `demo`).

Full change history: [../CHANGELOG.md](../CHANGELOG.md).

## Conventions

- Prefer **App Router server components** for pages; `"use client"` only for interactive widgets.
- New staff routes: add `ROUTE_PERMISSIONS` **and** `requirePermission` on the page/actions.
- New user-visible strings: both locales (see [I18N.md](./I18N.md)).
- Audit meaningful mutations (`appendAudit`).
- Keep assumptions visible (`Assumption: …`) rather than faking production integrations.
- Do not add a second global state library; session + cookies are enough.
- Office copy in `office-copy.ts`; chrome in dictionaries.
- **Two halves:** the Next app lives in `demo/`, the root is plain static HTML. Do not add a second Next app or a workspace root — one `node_modules`, no surprises.
- Brand tokens are defined once in `demo/src/app/globals.css`; the root site deliberately reuses those exact values. Change them there first.

## Known gaps (safe follow-ups)

These are real; do not “fix” them by deleting the demo path.

1. **In-memory sessions** without Upstash: funnel/chat state can vanish between lambdas on Vercel. Locally the memory store (and the audit ledger fallback) is one process-wide `Map` on `globalThis`, and sessions are copied on save/load like Redis does. Prefer Redis for any judged demo.
2. **Free text stays as written.** Runtime data is stored as codes + params and rendered per locale (`demo/src/lib/i18n/generated.ts`, `demo/src/lib/workflow/i18n.ts`). What cannot be translated: customer chat text, LLM-written handover summaries/reasons, and events saved before codes existed (they fall back to their stored English).
3. **Assistant** (`/api/assistant`) is scripted VI/EN answers by topic/keyword (`demo/src/lib/assistant-topics.ts`), not the renewal LLM.
4. **Git author vs Vercel.** Prebuilt deploy without `.git` — [DEPLOY.md](./DEPLOY.md).
5. **Dictionary type:** keep `vi` and `en` the same **shape**. `DeepStringify` only relaxes string literals.
6. **Office follow-camera** can frame the room's south edge and the void beyond it. Cosmetic only.
7. **Style mismatch:** the workshop/lounge mechanic NPC is smooth 3D-clay while the office NPCs are pixel art. Deliberate-looking but not yet reconciled.
8. **Presentation site is English-only** while the demo defaults to VI. No localization pass yet.

## Suggested next work (if the human asks)

- Connect Upstash on the production project if not already.
- Add the commit author email to the Vercel team so Git deploys work.

## How to run a change

1. `npm run setup` once, then `npm run dev` from the repo root (it forwards into `demo/`). Add `npm run site` in a second terminal when you need to see the presentation site or the `/demo/` redirect.
2. Sign in as the persona that owns the surface.
3. Toggle VI and EN.
4. `npm run lint`, `npm run typecheck` and `npm run build` from the root — all forward into `demo/`.
5. `npm run test:e2e` — the role scenarios from [VERIFICATION.md](./VERIFICATION.md) (`demo/e2e/`). Uses installed Edge (`E2E_CHANNEL=chrome` for Chrome); no browser download. Port via `E2E_PORT` (default 3457, since 3000 can be reserved on Windows).
6. Commit only when asked. Deploy only when asked; follow [DEPLOY.md](./DEPLOY.md).

## Demo customers (quick reference)

| Key | Id | Story |
|-----|-----|--------|
| `minh` | `cust_minh` | 30A-12345 Toyota Vios, complete, high VETC, ~21d |
| `lan` | `cust_lan` | 51F-67890 Accent, voice/handover, ~12d |
| `tuan` | `cust_tuan` | 43A-55441 CX-5 **incomplete**, no call consent |

Keywords in demo chat: `xác nhận`/`confirm`, `cover`/`quyền lợi`, `thanh toán`/`pay`, `nhân viên`/`human`, `gia hạn`/`renew`.
