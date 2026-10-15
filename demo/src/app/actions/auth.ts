"use server";

import { redirect } from "next/navigation";
import { setAuthCookie, clearAuthCookie, getAuth } from "@/lib/auth";
import { getOrCreateSession, resetSession } from "@/lib/session";
import { appendAudit } from "@/lib/audit";
import { saveSession } from "@/lib/session";
import { PERSONAS } from "@/lib/rbac";
import { SignInSchema, isSafeNextPath, type SignInInput } from "@/lib/validation";
import { displayNameError, type DisplayNameError } from "@/lib/display-name";
import type { PersonaId } from "@/lib/types";
import { nanoid } from "nanoid";

/**
 * Returns the rejection reason instead of throwing, so the editor can show it
 * in the UI language (a thrown error reaches production clients as a generic
 * "Server Components render" message).
 */
export async function setDisplayName(raw: {
  displayName: string;
}): Promise<{ error: DisplayNameError } | { error: null }> {
  const displayName = String(raw?.displayName ?? "").trim();
  const error = displayNameError(displayName);
  if (error) return { error };
  const input = { displayName };
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
  return { error: null };
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
  const typed = String(formData.get("displayName") ?? "").trim();
  // The picker blocks an invalid name before submit; if one still arrives,
  // sign in under the persona name rather than failing the whole sign-in.
  const displayName = typed && !displayNameError(typed) ? typed : "";
  const customerKey = String(formData.get("customerKey") ?? "");
  // Same for a tampered redirect target: drop it and land as usual.
  const rawNext = String(formData.get("next") ?? "");
  const next = isSafeNextPath(rawNext) ? rawNext : "";

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
    params: {
      persona,
      ...(input.displayName ? { name: input.displayName } : {}),
      ...(input.customerKey ? { customer: input.customerKey } : {}),
    },
  });
  await saveSession(session);

  // Everyone lands on `/`, which renders the persona welcome screen: their own
  // numbers, their own checklist, and a short guide to what the app can do.
  // Dropping them straight onto `/office` or `/agent` dropped them into a
  // working surface with no explanation of what they were looking at.
  // `next` still wins, so deep links like /call/cust_lan survive sign-in.
  redirect(input.next || "/");
}

export async function signOut() {
  await clearAuthCookie();
  redirect("/login");
}

export async function resetDemo() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  await resetSession(auth.sessionId);
  // The reset session has no permission overrides, so drop them from the cookie
  // too, or the edge proxy keeps enforcing the matrix that was just wiped.
  await setAuthCookie({
    persona: auth.persona,
    customerId: auth.customerId,
    sessionId: auth.sessionId,
    displayName: auth.displayName,
  });
  // Back to the persona welcome screen, now with every counter back at zero —
  // which is exactly when a judge wants to see the "before" state.
  redirect("/");
}