# Workflow verification — per role

Scenario per role, checked in the browser. Each step is persona → action → expected.

**Automated:** `npm run test:e2e` runs these scenarios with Playwright (`demo/e2e/`): the full demo journey across roles, Tuấn, Minh (including walking to the CS desk), RBAC for every staff persona, assistant, Tour per page, no overlay on first visit, EN, and mobile width. Each test gets its own browser context, so its own seeded demo session.

- **Last full run:** 2026-10-14 (round 2), local `next dev`, demo mode (no LLM key), in-memory store, fresh server start. Every role in **VI**, then a reset and every role again in **EN**, then customer views at **375 px**.
- **Criteria:** hard rules in [PRODUCT.md](./PRODUCT.md), case states, funnel and audit, RBAC, no English UI chrome in VI (generated data excepted).
- **Result key:** ✅ pass (VI and EN) · 🔧 failed in this round, fixed and re-checked · ⏸️ not re-tested this round (reason given)

## Scenarios and results

### Guest (signed out)

| Step | Expected | Result |
|------|----------|--------|
| Open `/`, `/login` | Copy in selected language, `DEMO — SYNTHETIC` watermark, guest tour | ✅ |
| Assistant: "where do I start" chip or typed question | Start guide answer | 🔧 F12 (proxy redirected guests to `/login`) |
| Assistant: any other question | "Sign in as a persona to ask more"; no session data | ✅ |
| Assistant chips on `/login` | Home chips | ✅ |
| Open `/ops` | Redirect to `/login?next=/ops` | ✅ |

### Campaign manager

| Step | Expected | Result |
|------|----------|--------|
| Sign in | Lands on the welcome screen `/`; nav = Home, Lounge, Ops, Metrics | ✅ |
| Run renewal campaign | 36 targeted, 4 excluded with localized reason; Minh → Reminded, Lan → No response | ✅ |
| Run again after Minh and Lan renewed | Renewed customers excluded as "already renewed"; their state stays Issued; Reminded count unchanged | 🔧 F13 |
| Open `/metrics` | Reminded = 36 | ✅ |
| Open `/agent` | Forbidden | ✅ |

### Anh Minh (happy path)

| Step | Expected | Result |
|------|----------|--------|
| Sign in | Lands on the welcome screen `/`; nav = Home, Virtual Office, Renewal, Claim; no assistant button | ✅ |
| Walk to CS desk, press E | Proximity prompt, CS panel | ⏸️ App window minimized, so the 3D scene drew 0 frames. Passed in round 1; code unchanged. CS panel opened via `?station=cs`. |
| renew → pay | Confirmed at regulated premium, no discount; certificate issued | ✅ |
| pay again | Same certificate returned, nothing new issued | ✅ |
| `/verify/CERT-…` | Valid; localized labels and insurer; issue date = today (ICT) | ✅ |
| Office Admin board | State Issued, certificate link, consent list | ✅ |
| Claims: submit → Need info → Resolve | Under review → Needs info → Resolved; buttons localized | ✅ |
| Claim submitted without a description | Default note in UI language | 🔧 F14 |
| VETC page; sidebar Renewal / Claim | Own data; links open `/office?station=cs` (CS desk) and `/office?station=claims` | ✅ |
| Open `/admin` | Forbidden | ✅ |

### Anh Tuấn (incomplete vehicle)

| Step | Expected | Result |
|------|----------|--------|
| Sign in | Lands on `/chat/cust_tuan` (Classic chat), not the Virtual Office | ✅ (changed 2026-10-14, see PRODUCT.md persona table) |
| Classic chat | Badge "Needs confirmation" | ✅ |
| pay before confirming | Asked to confirm; no certificate | ✅ |
| Unrelated message ("xin chào") | Greeting; vehicle stays unconfirmed | ✅ |
| confirm | Badge switches to "Profile OK" | 🔧 F11 (badge stayed until reload) |
| pay, pay again | One certificate; second pay returns it | ✅ |
| `/call/cust_tuan` | "No call consent"; Start call disabled | ✅ |
| `/vetc/cust_minh`, `/call/cust_lan` | Redirected to his own pages | ✅ |

### Chị Lan (handover)

| Step | Expected | Result |
|------|----------|--------|
| Sign in | Lands on `/call/cust_lan` | ✅ |
| Start call → Ask for human | Opening and handover reply in UI language; case Handed over | ✅ |
| After telesales sends the link: confirm → mock checkout → Simulate payment | Certificate issued | ✅ |

### Telesales

| Step | Expected | Result |
|------|----------|--------|
| Open `/agent` | Lan's card "from AI voice call"; assistant badge = queue size | ✅ |
| "Renewed" before Lan has a certificate | Disabled with explanation; forced submit refused by the server, nothing logged | ✅ F10 |
| Reveal phone with reason | Number shown; reason in audit | ✅ |
| Send renewal link | In progress, "link sent"; no issue control | ✅ |
| Callback requested | Card stays in the queue, "Last outcome: Callback requested" | ✅ F10 |
| "Renewed" after Lan paid | Enabled; closes the card | ✅ F10 |
| Not interested (Tuấn) | Card closed; case Opted out | ✅ F10 |
| Open `/ops`, `/office` | Forbidden | ✅ |

### Compliance

| Step | Expected | Result |
|------|----------|--------|
| Sign in | Lands on the welcome screen `/`; names masked on `/compliance` | ✅ |
| Claims ledger, consent ledger, audit log | Every action above recorded, including the reveal reason | ✅ |
| Open `/metrics` | Forbidden | ✅ |

### Executive

| Step | Expected | Result |
|------|----------|--------|
| Sign in | Lands on the welcome screen `/`; opens `/metrics` | ✅ |
| Funnel after the EN run | Reminded 36, Engaged 3, Confirmed 3, Paid 3, Issued 3, Handed over 1, Outcomes 2 | ✅ (after F13) |
| Open `/compliance` | Forbidden | ✅ |

### Admin

| Step | Expected | Result |
|------|----------|--------|
| Open every staff page | All 200; full nav | ✅ |
| Workflow canvas | Localized chrome; live counts per state | ✅ |
| Assistant on `/admin/workflow` | Topic answers in UI language | ✅ |
| Revoke telesales `agent:view` | Telesales sent to Forbidden from `/agent` | ✅ |
| Reset demo | Permissions and demo customers restored; queue empty | ✅ |

### Mobile (375 × 812)

| Surface | Expected | Result |
|---------|----------|--------|
| Office CS, Admin board, Claims; Classic chat; call; VETC | No horizontal scroll; no text the same colour as its background | ✅ |

## Product decisions applied in round 2

- **Telesales outcomes:** "Callback requested" and "Link sent" keep the handover in the queue (in progress). "Renewed" and "Not interested" close it. "Not interested" sets the case to Opted out, and campaigns exclude it. "Renewed" requires the customer's own certificate (PRODUCT rule 4).
- **Assistant for guests:** answers only the "where do I start" topic; everything else asks the visitor to sign in. Customers still get no assistant.

## Merge into release v0.2.1 (2026-10-15)

`improve-demo-workflows` merged onto the release layout (app under `demo/`, welcome screen, shared world shell, append-only audit ledger).

- **Landing:** every persona lands on the welcome screen `/`, except Chị Lan (`/call/cust_lan`) and Anh Tuấn (Classic chat `/chat/cust_tuan`).
- **Navigation:** the Classic ↔ Virtual Office toggle is gone; customers use the sidebar (Home, Virtual Office, Renewal, Claim).
- **Onboarding:** the automatic first-visit intro is removed; the header Tour button explains the open page, now including `/`, `/workshop` and `/lounge`.
- **Kept from this branch:** per-locale audit params, `globalThis` stores, demo agent guards (F3), streaming chat badge (F11), guest assistant (F12), Playwright suite (now in `demo/e2e/`).
- **Fixed during the merge:**
  - F15: Reset demo cleared the permission matrix in the session but the auth cookie kept the old `permOverrides`, so the proxy still blocked the restored route. `resetDemo` re-issues the cookie without overrides.
- **Result:** lint 0/0, build OK, Playwright 47/47.

## Fix history

| # | Round | Problem | Fix |
|---|-------|---------|-----|
| F1 | 1 | Chat actions in `/api/chat` invisible to pages in `next dev` (separate module `Map`s). | Session `Map` on `globalThis`. |
| F2 | 1 | Certificate links dropped part of ids containing `_` / `-`. | `chat-client.ts` matches `CERT-[A-Z0-9_-]{10}`. |
| F3 | 1 | Demo agent issued without confirmation, re-issued on every "pay", double-counted `confirmed`. | `demo-reply.ts` refuses while `incomplete`, returns the existing certificate, counts once; `issueCertificate` tool refuses a second issue. |
| F4 | 1 | Customers could open another customer's VETC / call page. | Ownership redirect on `/vetc/[id]` and `/call/[id]`. |
| F5 | 1 | In-memory store mutated the shared seed, so Reset didn't restore the demo customers. | `createSeedSession` deep-clones; memory store copies on save and load. |
| F6 | 1 | Assistant shown to customers with the staff queue badge; empty permission check in the API. | `canUseAssistant` in `rbac.ts` for host and route (403). |
| F7 | 1 | "Open Classic chat" white on white in the office Admin board. | `outline` button sets `text-foreground`. |
| F8 | 1 | English UI chrome in VI mode; workflow detail heading showed `[object Object]`. | Dictionary entries for claims, workflow canvas, verify page, exclusion reasons, channels; Detail reads the state node. |
| F9 | 1 | Handover channel always "zalo"; raw `**markdown**`; UTC dates. | Clients send `channel`; `ChatText` renders bold (voice strips it); `formatDate` in `Asia/Ho_Chi_Minh`. |
| F10 | 2 | Every outcome closed the handover; "Renewed" loggable without a certificate; "Not interested" left the case open to campaigns. | Outcome rules above in `telesales.ts` and `/agent`; `currentCertificate` helper shared with the demo agent and tools; last-outcome badge on the card. |
| F11 | 2 | Classic chat badge stayed "Needs confirmation" after confirming. | `/api/chat` returns `vehicleIncomplete` (JSON) or tool output (stream); `RenewalChat` updates the badge. |
| F12 | 2 | Guest assistant always failed: `proxy.ts` redirected `/api/assistant` to `/login`. | `/api/assistant` is public in the proxy; the route answers guests with the start guide only. |
| F13 | 2 | Re-running a campaign reminded customers who had renewed, set Lan back to No response, and doubled the Reminded count. | `campaign.ts` excludes `paid` / `issued` ("already renewed"), applies the Lan demo step only on her first reminder, and counts only newly reminded customers. |
| F14 | 2 | Default claim note always Vietnamese. | `createClaim` uses the locale cookie. |
| F15 | merge | Reset demo left stale permission overrides on the auth cookie. | `resetDemo` re-issues the cookie without `permOverrides`. |

## Not covered

- Real LLM mode (only the mock-stream check of `chat-client.ts`).
- Upstash Redis, Vercel deployment, ElevenLabs voice, real speech recognition.
- Walking in the office by hand (the e2e walk covers the route to the CS desk).
