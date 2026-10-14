import { AppShell } from "@/components/app-shell";
import { WorkflowCanvas } from "@/components/workflow/workflow-canvas";
import { requirePermission } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import type { CaseState } from "@/lib/types";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function WorkflowPage() {
  await requirePermission("workflow:view");
  const auth = await requirePermission("workflow:view");
  const session = await getOrCreateSession(auth.sessionId);
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const counts: Record<string, number> = {};
  for (const state of Object.values(session.caseStates) as CaseState[]) {
    counts[state] = (counts[state] || 0) + 1;
  }

  return (
    <AppShell
      title={dict.workflow.title}
      subtitle={dict.workflow.subtitle}
    >
      <WorkflowCanvas counts={counts} labels={dict.workflowCanvas} locale={locale} />
    </AppShell>
  );
}