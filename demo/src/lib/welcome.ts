import type {
  AuthContext,
  CaseState,
  DemoSession,
  OutcomeCode,
  PersonaId,
} from "./types";

/**
 * Everything the persona welcome screen shows, derived from the demo session.
 *
 * Kept free of i18n and JSX on purpose: the screen renders these ids against the
 * dictionary, so this file stays testable and the two locales never drift apart.
 * Every number here is counted from real session state — nothing is faked, and
 * the few targets that *are* assumed are named as such in `assumptionKeys`.
 */

/** Demo caseload target for a telesales day. Not a real Tasco quota. */
export const DAILY_RENEWAL_TARGET = 6;

/** Voluntary renewal rate used as the "before BeyondPilot" baseline. */
export const BASELINE_RENEWAL_RATE = 0.28;

export type TaskState = "done" | "active" | "todo";

export type WelcomeTask = {
  id: string;
  state: TaskState;
  /** Count or short qualifier rendered next to the task, e.g. "3 leads". */
  meta?: string;
  href?: string;
};

export type WelcomeMetric = {
  id: string;
  value: string;
  /** Optional qualifier under the value, e.g. "this session". */
  hint?: string;
  /** Fraction 0..1 for the progress meter; omit for non-progress figures. */
  progress?: number;
  tone?: "leaf" | "lime" | "sky" | "vetc" | "warn";
};

export type WelcomeAction = {
  id: string;
  href: string;
  tone: "primary" | "ghost";
};

export type WelcomeModel = {
  persona: PersonaId;
  /**
   * Values the dictionary templates interpolate, e.g. `{name}` or `{caseload}`.
   * All user-facing prose lives in the dictionary so VI and EN never drift.
   */
  vars: Record<string, string | number>;
  metrics: WelcomeMetric[];
  tasks: WelcomeTask[];
  actions: WelcomeAction[];
  /** Keys into `welcome.assumption.<persona>` for figures that are assumptions. */
  assumptionKeys: string[];
};

type CaseBucket = {
  renewed: string[];
  paid: string[];
  inProgress: string[];
  needsCallback: string[];
  waiting: string[];
  lapsed: string[];
};

function bucketCases(session: DemoSession): CaseBucket {
  const out: CaseBucket = {
    renewed: [],
    paid: [],
    inProgress: [],
    needsCallback: [],
    waiting: [],
    lapsed: [],
  };
  for (const [customerId, state] of Object.entries(session.caseStates)) {
    switch (state as CaseState) {
      case "issued":
        out.renewed.push(customerId);
        break;
      case "paid":
        out.paid.push(customerId);
        break;
      case "no_response":
      case "voice_call":
        out.needsCallback.push(customerId);
        break;
      case "opted_out":
      case "expired":
        out.lapsed.push(customerId);
        break;
      case "scored":
      case "reminded":
      case "engaged":
      case "confirmed":
      case "link_sent":
      case "handed_over":
        out.waiting.push(customerId);
        break;
    }
  }
  return out;
}

function countOutcome(session: DemoSession, code: OutcomeCode) {
  return session.outcomes.filter((o) => o.code === code).length;
}

/** Cases where an AI conversation is still open, i.e. unanswered threads. */
function openConversationCount(session: DemoSession) {
  return session.conversations.filter((c) => c.status !== "closed").length;
}

function pct(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.max(0, Math.min(1, numerator / denominator));
}

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

// ---------------------------------------------------------------------------
// Per-persona builders
// ---------------------------------------------------------------------------

function customerModel(
  auth: AuthContext,
  session: DemoSession,
  displayName: string | undefined,
): WelcomeModel {
  const focus =
    session.customers.find((c) => c.demoKey === auth.customerId) ??
    session.customers[0];
  const vehicle = session.vehicles.find((v) => v.customerId === focus?.id);
  const policy = session.policies.find((p) => p.customerId === focus?.id);
  const certificate = session.certificates.find((c) => c.customerId === focus?.id);
  const state = focus ? session.caseStates[focus.id] : undefined;

  const daysLeft = policy
    ? Math.round(
        (new Date(policy.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
    : null;

  const metrics: WelcomeMetric[] = [
    {
      id: "status",
      value: state ? state.replace(/_/g, " ") : "scored",
      hint: "renewal case",
      tone: certificate ? "vetc" : state === "opted_out" ? "warn" : "leaf",
    },
  ];

  if (policy) {
    metrics.push({
      id: "policy",
      value: daysLeft !== null && daysLeft >= 0 ? `${daysLeft} days` : "expired",
      hint: `${policy.product} · ${formatVnd(policy.premiumVnd)}`,
      tone: daysLeft !== null && daysLeft < 30 ? "warn" : "leaf",
    });
  }
  if (vehicle) {
    metrics.push({
      id: "vehicle",
      value: vehicle.plate,
      hint: `${vehicle.make} ${vehicle.model} · ${vehicle.year}`,
      tone: vehicle.incomplete ? "warn" : "lime",
    });
  }
  if (certificate) {
    metrics.push({
      id: "certificate",
      value: "Active",
      hint: certificate.id,
      tone: "vetc",
    });
  }

  const tasks: WelcomeTask[] = [];
  if (!policy) {
    tasks.push({ id: "addPolicy", state: "todo", href: "/chat" });
  }
  if (vehicle?.incomplete) {
    tasks.push({ id: "completeVehicle", state: "todo", href: "/chat" });
  }
  if (!certificate && policy) {
    tasks.push({
      id: "renewNow",
      state: daysLeft !== null && daysLeft <= 30 ? "active" : "todo",
      href: "/chat",
    });
  }
  if (certificate) {
    tasks.push({ id: "certIssued", state: "done" });
  }
  tasks.push({ id: "visitOffice", state: "todo", href: "/office" });
  tasks.push({ id: "visitWorkshop", state: "todo", href: "/workshop" });

  return {
    persona: "customer",
    vars: {
      name: displayName ?? focus?.fullName ?? "",
      customer: focus?.fullNameVi ?? "",
      daysLeft: daysLeft ?? 0,
      renewed: certificate ? 1 : 0,
    },
    metrics,
    tasks,
    actions: [
      { id: "openOffice", href: "/office", tone: "primary" },
      { id: "openChat", href: "/chat", tone: "ghost" },
      { id: "openLounge", href: "/lounge", tone: "ghost" },
    ],
    assumptionKeys: [],
  };
}

function telesalesModel(session: DemoSession): WelcomeModel {
  const cases = bucketCases(session);
  const caseload = session.scores.length;
  const renewals = session.certificates.length;
  const callbacks = cases.needsCallback.length;
  const openThreads = openConversationCount(session);
  const highValue = session.scores.filter((s) => s.propensity === "high").length;
  const premiumTotal = session.certificates.reduce(
    (sum, c) => sum + c.premiumVnd,
    0,
  );

  return {
    persona: "telesales",
    vars: { caseload, highValue, renewals, target: DAILY_RENEWAL_TARGET },
    metrics: [
      {
        id: "renewals",
        value: `${renewals}/${DAILY_RENEWAL_TARGET}`,
        hint: "renewals vs daily target",
        progress: pct(renewals, DAILY_RENEWAL_TARGET),
        tone: renewals >= DAILY_RENEWAL_TARGET ? "vetc" : "lime",
      },
      {
        id: "premium",
        value: premiumTotal > 0 ? formatVnd(premiumTotal) : "—",
        hint: "premium renewed",
        tone: "leaf",
      },
      {
        id: "callbacks",
        value: String(callbacks),
        hint: "awaiting callback",
        tone: callbacks > 0 ? "warn" : "sky",
      },
      {
        id: "threads",
        value: String(openThreads),
        hint: "open AI threads",
        tone: "sky",
      },
    ],
    tasks: [
      {
        id: "callbacks",
        state: callbacks > 0 ? "active" : "done",
        meta: callbacks > 0 ? `${callbacks} leads` : "clear",
        href: "/agent",
      },
      {
        id: "openThreads",
        state: openThreads > 0 ? "active" : "done",
        meta: openThreads > 0 ? `${openThreads} chats` : "clear",
        href: "/agent",
      },
      {
        id: "handover",
        state: cases.renewed.length > 0 ? "done" : "todo",
        meta: `${session.handovers.length} total`,
        href: "/agent",
      },
      {
        id: "dailyTarget",
        state: renewals >= DAILY_RENEWAL_TARGET ? "done" : "todo",
        meta: `${renewals}/${DAILY_RENEWAL_TARGET}`,
        href: "/agent",
      },
    ],
    actions: [
      { id: "openAgent", href: "/agent", tone: "primary" },
      { id: "openWorkshop", href: "/workshop", tone: "ghost" },
    ],
    assumptionKeys: ["dailyTarget"],
  };
}

function campaignModel(session: DemoSession): WelcomeModel {
  const last = session.campaigns[session.campaigns.length - 1];
  const cases = bucketCases(session);
  const totalTargeted = session.campaigns.reduce((n, c) => n + c.targeted, 0);
  const totalExcluded = session.campaigns.reduce((n, c) => n + c.excluded, 0);
  const high = session.scores.filter((s) => s.propensity === "high").length;
  const medium = session.scores.filter((s) => s.propensity === "medium").length;
  const low = session.scores.filter((s) => s.propensity === "low").length;

  return {
    persona: "campaign_manager",
    vars: {
      runs: session.campaigns.length,
      targeted: last?.targeted ?? 0,
      excluded: last?.excluded ?? 0,
    },
    metrics: [
      {
        id: "targeted",
        value: String(totalTargeted),
        hint: `${session.campaigns.length} runs`,
        tone: "lime",
      },
      {
        id: "excluded",
        value: String(totalExcluded),
        hint: "consent + eligibility holds",
        tone: "sky",
      },
      { id: "high", value: String(high), hint: "high propensity", tone: "vetc" },
      { id: "medium", value: String(medium), hint: "medium propensity", tone: "leaf" },
      { id: "low", value: String(low), hint: "low propensity", tone: "warn" },
      {
        id: "renewalRate",
        value: `${Math.round(pct(session.certificates.length, session.scores.length) * 100)}%`,
        hint: `renewed of ${session.scores.length} leads`,
        tone: "lime",
      },
    ],
    tasks: [
      {
        id: "reviewScores",
        state: high > 0 ? "active" : "done",
        meta: `${high} high`,
        href: "/ops",
      },
      {
        id: "runCampaign",
        state: session.campaigns.length > 0 ? "done" : "todo",
        meta: `${session.campaigns.length} runs`,
        href: "/ops",
      },
      {
        id: "chaseLapsed",
        state: cases.lapsed.length > 0 ? "active" : "done",
        meta: `${cases.lapsed.length} lapsed`,
        href: "/ops",
      },
    ],
    actions: [
      { id: "openOps", href: "/ops", tone: "primary" },
      { id: "openMetrics", href: "/metrics", tone: "ghost" },
    ],
    assumptionKeys: [],
  };
}

function complianceModel(
  session: DemoSession,
  auditTotal: number,
  auditDropped: number,
): WelcomeModel {
  const claims = session.claims;
  const resolvedClaims = claims.filter((c) => c.status === "resolved").length;
  const piiReveals = Object.values(session.revealedPii).reduce(
    (n, keys) => n + keys.length,
    0,
  );
  const openHandovers = session.handovers.filter((h) => h.status !== "resolved").length;

  return {
    persona: "compliance",
    vars: { auditTotal, auditDropped, events: auditTotal },
    metrics: [
      { id: "auditEvents", value: String(auditTotal), hint: "ledger events", tone: "lime" },
      {
        id: "ledgerHealth",
        value: auditDropped === 0 ? "Intact" : `${auditDropped} aged`,
        hint: "append-only, oldest trimmed",
        tone: auditDropped === 0 ? "vetc" : "warn",
      },
      { id: "piiReveals", value: String(piiReveals), hint: "justified PII reveals", tone: piiReveals > 0 ? "warn" : "sky" },
      { id: "claims", value: `${resolvedClaims}/${claims.length}`, hint: "claims resolved", tone: "leaf" },
      { id: "handovers", value: String(openHandovers), hint: "open escalations", tone: openHandovers > 0 ? "warn" : "sky" },
    ],
    tasks: [
      {
        id: "reviewClaims",
        state: claims.some((c) => c.status === "need_info") ? "active" : "done",
        meta: `${claims.filter((c) => c.status === "need_info").length} need info`,
        href: "/compliance",
      },
      {
        id: "closeEscalations",
        state: openHandovers > 0 ? "active" : "done",
        meta: `${openHandovers} open`,
        href: "/compliance",
      },
      { id: "auditTrail", state: "done", meta: `${auditTotal} events`, href: "/compliance" },
    ],
    actions: [
      { id: "openCompliance", href: "/compliance", tone: "primary" },
      { id: "openMetrics", href: "/metrics", tone: "ghost" },
    ],
    assumptionKeys: [],
  };
}

function executiveModel(session: DemoSession): WelcomeModel {
  const f = session.funnel;
  const scored = session.scores.length;
  const renewals = session.certificates.length;
  const rate = pct(renewals, scored);
  const premium = session.certificates.reduce((s, c) => s + c.premiumVnd, 0);
  const callbacks = countOutcome(session, "callback_requested");

  return {
    persona: "executive",
    vars: {
      scored,
      renewals,
      ratePct: Math.round(rate * 100),
      baselinePct: Math.round(BASELINE_RENEWAL_RATE * 100),
    },
    metrics: [
      { id: "scored", value: String(scored), hint: "leads scored", tone: "lime" },
      { id: "reminded", value: String(f.reminded), hint: "reminded", tone: "sky" },
      { id: "engaged", value: String(f.engaged), hint: "engaged", tone: "sky" },
      { id: "renewed", value: String(renewals), hint: "certificates issued", tone: "vetc" },
      {
        id: "renewalRate",
        value: `${Math.round(rate * 100)}%`,
        hint: "renewal rate observed",
        progress: rate,
        tone: rate >= BASELINE_RENEWAL_RATE ? "vetc" : "warn",
      },
      {
        id: "premium",
        value: premium > 0 ? formatVnd(premium) : "—",
        hint: "premium renewed",
        tone: "leaf",
      },
      { id: "callbacks", value: String(callbacks), hint: "callbacks requested", tone: "leaf" },
    ],
    tasks: [
      { id: "reviewFunnel", state: "todo", href: "/metrics" },
      { id: "reviewUpsell", state: "todo", href: "/metrics" },
      { id: "openOffice", state: "todo", href: "/office" },
    ],
    actions: [
      { id: "openMetrics", href: "/metrics", tone: "primary" },
      { id: "openCompliance", href: "/compliance", tone: "ghost" },
    ],
    assumptionKeys: ["renewalBaseline"],
  };
}

function adminModel(
  session: DemoSession,
  auditTotal: number,
  loungeMessages: number,
): WelcomeModel {
  const cases = bucketCases(session);
  const tracked = Object.keys(session.caseStates).length;
  const solved =
    cases.renewed.length +
    cases.paid.length +
    cases.lapsed.length +
    cases.needsCallback.length;
  const renewals = session.certificates.length;
  const premium = session.certificates.reduce((s, c) => s + c.premiumVnd, 0);
  const resolvedClaims = session.claims.filter((c) => c.status === "resolved").length;
  const resolvedHandovers = session.handovers.filter((h) => h.status === "resolved").length;
  const piiReveals = Object.values(session.revealedPii).reduce(
    (n, keys) => n + keys.length,
    0,
  );

  return {
    persona: "admin",
    vars: { solved, tracked, renewals, auditTotal },
    metrics: [
      {
        id: "ticketsSolved",
        value: `${solved}/${tracked}`,
        hint: "cases worked",
        progress: pct(solved, tracked),
        tone: "lime",
      },
      { id: "renewed", value: String(renewals), hint: "policies renewed", tone: "vetc" },
      {
        id: "premium",
        value: premium > 0 ? formatVnd(premium) : "—",
        hint: "premium renewed",
        tone: "leaf",
      },
      { id: "auditEvents", value: String(auditTotal), hint: "audit events", tone: "sky" },
      { id: "loungeMessages", value: String(loungeMessages), hint: "moderated lounge posts", tone: "sky" },
      { id: "piiReveals", value: String(piiReveals), hint: "PII reveals", tone: piiReveals > 0 ? "warn" : "sky" },
      {
        id: "claimsResolved",
        value: `${resolvedClaims}/${session.claims.length}`,
        hint: "claims resolved",
        tone: "leaf",
      },
      { id: "escalations", value: String(resolvedHandovers), hint: "escalations resolved", tone: "leaf" },
    ],
    tasks: [
      { id: "reviewAudit", state: auditTotal > 0 ? "active" : "todo", meta: `${auditTotal} events`, href: "/admin" },
      { id: "reviewClaims", state: "todo", meta: `${session.claims.length} claims`, href: "/compliance" },
      { id: "moderation", state: "todo", meta: `${loungeMessages} posts`, href: "/admin" },
      { id: "workflow", state: "todo", href: "/admin/workflow" },
    ],
    actions: [
      { id: "openAdmin", href: "/admin", tone: "primary" },
      { id: "openCompliance", href: "/compliance", tone: "ghost" },
      { id: "openMetrics", href: "/metrics", tone: "ghost" },
    ],
    assumptionKeys: [],
  };
}

export type WelcomeExtras = {
  auditTotal: number;
  auditDropped: number;
  loungeMessages: number;
};

/** Build the welcome model for whoever is signed in. */
export function buildWelcomeModel(
  auth: AuthContext,
  session: DemoSession,
  extras: WelcomeExtras,
  displayName?: string,
): WelcomeModel {
  switch (auth.persona) {
    case "customer":
      return customerModel(auth, session, displayName);
    case "telesales":
      return telesalesModel(session);
    case "campaign_manager":
      return campaignModel(session);
    case "compliance":
      return complianceModel(session, extras.auditTotal, extras.auditDropped);
    case "executive":
      return executiveModel(session);
    case "admin":
      return adminModel(session, extras.auditTotal, extras.loungeMessages);
  }
}