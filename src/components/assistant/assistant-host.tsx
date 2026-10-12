import { getAuth } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { FloatingAssistant } from "./floating-assistant";

export async function AssistantHost() {
  const auth = await getAuth();
  if (!auth) {
    return <FloatingAssistant enabled badgeCount={0} />;
  }
  const session = await getOrCreateSession(auth.sessionId);
  const enabled =
    auth.persona !== "customer" &&
    (hasPermission(auth.persona, "assistant:use", session.settings.permissionOverrides) ||
      auth.persona === "admin");
  const badgeCount = session.handovers.filter((h) => h.status === "queued").length;
  return <FloatingAssistant enabled={enabled || true} badgeCount={badgeCount} />;
}