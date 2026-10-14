"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { setLocaleCookie, type Locale } from "@/lib/i18n/locale";
import { getDemoCustomerId } from "@/lib/data/seed";
import { updateSession, getOrCreateSession } from "@/lib/session";

export async function switchLocale(locale: Locale) {
  await setLocaleCookie(locale);

  const auth = await getAuth();
  if (auth?.persona === "customer") {
    const customerId = getDemoCustomerId(auth.customerId || "minh");
    // A preference write is safe to create the session for: re-seeding loses
    // nothing the user would miss, whereas claims/outcomes must never do that
    // (see updateSession's MissingSessionError).
    await getOrCreateSession(auth.sessionId);
    await updateSession(auth.sessionId, async (session) => {
      const customer = session.customers.find((c) => c.id === customerId);
      if (customer) customer.preferredLanguage = locale;
    });
  }

  revalidatePath("/", "layout");
}
