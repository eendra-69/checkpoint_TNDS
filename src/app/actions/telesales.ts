"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { appendAudit } from "@/lib/audit";
import { getOrCreateSession, saveSession } from "@/lib/session";
import type { OutcomeCode } from "@/lib/types";

export async function revealPii(input: {
  customerId: string;
  field: "phone" | "nationalId";
  reason: string;
}) {
  const auth = await requirePermission("pii:reveal");
  const session = await getOrCreateSession(auth.sessionId);
  const current = session.revealedPii[input.customerId] || [];
  if (!current.includes(input.field)) {
    session.revealedPii[input.customerId] = [...current, input.field];
  }
  appendAudit(session, {
    persona: auth.persona,
    customerId: input.customerId,
    action: "pii.reveal",
    detail: `Revealed ${input.field}`,
    reason: input.reason,
  });
  await saveSession(session);
  revalidatePath("/agent");
  revalidatePath("/compliance");
}

export async function logOutcome(input: {
  customerId: string;
  code: OutcomeCode;
  handoverId?: string;
}) {
  const auth = await requirePermission("outcome:log");
  const session = await getOrCreateSession(auth.sessionId);
  session.outcomes.unshift({
    customerId: input.customerId,
    code: input.code,
    at: new Date().toISOString(),
  });
  if (input.handoverId) {
    const ho = session.handovers.find((h) => h.id === input.handoverId);
    if (ho) ho.status = "resolved";
  }
  appendAudit(session, {
    persona: auth.persona,
    customerId: input.customerId,
    action: "outcome.log",
    detail: input.code,
  });
  await saveSession(session);
  revalidatePath("/agent");
  revalidatePath("/metrics");
  revalidatePath("/compliance");
}

export async function sendRenewalLink(input: {
  customerId: string;
  handoverId: string;
}) {
  const auth = await requirePermission("renewal:send_link");
  const session = await getOrCreateSession(auth.sessionId);
  const ho = session.handovers.find((h) => h.id === input.handoverId);
  if (ho) {
    ho.renewalLinkSent = true;
    ho.status = "in_progress";
  }
  session.caseStates[input.customerId] = "link_sent";
  appendAudit(session, {
    persona: auth.persona,
    customerId: input.customerId,
    action: "renewal.link_sent",
    detail: "Secure renewal link sent to customer Zalo chat",
  });
  await saveSession(session);
  revalidatePath("/agent");
  revalidatePath("/compliance");
}