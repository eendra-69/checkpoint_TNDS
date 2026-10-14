# Architecture

## Runtime

- **Framework:** Next.js 16 App Router, React 19, TypeScript.
- **Styling:** Tailwind 4, Tasco tokens in `src/app/globals.css` (navy / sky / pale). Fonts: Be Vietnam Pro, Outfit, VT323 (office).
- **Auth:** JWT cookie `tasco_auth` (`jose`), 7 days. Signed with `AUTH_SECRET`.
- **Session store:** Upstash Redis if `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set; otherwise **in-memory** `Map` (lost on serverless cold start / process restart). Redis TTL 7 days. Key: `tasco:session:{id}`.
- **RBAC:** `src/lib/rbac.ts`. Edge check in `src/proxy.ts` uses **default** permissions. Page/actions use `requirePermission`, which honors **session** `permissionOverrides` from Admin.
- **AI:** Vercel AI SDK. If no provider key (env or Admin settings), `/api/chat` returns JSON `{ demo: true, text }` from `demoRenewalReply`.
- **Voice:** ElevenLabs if a key exists; else Web Speech API (`src/components/voice/voice-call.tsx`).
- **Office:** `@react-three/fiber` + drei + postprocessing, pixel sprites not a 3D mesh office.

## Directory map

```
./                            ← git root (the Next.js app)
├── src/app/                  routes, layouts, API, server actions
├── src/components/           UI (shells, chat, office, workflow, assistant)
├── src/lib/                  domain: session, rbac, scoring, i18n, agent
├── public/brand/             photography / logos
├── public/office/            processed sprites + manifest
├── scripts/process-office-assets.mjs
├── docs/                     this documentation
└── .vercel/                  local Vercel link (do not commit output)
```

### Routes (`src/app`)

| Path | Permission | Notes |
|------|------------|--------|
| `/` | public | Marketing home |
| `/login` | public | Persona picker |
| `/forbidden` | public | Missing permission |
| `/verify/[certId]` | public (needs session cert) | Digital certificate + QR |
| `/office` | `chat:use` | Customer only (page redirects others) |
| `/chat/[customerId]` | `chat:use` | Classic Zalo |
| `/vetc/[customerId]` | `chat:use` | VETC chrome |
| `/call/[customerId]` | `voice:use` | Voice bot |
| `/ops` | `ops:view` | Scoring + campaign |
| `/agent` | `agent:view` | Handovers |
| `/compliance` | `compliance:view` | Consent + audit + claims ledger |
| `/metrics` | `metrics:view` | Funnel |
| `/admin` | `settings:manage` | LLM + RBAC matrix |
| `/admin/workflow` | `workflow:view` | React Flow canvas |
| `/api/chat` | signed in | Renewal agent |
| `/api/assistant` | public (guests: start guide only) · staff: `canUseAssistant` | Floating pitch assistant (scripted) |

`proxy.ts` public prefixes: `/`, `/login`, `/forbidden`, `/verify`, static files, and `/api/assistant` (the route answers guests with the start guide only and checks auth for everything else).

### Server actions (`src/app/actions`)

| File | Responsibility |
|------|----------------|
| `auth.ts` | Sign in / out / reset demo (keeps session id, reseeds) |
| `locale.ts` | Set `tasco-locale`; for customers also `preferredLanguage` |
| `mode.ts` | Classic vs office cookie |
| `campaign.ts` | Consent-filtered reminder blast |
| `telesales.ts` | Reveal PII, send link, log outcome |
| `claims.ts` | Create / advance / resolve demo claims |
| `admin.ts` | LLM keys, permission toggles |

### Libraries (`src/lib`)

| File | Responsibility |
|------|----------------|
| `types.ts` | All domain types (`DemoSession`, `CaseState`, …) |
| `session.ts` | Redis / memory CRUD |
| `data/seed.ts` | Minh / Lan / Tuấn + ~bulk synthetic CRM |
| `rbac.ts` | Personas, permissions, route map, mask levels |
| `auth.ts` / `auth-token.ts` | Cookie JWT |
| `scoring.ts` | Transparent additive score + next-best action |
| `pricing.ts` | Regulated premiums + coverage copy |
| `workflow/renewal.ts` | State machine for the visualizer |
| `agent/prompt.ts` | System prompt (no discounts) |
| `agent/tools.ts` | lookup, confirm, coverage, premium, checkout, issue, escalate |
| `agent/demo-reply.ts` | Keyword agent when no LLM key |
| `llm/resolve.ts` | Gateway / OpenAI / Anthropic / Google / Ollama / LM Studio |
| `i18n/*` | Locale cookie + dictionaries |
| `customer-mode.ts` | `tasco-ui-mode` |
| `onboarding-steps.ts` | First-visit persona intro (once per persona, ends with a pointer to the Tour button) |
| `page-tours.ts` | What each page is for — shown by the header **Tour** button, keyed by route (longest prefix wins) |
| `masking.ts` / `audit.ts` | PII + append-only log |

### UI shells

- `MarketingShell` — home, login.
- `AppShell` — authenticated chrome: nav (permission-filtered), language toggle, Classic/Office toggle (customers), persona pill, demo watermark, onboarding host.

Floating assistant: `AssistantHost` in root layout. Hidden for customers; scripted Q&A in `/api/assistant`.

## Request flow (chat)

1. Client (`RenewalChat`, `CsPanel` or `VoiceCall`) POSTs `{ customerId, channel, messages }` to `/api/chat`. `channel` (`zalo` / `office` / `voice` / `vetc`) is recorded on handovers.
2. Auth + customer ownership check.
3. `preferredLanguage` set from locale cookie.
4. Case state bumped to `engaged` if still `scored`/`reminded`/`link_sent`.
5. Audit `chat.message`.
6. **No LLM key** → `demoRenewalReply` JSON.
7. **LLM key** → `streamText` with `renewalSystemPrompt` + tools.

All chat clients (Classic `RenewalChat`, office `CsPanel`, `VoiceCall`) call `sendRenewalChat` in `src/lib/agent/chat-client.ts`, which reads either shape: demo JSON, or the AI SDK UI message stream (text renders as it arrives; a certificate id is picked up from the reply text or the `issueCertificate` tool result).

## Cookies

| Cookie | Purpose |
|--------|---------|
| `tasco_auth` | HttpOnly JWT: persona, optional `customerId` (`minh`\|`lan`\|`tuan`), `sessionId` |
| `tasco-locale` | `vi` \| `en` (readable by client toggle) |
| `tasco-ui-mode` | `office` (default) \| `classic` |

Onboarding completion is **localStorage**, not a cookie.

## Seed ids

Named customers use stable ids: `cust_minh`, `cust_lan`, `cust_tuan` (see `getDemoCustomerId` in `seed.ts`). Chat URLs use these ids.

Bulk customers are `cust_0001`…. Scoring runs on the full set at seed time.

## Security notes

- `proxy.ts` does **not** load session overrides; Admin-changed RBAC is enforced in `requirePermission` / server actions, not at the edge.
- Local LLM providers are disabled on Vercel (`localProvidersDisabled`).
- Never commit `.env.local`. Admin-entered provider keys live **in the demo session**, not in git.
