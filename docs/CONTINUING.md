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
- Three HD-2D worlds: `/office` (with Classic | Office switch and first-run onboarding tour), `/workshop`, `/lounge`. Every world is walkable and fully reachable — verified tile-by-tile.
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
- Do not add a second global state library; session + cookies + localStorage (onboarding) are enough.
- Office copy in `office-copy.ts`; chrome in dictionaries.
- **Two halves:** the Next app lives in `demo/`, the root is plain static HTML. Do not add a second Next app or a workspace root — one `node_modules`, no surprises.
- Brand tokens are defined once in `demo/src/app/globals.css`; the root site deliberately reuses those exact values. Change them there first.

## Known gaps (safe follow-ups)

These are real; do not “fix” them by deleting the demo path.

1. **LLM streaming UI.** With API keys, `streamText` returns a UI stream; Classic chat / CsPanel primarily parse demo JSON. Wiring `useChat` / stream rendering is unfinished.
2. **Edge vs session RBAC.** `proxy.ts` uses `DEFAULT_PERMISSIONS` only. Admin overrides apply on the server after the request is allowed through. Either document this in the pitch or load overrides in proxy (needs a store read).
3. **In-memory sessions on Vercel** without Upstash: funnel/chat state can vanish between lambdas. Prefer Redis for any judged demo.
4. **Git author vs Vercel.** Prebuilt deploy without `.git` — [DEPLOY.md](./DEPLOY.md).
5. **Staff page bodies** are still mostly English even when titles are translated.
6. **AdminPanel** office board is lightly localized compared to CS/Claims.
7. **Persona labels** on `/login` (`PERSONAS[].label`) are English.
8. **Voice copy** (`VoiceCall`) is not fully dictionary-driven.
9. **Assistant** (`/api/assistant`) is keyword English scripts, not the renewal LLM.
10. **Dictionary type:** keep `vi` and `en` the same **shape**. `DeepStringify` only relaxes string literals.
11. **12 pre-existing `react-hooks` lint errors** in the demo. Pre-date v0.2.0; the build is green, so treat them as a separate cleanup, not a regression.
12. **Office follow-camera** can frame the room's south edge and the void beyond it. Cosmetic only.
13. **Style mismatch:** the workshop/lounge mechanic NPC is smooth 3D-clay while the office NPCs are pixel art. Deliberate-looking but not yet reconciled.
14. **Presentation site is English-only** while the demo defaults to VI. No localization pass yet.

## Suggested next work (if the human asks)

- Finish streaming chat for LLM mode without breaking demo JSON.
- Translate remaining staff tables/buttons.
- Connect Upstash on the production project if not already.
- Add the commit author email to the Vercel team so Git deploys work.
- Persist office onboarding in the session if judges need a shared machine.
- Optional: map `permissionOverrides` into `proxy.ts`.

## How to run a change

1. `npm run setup` once, then `npm run dev` from the repo root (it forwards into `demo/`). Add `npm run site` in a second terminal when you need to see the presentation site or the `/demo/` redirect.
2. Sign in as the persona that owns the surface.
3. Toggle VI and EN.
4. `npm run typecheck && npm run build` from the root — both forward into `demo/`.
5. Commit only when asked. Deploy only when asked; follow [DEPLOY.md](./DEPLOY.md).

## Demo customers (quick reference)

| Key | Id | Story |
|-----|-----|--------|
| `minh` | `cust_minh` | 30A-12345 Toyota Vios, complete, high VETC, ~21d |
| `lan` | `cust_lan` | 51F-67890 Accent, voice/handover, ~12d |
| `tuan` | `cust_tuan` | 43A-55441 CX-5 **incomplete**, no call consent |

Keywords in demo chat: `xác nhận`/`confirm`, `cover`/`quyền lợi`, `thanh toán`/`pay`, `nhân viên`/`human`, `gia hạn`/`renew`.
