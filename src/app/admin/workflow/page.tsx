import { AppShell } from "@/components/app-shell";
import { WorkflowCanvas } from "@/components/workflow/workflow-canvas";
import { requirePermission } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import type { CaseState } from "@/lib/types";

export default async function WorkflowPage() {
  await requirePermission("workflow:view");
  const auth = await requirePermission("workflow:view");
  const session = await getOrCreateSession(auth.sessionId);

  const counts: Record<string, number> = {};
  for (const state of Object.values(session.caseStates) as CaseState[]) {
    counts[state] = (counts[state] || 0) + 1;
  }

  return (
    <AppShell
      title="Workflow visualizer"
      subtitle="Process, states and schema — generated from the same code the app runs. Drag nodes, click for details, fit to view."
    >
      <WorkflowCanvas counts={counts} />
    </AppShell>
  );
}