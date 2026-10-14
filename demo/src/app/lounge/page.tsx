import { AppShell } from "@/components/app-shell";
import { LoungeExperience } from "@/components/lounge/LoungeExperience";
import { requirePermission } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { getLocale } from "@/lib/i18n/locale";

export default async function LoungePage() {
  const auth = await requirePermission("lounge:use");

  // Unlike /office, every persona holding `lounge:use` belongs here, so there
  // is no redirect — only the shell + gate. The session is still materialised
  // so a first-time persona lands on a fully seeded world.
  await getOrCreateSession(auth.sessionId);

  const locale = await getLocale();

  return (
    <AppShell compact bleed>
      <LoungeExperience
        displayName={auth.displayName?.trim() || auth.persona}
        persona={auth.persona}
        locale={locale}
      />
    </AppShell>
  );
}
