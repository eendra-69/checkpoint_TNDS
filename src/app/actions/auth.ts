"use server";

import { redirect } from "next/navigation";
import { setAuthCookie, clearAuthCookie, getAuth } from "@/lib/auth";
import { getOrCreateSession, resetSession } from "@/lib/session";
import { appendAudit } from "@/lib/audit";
import { saveSession } from "@/lib/session";
import { PERSONAS } from "@/lib/rbac";
import { getDemoCustomerId } from "@/lib/data/seed";
import type { DemoCustomerId, PersonaId } from "@/lib/types";
import { nanoid } from "nanoid";

export async function signInAs(input: {
  persona: PersonaId;
  customerKey?: DemoCustomerId;
  next?: string;
}) {
  const existing = await getAuth();
  const sessionId = existing?.sessionId || nanoid(16);
  await getOrCreateSession(sessionId);

  await setAuthCookie({
    persona: input.persona,
    customerId: input.persona === "customer" ? input.customerKey || "minh" : undefined,
    sessionId,
  });

  const session = await getOrCreateSession(sessionId);
  appendAudit(session, {
    persona: input.persona,
    action: "auth.signin",
    detail: `Signed in as ${PERSONAS[input.persona].label}${
      input.customerKey ? ` (${input.customerKey})` : ""
    }`,
  });
  await saveSession(session);

  const home =
    input.next ||
    (input.persona === "customer"
      ? `/chat/${getDemoCustomerId(input.customerKey || "minh")}`
      : PERSONAS[input.persona].homePath);

  redirect(home);
}

export async function signOut() {
  await clearAuthCookie();
  redirect("/login");
}

export async function resetDemo() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  await resetSession(auth.sessionId);
  redirect(PERSONAS[auth.persona].homePath);
}