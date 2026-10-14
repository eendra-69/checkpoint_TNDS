"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { setAuthCookie, clearAuthCookie, getAuth } from "@/lib/auth";
import { getOrCreateSession, resetSession } from "@/lib/session";
import { appendAudit } from "@/lib/audit";
import { saveSession } from "@/lib/session";
import { PERSONAS } from "@/lib/rbac";
import { SignInSchema, displayNameSchema, type SignInInput } from "@/lib/validation";
import type { PersonaId } from "@/lib/types";
import { nanoid } from "nanoid";

export async function setDisplayName(raw: { displayName: string }) {
  const input = z.object({ displayName: displayNameSchema }).parse(raw);
  const auth = await getAuth();
  if (!auth) redirect("/login");

  const session = await getOrCreateSession(auth.sessionId);
  await appendAudit(session.id, {
    persona: auth.persona,
    action: "profile.display_name",
    detail: `Set display name to ${input.displayName}`,
  });
  await saveSession(session);

  // Re-issue the cookie with the new name. Must carry permOverrides across,
  // or renaming yourself would silently discard the admin's permission matrix.
  await setAuthCookie({
    persona: auth.persona,
    customerId: auth.customerId,
    sessionId: auth.sessionId,
    displayName: input.displayName,
    permOverrides: auth.permOverrides,
  });
}

export async function signInAs(raw: unknown) {
  return startSignIn(SignInSchema.parse(raw));
}

/**
 * Form-friendly entry point. A Client Component cannot define an inline
 * `"use server"` closure, so the persona picker posts plain fields and this
 * action reassembles them before delegating to `startSignIn`.
 */
export async function signInWithForm(formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const customerKey = String(formData.get("customerKey") ?? "");
  const next = String(formData.get("next") ?? "");

  return startSignIn(
    SignInSchema.parse({
      persona: formData.get("persona"),
      customerKey: customerKey || undefined,
      next: next || undefined,
      displayName: displayName || undefined,
    }),
  );
}

async function startSignIn(input: SignInInput) {
  const persona: PersonaId = input.persona;
  const existing = await getAuth();
  const sessionId = existing?.sessionId || nanoid(16);
  const prior = await getOrCreateSession(sessionId);

  // Previously `persona` came straight off the wire into a signed JWT, and
  // PERSONAS[input.persona].label threw on anything unexpected.
  await setAuthCookie({
    persona,
    customerId: persona === "customer" ? input.customerKey || "minh" : undefined,
    sessionId,
    displayName: input.displayName || undefined,
    // Signing in as another persona on the same session must not silently
    // reset the permission matrix this session was configured with.
    permOverrides: prior.settings.permissionOverrides,
  });

  const session = prior;
  await appendAudit(session.id, {
    persona,
    action: "auth.signin",
    detail: `Signed in as ${PERSONAS[persona].label}${
      input.displayName ? ` (${input.displayName})` : ""
    }${input.customerKey ? ` (${input.customerKey})` : ""}`,
  });
  await saveSession(session);

  const home =
    input.next || (persona === "customer" ? "/office" : PERSONAS[persona].homePath);

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