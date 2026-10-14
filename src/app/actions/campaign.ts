"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { requirePermission } from "@/lib/auth";
import { appendAudit } from "@/lib/audit";
import { getOrCreateSession, saveSession } from "@/lib/session";
import type { CampaignRun } from "@/lib/types";

export async function runRenewalCampaign() {
  const auth = await requirePermission("campaign:run");
  const session = await getOrCreateSession(auth.sessionId);

  const exclusionReasons: Record<string, number> = {};
  const targeted: string[] = [];
  const newlyReminded: string[] = [];

  for (const score of session.scores.slice(0, 40)) {
    const customer = session.customers.find((c) => c.id === score.customerId);
    if (!customer) continue;

    const state = session.caseStates[customer.id];
    if (state === "opted_out") {
      exclusionReasons["opted_out"] = (exclusionReasons["opted_out"] || 0) + 1;
      continue;
    }
    // Never remind someone who already renewed this cycle.
    if (state === "paid" || state === "issued") {
      exclusionReasons["already_renewed"] = (exclusionReasons["already_renewed"] || 0) + 1;
      continue;
    }

    if (!customer.consent.messaging && score.nextBestAction.channel === "zalo") {
      exclusionReasons["no_messaging_consent"] =
        (exclusionReasons["no_messaging_consent"] || 0) + 1;
      continue;
    }
    if (!customer.consent.calls && score.nextBestAction.channel === "voice") {
      exclusionReasons["no_call_consent"] =
        (exclusionReasons["no_call_consent"] || 0) + 1;
      continue;
    }
    if (!customer.consent.dataUse) {
      exclusionReasons["no_data_use_consent"] =
        (exclusionReasons["no_data_use_consent"] || 0) + 1;
      continue;
    }

    targeted.push(customer.id);
    if (state === "scored") {
      session.caseStates[customer.id] = "reminded";
      newlyReminded.push(customer.id);
    }
  }

  const run: CampaignRun = {
    id: `camp_${nanoid(8)}`,
    runAt: new Date().toISOString(),
    targeted: targeted.length,
    excluded: Object.values(exclusionReasons).reduce((a, b) => a + b, 0),
    exclusionReasons,
    customerIds: targeted,
  };

  session.campaigns.unshift(run);
  // Funnel counts people, so a re-run must not count the same customers again.
  session.funnel.reminded += newlyReminded.length;

  // Demo story: Lan ignores her first reminder (only the run that reminds her, never later).
  const lan = session.customers.find((c) => c.demoKey === "lan");
  if (lan && newlyReminded.includes(lan.id)) {
    session.caseStates[lan.id] = "no_response";
  }

  appendAudit(session, {
    persona: auth.persona,
    action: "campaign.run",
    detail: `Targeted ${run.targeted}, excluded ${run.excluded}`,
    params: { targeted: run.targeted, excluded: run.excluded },
  });

  await saveSession(session);
  revalidatePath("/ops");
  revalidatePath("/metrics");
  revalidatePath("/compliance");
}