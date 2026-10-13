<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent guide — TASCO renewal demo

Read this file before changing code. Full human/agent docs live in [`docs/`](./docs/README.md).

## What this repo is

A **pitch demo** of AI-assisted TNDS renewal for BeyondPilot × Tasco. Not a production insurer system. Git root is this `app/` directory.

Live: https://tasco-renewal-demo.vercel.app

## Before you edit

1. Skim [docs/PRODUCT.md](./docs/PRODUCT.md) (hard rules) and [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) (where files live).
2. Do not invent discounts, real payments, or real claims issuance.
3. Keep server-side RBAC (`src/lib/rbac.ts` + `src/proxy.ts` + `requirePermission`). UI hiding is not security.
4. Session state is the source of truth (`src/lib/session.ts`). Seed is `src/lib/data/seed.ts`.
5. Default UI language is `vi`. Wire new copy through `src/lib/i18n/dictionaries.ts` and `getLocale()`.
6. Do not edit plan files unless the user asks. Do not commit `.env.local`.

## Next.js 16 specifics in this app

- App Router only. Route protection is `src/proxy.ts` (`proxy` export + `config.matcher`), not a `middleware.ts` file.
- Server Actions live under `src/app/actions/`.
- Most pages are dynamic (cookies/session). Do not force static generation on authenticated routes.
- `transpilePackages` includes Three.js packages (`next.config.ts`).
- Tailwind 4 via `@tailwindcss/turbopack`.

## Where to change what

| Task | Start here |
|------|------------|
| New page / persona route | `src/app/<route>/page.tsx`, add `ROUTE_PERMISSIONS` in `src/lib/rbac.ts` |
| Chat / CS replies | `src/app/api/chat/route.ts`, `src/lib/agent/demo-reply.ts`, `src/lib/agent/tools.ts` |
| Lead scoring | `src/lib/scoring.ts` |
| Case states | `src/lib/workflow/renewal.ts` (visualizer reads this) |
| Virtual Office | `src/components/office/`, `src/components/office/world/map.ts` |
| VI/EN strings | `src/lib/i18n/dictionaries.ts`, office: `office-copy.ts` |
| Seed personas / bulk CRM | `src/lib/data/seed.ts` |
| Auth cookie | `src/lib/auth-token.ts`, `src/app/actions/auth.ts` |
| Deploy | [docs/DEPLOY.md](./docs/DEPLOY.md) |

## Commands

```bash
npm install
npm run dev
npm run build    # required after TS/UI changes
```

## Do not

- Skip `requirePermission` on new staff routes.
- Store real PII. Masking lives in `src/lib/masking.ts`.
- Deploy with `vercel --prod` from a tree whose git author Vercel rejects — see deploy doc (prebuilt, hide `.git`).
- Treat claims as production: photos are truncated data URLs; triage is a stub.
- Rewrite the office in Three.js isometric again. Current design is HD-2D tile sprites.

## Verify before claiming done

- `npm run build` (TypeScript is part of the production build).
- If you changed UI, exercise the flow in a browser (customer + at least one staff persona).
- If you changed locale, toggle VI and EN on the pages you touched.
- If you changed chat, confirm demo mode (no LLM keys) still replies.
