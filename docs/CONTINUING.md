# Continuing this project

Read this after a context reset. Product rules: [PRODUCT.md](./PRODUCT.md). Layout: [ARCHITECTURE.md](./ARCHITECTURE.md).

## Current shipped state (Oct 2026)

- Six-persona RBAC demo with scoring, Zalo chat, VETC, voice, telesales, compliance, metrics, admin LLM matrix, workflow visualizer.
- Tasco branding (navy/sky), floating pitch assistant.
- HD-2D Virtual Office with Classic | Office switch and first-run onboarding tour.
- App-wide **VI | EN** (`tasco-locale`), agent `preferredLanguage` synced on chat.
- Claims desk is in-office demo only.
- Production: https://tasco-renewal-demo.vercel.app

## Conventions

- Prefer **App Router server components** for pages; `"use client"` only for interactive widgets.
- New staff routes: add `ROUTE_PERMISSIONS` **and** `requirePermission` on the page/actions.
- New user-visible strings: both locales (see [I18N.md](./I18N.md)).
- Audit meaningful mutations (`appendAudit`).
- Keep assumptions visible (`Assumption: …`) rather than faking production integrations.
- Do not add a second global state library; session + cookies + localStorage (onboarding) are enough.
- Office copy in `office-copy.ts`; chrome in dictionaries.

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

## Suggested next work (if the human asks)

- Finish streaming chat for LLM mode without breaking demo JSON.
- Translate remaining staff tables/buttons.
- Connect Upstash on the production project if not already.
- Add the commit author email to the Vercel team so Git deploys work.
- Persist office onboarding in the session if judges need a shared machine.
- Optional: map `permissionOverrides` into `proxy.ts`.

## How to run a change

1. `npm run dev` from `app/`.
2. Sign in as the persona that owns the surface.
3. Toggle VI and EN.
4. `npm run build`.
5. Commit only when asked. Deploy only when asked; follow [DEPLOY.md](./DEPLOY.md).

## Demo customers (quick reference)

| Key | Id | Story |
|-----|-----|--------|
| `minh` | `cust_minh` | 30A-12345 Toyota Vios, complete, high VETC, ~21d |
| `lan` | `cust_lan` | 51F-67890 Accent, voice/handover, ~12d |
| `tuan` | `cust_tuan` | 43A-55441 CX-5 **incomplete**, no call consent |

Keywords in demo chat: `xác nhận`/`confirm`, `cover`/`quyền lợi`, `thanh toán`/`pay`, `nhân viên`/`human`, `gia hạn`/`renew`.
