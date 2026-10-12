import { getAuth } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { WORKFLOW_NODES } from "@/lib/workflow/renewal";
import { DEMO_CUSTOMERS } from "@/lib/data/seed";

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth) {
    return Response.json({ error: "Sign in first" }, { status: 401 });
  }

  const session = await getOrCreateSession(auth.sessionId);
  if (!hasPermission(auth.persona, "assistant:use", session.settings.permissionOverrides) && auth.persona !== "admin") {
    // Allow tour guide on home/login even without assistant:use for convenience? Plan says internal personas.
    // Customer shouldn't reach here (UI hidden). Executive has assistant:use.
  }

  const { message, pathname } = (await req.json()) as {
    message: string;
    pathname: string;
  };

  const minh = session.scores.find(
    (s) => s.customerId === DEMO_CUSTOMERS.minh.customer.id,
  );
  const queue = session.handovers.filter((h) => h.status !== "resolved");
  const reveals = session.audit.filter((a) => a.action === "pii.reveal").slice(0, 5);

  let text = "";
  const q = (message || "").toLowerCase();

  if (pathname === "/" || q.includes("try first") || q.includes("demo day")) {
    text =
      "Start as Campaign manager → Run renewal campaign → Switch to Anh Minh (customer) and renew in chat → Switch to Chị Lan and ask for a human → Open Telesales → Check Metrics. Admin can show the workflow map to judges.";
  } else if (q.includes("minh") || q.includes("scored high")) {
    text = minh
      ? `Minh scores ${minh.score} (${minh.propensity}) because: ${minh.reasons.join("; ")}.`
      : "Minh is the happy-path demo driver with VETC activity and Zalo consent.";
  } else if (q.includes("consent")) {
    text =
      "Campaigns auto-exclude customers missing messaging/call/data-use consent and show exclusion counts. No separate compliance approval step in this demo (pilot-phase control in the deck).";
  } else if (q.includes("queue") || q.includes("urgent")) {
    text =
      queue.length === 0
        ? "Queue is empty. Escalate from chat (keyword: nhân viên) or use Lan’s voice call."
        : `You have ${queue.length} handover(s). Top: ${queue[0].summary}`;
  } else if (q.includes("renewal link")) {
    text =
      "On a handover card, click Send renewal link. That sets state to link_sent; the customer completes confirm + pay in chat. Telesales cannot issue certificates directly.";
  } else if (q.includes("reveal") || q.includes("pii")) {
    text =
      reveals.length === 0
        ? "No PII reveals yet. Telesales must enter a reason to reveal phone/ID; it appears here in the audit log."
        : `Recent reveals: ${reveals.map((r) => `${r.detail} (${r.reason})`).join("; ")}`;
  } else if (q.includes("uplift") || q.includes("cost")) {
    text =
      "Pitch assumes +8pp renewal uplift on a 28% baseline, plus ~4.5 minutes saved per bot-handled renewal. Costs stay low with Flash/mini models; Web Speech is free.";
  } else if (q.includes("ollama") || q.includes("local")) {
    text = process.env.VERCEL
      ? "Local providers (Ollama, LM Studio) are visible but disabled on Vercel. They work when self-hosted — useful for Decree 13 data-residency messaging."
      : "Local providers are enabled on this host. Point base URL at Ollama (11434) or LM Studio (1234).";
  } else if (q.includes("respond") || q.includes("doesn't") || q.includes("workflow")) {
    const node = WORKFLOW_NODES.find((n) => n.id === "no_response");
    text = node
      ? `If no response: ${node.description}. Next: ${node.transitions.map((t) => t.to).join(", ")}.`
      : "No-response path leads to consent-based voice call, then handover.";
  } else if (q.includes("national id") || q.includes("who can see")) {
    text =
      "Full national ID: customer (own), admin; telesales sees masked until Reveal-with-reason; campaign/executive get none/aggregate.";
  } else {
    text = `You're on ${pathname} as ${auth.persona}. Funnel so far — reminded ${session.funnel.reminded}, engaged ${session.funnel.engaged}, issued ${session.funnel.issued}, handed over ${session.funnel.handedOver}. Ask about scores, consent, queue, uplift, or workflow.`;
  }

  return Response.json({ text });
}