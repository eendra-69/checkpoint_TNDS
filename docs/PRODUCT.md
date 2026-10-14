# Product and demo story

## Purpose

Pitch-ready demo for **BeyondPilot × Tasco**: make compulsory motor liability (**TNDS**) renewal something drivers complete in chat, VETC, voice, or a branded Virtual Office — with transparent scoring, consent, and human handover.

This is **not** a licensed insurer platform. Payment, issuance, and claims are simulated. Data is synthetic.

## Hard rules

1. **No discounts.** Premiums come from `demo/src/lib/pricing.ts` (illustrative Decree 67/2023-style schedule). UI and agent copy must never offer promotions, cashback, or countdown pressure.
2. **Consent gates campaigns.** Running a campaign excludes customers without messaging/call/data-use consent and records exclusion counts.
3. **Customers confirm before issue.** Incomplete vehicles (Anh Tuấn) must be confirmed before a certificate can be issued.
4. **Telesales does not issue certificates.** Agents send a renewal link; the customer confirms and pays in their own surface.
5. **Claims are demo-only.** Photo upload + stub AI triage + status buttons. Do not present as a live claims API.
6. **Mark the demo.** Watermark: `DEMO — SYNTHETIC`. Assumptions (ZNS template, payment gateway, insurer API) stay visible where relevant.
7. **Default language Vietnamese.** English is a toggle, not the default.
8. **Default customer UI is Virtual Office.** Classic Zalo/VETC is one click away (`tasco-ui-mode` cookie).

## Personas

Defined in `demo/src/lib/rbac.ts`. Sign-in is passwordless (`/login`).

| Persona | Home | Role in the pitch |
|---------|------|-------------------|
| Customer — Anh Minh | `/office` | Happy path: high score, VETC-active, complete profile, ~21 days to expiry |
| Customer — Chị Lan | `/call/cust_lan` | Ignores chat → voice → asks for human |
| Customer — Anh Tuấn | `/office` | Incomplete vehicle; must confirm plate/make in chat |
| Campaign manager | `/ops` | Scores, campaign, funnel |
| Telesales | `/agent` | Handover queue, PII reveal-with-reason, renewal link, outcome |
| Compliance | `/compliance` | Consent ledger + append-only audit (read-only) |
| Executive | `/metrics` | Funnel + stated uplift assumptions |
| Admin | `/admin` | LLM providers, RBAC overrides, workflow map |

Customers only see their own policy (`customer:own_only`). Staff PII is masked unless telesales/admin reveal with a reason (`demo/src/lib/masking.ts`).

## Suggested 3-minute path

1. Sign in as **Campaign manager** → **Run renewal campaign**.
2. Switch to **Anh Minh** → walk to CS (or Classic chat) → confirm → mock pay → open `/verify/CERT-…`.
3. Switch to **Chị Lan** → voice → say “nhân viên” / “human”.
4. Switch to **Telesales** → open handover → reveal phone with reason → **Send renewal link**.
5. **Admin** → `/admin/workflow` for judges.

## Case states

Canonical list: `CaseState` in `demo/src/lib/types.ts`. Transitions: `demo/src/lib/workflow/renewal.ts` (this is what `/admin/workflow` draws).

Happy path: `scored` → `reminded` → `engaged` → `confirmed` → `paid`/`issued`.

Handover path: `handed_over` → `link_sent` → customer resumes `engaged`.

## Channels

- **Classic:** simulated Zalo OA + ZNS (`/chat/[customerId]`), VETC app chrome (`/vetc/[customerId]`), voice (`/call/[customerId]`).
- **Office:** HD-2D walkable floor (`/office`) with CS, Claims, Admin board, Reception, VETC kiosk.

Both customer surfaces share the same `/api/chat` agent and the same session.

## What “done” looks like for a renewal

1. Vehicle confirmed (`incomplete === false`).
2. Mock payment at regulated premium.
3. Certificate row on the session + QR page at `/verify/[certId]`.
4. Funnel counters and audit events updated.
