"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { setLocaleCookie, type Locale } from "@/lib/i18n/locale";
import { getDemoCustomerId } from "@/lib/data/seed";
import { updateSession } from "@/lib/session";

export async function switchLocale(locale: Locale) {
  await setLocaleCookie(locale);

  const auth = await getAuth();
  if (auth?.persona === "customer") {
    const customerId = getDemoCustomerId(auth.customerId || "minh");
    await updateSession(auth.sessionId, (session) => {
      const customer = session.customers.find((c) => c.id === customerId);
      if (customer) customer.preferredLanguage = locale;
    });
  }

  revalidatePath("/", "layout");
}
