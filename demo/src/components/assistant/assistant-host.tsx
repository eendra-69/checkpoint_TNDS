import { getAuth } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { canUseAssistant } from "@/lib/rbac";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { FloatingAssistant } from "./floating-assistant";

export async function AssistantHost() {
  const auth = await getAuth();
  const locale = await getLocale();
  const labels = getDictionary(locale).assistant;
  if (!auth) {
    return <FloatingAssistant enabled guest badgeCount={0} locale={locale} labels={labels} />;
  }
  const session = await getOrCreateSession(auth.sessionId);
  const enabled = canUseAssistant(auth.persona, session.settings.permissionOverrides);
  // Queue size is staff data; never compute it for a persona that can't see the assistant.
  const badgeCount = enabled
    ? session.handovers.filter((h) => h.status === "queued").length
    : 0;
  return (
    <FloatingAssistant
      enabled={enabled}
      badgeCount={badgeCount}
      locale={locale}
      labels={labels}
    />
  );
}