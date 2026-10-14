"use server";

import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { setCustomerUiMode } from "@/lib/customer-mode";
import { getDemoCustomerId } from "@/lib/data/seed";
import { updateSession, getOrCreateSession } from "@/lib/session";
import type { CustomerUiMode } from "@/lib/types";

export async function switchCustomerMode(mode: CustomerUiMode) {
  const auth = await requirePermission("chat:use");
  if (auth.persona !== "customer") {
    redirect(mode === "office" ? "/office" : "/");
  }

  await setCustomerUiMode(mode);
  // Preference write — safe to create the session for. See locale.ts.
  await getOrCreateSession(auth.sessionId);
  await updateSession(auth.sessionId, async (session) => {
    session.settings.customerUiMode = mode;
  });

  if (mode === "office") {
    redirect("/office");
  }

  const customerId = getDemoCustomerId(auth.customerId || "minh");
  redirect(`/chat/${customerId}`);
}
