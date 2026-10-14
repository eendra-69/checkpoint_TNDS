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

  for (const score of session.scores.slice(0, 40)) {
    const customer = session.customers.find((c) => c.id === score.customerId);
    if (!customer) continue;

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
    if (session.caseStates[customer.id] === "scored") {
      session.caseStates[customer.id] = "reminded";
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
  session.funnel.reminded += targeted.length;

  // Demo story: Lan goes to no_response after campaign (ignored reminder)
  const lan = session.customers.find((c) => c.demoKey === "lan");
  if (lan && targeted.includes(lan.id)) {
    session.caseStates[lan.id] = "no_response";
  }

  await appendAudit(session.id, {
    persona: auth.persona,
    action: "campaign.run",
    detail: `Targeted ${run.targeted}, excluded ${run.excluded}`,
  });

  await saveSession(session);
  revalidatePath("/ops");
  revalidatePath("/metrics");
  revalidatePath("/compliance");
}