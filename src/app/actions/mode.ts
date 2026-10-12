"use server";

import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { setCustomerUiMode } from "@/lib/customer-mode";
import { getDemoCustomerId } from "@/lib/data/seed";
import { updateSession } from "@/lib/session";
import type { CustomerUiMode } from "@/lib/types";

export async function switchCustomerMode(mode: CustomerUiMode) {
  const auth = await requirePermission("chat:use");
  if (auth.persona !== "customer") {
    redirect(mode === "office" ? "/office" : "/");
  }

  await setCustomerUiMode(mode);
  await updateSession(auth.sessionId, (session) => {
    session.settings.customerUiMode = mode;
  });

  if (mode === "office") {
    redirect("/office");
  }

  const customerId = getDemoCustomerId(auth.customerId || "minh");
  redirect(`/chat/${customerId}`);
}
