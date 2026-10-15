<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent guide — TASCO renewal demo

Read this file before changing code. Full human/agent docs live in [`docs/`](./docs/README.md).

## What this repo is

A **pitch demo** of AI-assisted TNDS renewal for BeyondPilot × Tasco. Not a production insurer system. The repository root holds the presentation site; the Next.js app lives in `demo/`.

Two halves live here:

| Path | What it is |
|---|---|
| `index.html` + `site.css` + `assets/` | Presentation site. Plain HTML/CSS, no build, no dependencies. Links into `demo/`. |
| `demo/` | The app. A self-contained Next.js 16 project with its own `package.json`. |

Root `package.json` scripts just forward into `demo/` (`npm run dev`, `build`, `lint`, `typecheck`, `test:e2e`). `npm run site` serves the presentation site on :4321 with a zero-dependency Node server in `scripts/serve-site.mjs`, which redirects `/demo/…` to the dev server so both behave like one origin locally.

The presentation site deliberately reuses the app's palette and its three typefaces (Outfit / Be Vietnam Pro / VT323) — copy a token from `demo/src/app/globals.css` rather than inventing a new colour.

Live: https://tasco-tnds-demo.vercel.app

## The three virtual spaces

All three are the same HD-2D tile-sprite engine, built on one shared shell
(`demo/src/components/world/`). A scene supplies only its map + geometry; camera,
player, controls, post-processing and other-player rendering are shared.

| Space | Route | Permission | What's in it |
|---|---|---|---|
| Office | `/office` | `chat:use` | CS desk, claims desk, admin board, VETC kiosk |
| Workshop | `/workshop` | `workshop:use` | AI mechanic Q&A, claims desk, inspection pad |
| Lounge | `/lounge` | `lounge:use` | Social space + moderated public chat |

**Presence** is global (Redis hash per scene, 15s TTL), not per-session, so a
second browser tab shows up as a second person. Without Redis it falls back to
a process-local Map — fine on one machine, broken across Vercel instances.
`/admin` shows a badge for this.

## Storage

Four independent stores, each with a Redis path and an in-memory fallback. `/admin`
renders a badge per store so a degraded demo is visible rather than mysterious.

| Store | Module | In-memory fallback means |
|---|---|---|
| Session | `demo/src/lib/session.ts` | State lost between serverless instances |
| Presence | `demo/src/lib/presence.ts` | Only one instance sees the others |
| Lounge chat + moderation | `demo/src/lib/lounge.ts` | Feed not shared across instances |
| Audit ledger | `demo/src/lib/audit.ts` | Not append-only, not tamper-evident |

**Audit events do not live on `DemoSession`.** They are RPUSHed to a per-session
Redis list with a monotonic `seq`, and retention drops are counted in a separate
key rather than vanishing. Read with `listAudit(sessionId)`, never
`session.audit`. "Reset demo" clears the ledger too.

**Writes go through `updateSession`**, which serialises per session id via
`withSessionLock` and throws `MissingSessionError` rather than silently
re-seeding a session that expired mid-request. Read paths use
`getOrCreateSession` and stay forgiving. The lock is in-process only — see
`demo/src/lib/session-lock.ts` for why that is the right trade for a demo and what
it does not cover.

**Secrets in the session blob are encrypted** (`demo/src/lib/crypto.ts`, AES-256-GCM
keyed off `SETTINGS_SECRET`). Write with `encryptSecret`, read with
`decryptSecret`, and never render `secretPreview`'s output as a real suffix.
Decryption failure returns `null` so a rotated secret degrades to the env var.

## Before you edit

1. Skim [docs/PRODUCT.md](./docs/PRODUCT.md) (hard rules) and [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) (where files live).
2. Do not invent discounts, real payments, or real claims issuance.
3. Keep server-side RBAC (`demo/src/lib/rbac.ts` + `demo/src/proxy.ts` + `requirePermission`). UI hiding is not security. **Every new route — including `/api/*` — needs an entry in `ROUTE_PERMISSIONS`.** `proxy.ts` cannot read the session store, so permission overrides ride along on the auth cookie (`permOverrides`); if you add a way to change permissions, re-issue that cookie too or the change looks like it did nothing.
4. Session state is the source of truth (`demo/src/lib/session.ts`). Seed is `demo/src/lib/data/seed.ts`.
5. Default UI language is `vi`. Wire new copy through `demo/src/lib/i18n/dictionaries.ts` and `getLocale()`.
6. Do not edit plan files unless the user asks. Do not commit `demo/.env.local`.
7. Never put a full-width beam or ceiling above a walkable area. The follow camera sits at y=6.2 looking down ~36°, so anything spanning the map at that height blocks the view. Wall-top trim only.

## Colour system

Lime-forward, aligned to VETC's green. Tokens live in `demo/src/app/globals.css`
and `demo/src/components/office/brand-textures.ts` (`TASCO_3D`).

- `tasco-lime` (#4d7c0f) — AA-safe as **text** on light backgrounds.
- `tasco-lime-bright` (#a3e635) — **fills and accents only**; it fails contrast on white, so pair it with dark text.
- `zalo-blue` and `vetc-green` are third-party brand colours. Leave them alone.

## Next.js 16 specifics in this app

- App Router only. Route protection is `demo/src/proxy.ts` (`proxy` export + `config.matcher`), not a `middleware.ts` file.
- Server Actions live under `demo/src/app/actions/`. A `"use server"` module may **only export async functions** — shared schemas/consts belong in `demo/src/lib/validation.ts`.
- A Client Component cannot define an inline `"use server"` closure. Post form fields to an exported action (see `signInWithForm`) instead.
- Most pages are dynamic (cookies/session). Do not force static generation on authenticated routes.
- `transpilePackages` includes Three.js packages (`demo/next.config.ts`).
- Tailwind 4 via `@tailwindcss/turbopack`.

## Where to change what

| Task | Start here |
|------|------------|
| New page / persona route | `demo/src/app/<route>/page.tsx`, add `ROUTE_PERMISSIONS` in `demo/src/lib/rbac.ts` |
| App shell / sidebar nav | `demo/src/components/shell/shell-frame.tsx`, `demo/src/components/app-shell.tsx` |
| New 3D space | `demo/src/components/world/` (shared) + a scene module like `demo/src/components/workshop/workshop-world.tsx` |
| Other players / names | `demo/src/lib/presence.ts`, `demo/src/components/world/use-presence.ts` |
| Lounge chat + moderation | `demo/src/lib/lounge.ts`, `demo/src/lib/moderation.ts`, `demo/src/components/admin/ModerationPanel.tsx` |
| Audit events | `demo/src/lib/audit.ts` (never `session.audit`) |
| Session writes / locking | `demo/src/lib/session.ts`, `demo/src/lib/session-lock.ts` |
| Provider secret storage | `demo/src/lib/crypto.ts` |
| Chat / CS replies | `demo/src/app/api/chat/route.ts`, `demo/src/lib/agent/demo-reply.ts`, `demo/src/lib/agent/tools.ts` |
| Workshop AI mechanic | `demo/src/app/api/workshop/route.ts`, `demo/src/components/workshop/AdvisorPanel.tsx` |
| Lead scoring | `demo/src/lib/scoring.ts` |
| Case states | `demo/src/lib/workflow/renewal.ts` (visualizer reads this) |
| Virtual Office | `demo/src/components/office/`, `demo/src/components/office/world/map.ts` |
| VI/EN strings | `demo/src/lib/i18n/dictionaries.ts`, office: `office-copy.ts` |
| Seed personas / bulk CRM | `demo/src/lib/data/seed.ts` |
| Auth cookie / display name | `demo/src/lib/auth-token.ts`, `demo/src/app/actions/auth.ts` |
| Deploy | [docs/DEPLOY.md](./docs/DEPLOY.md) |

## Commands

Run from the repository root; each forwards into `demo/`.

```bash
npm run setup     # npm install inside demo/
npm run dev       # demo dev server, http://localhost:3000
npm run site      # presentation site, http://localhost:4321 (run separately)
npm run build     # required after TS/UI changes
npm run lint
npm run typecheck
npm run test:e2e  # Playwright, demo/e2e/ (installed Edge; reuses a dev server on :3457)
```

## Do not

- Skip `requirePermission` on new staff routes — and remember permission changes must re-issue the auth cookie so `proxy.ts` agrees.
- Store real PII. Masking lives in `demo/src/lib/masking.ts`; new surfaces must call `maskCustomer`, not read raw session customers.
- Ship without `AUTH_SECRET` in production — the JWT signer now throws at boot rather than falling back to a committed default.
- Ship without `SETTINGS_SECRET` in production — saving a provider key now throws rather than writing a plaintext secret to Redis.
- Issue a certificate without a paid checkout. `issueCertificate` validates `session.checkouts`.
- Deploy with `vercel --prod` from a tree whose git author Vercel rejects — see deploy doc (prebuilt, hide `.git`).
- Treat claims as production: photos are truncated data URLs; triage is a stub.
- Rewrite the office in Three.js isometric again. Current design is HD-2D tile sprites.

## Verify before claiming done

- `npm run build` (TypeScript is part of the production build).
- `npm run lint` — clean (0 errors, 0 warnings); keep it that way.
- `npm run test:e2e` when you change a role's flow, a route, RBAC or the page tours.
- If you changed UI, exercise the flow in a browser (customer + at least one staff persona).
- If you touched a 3D scene, open it in **two tabs** and confirm both avatars appear with the right names.
- If you changed locale, toggle VI and EN on the pages you touched.
- If you changed chat, confirm demo mode (no LLM keys) still replies.
