import { convertToModelMessages, streamText, stepCountIs, type UIMessage } from "ai";
import { getAuth } from "@/lib/auth";
import { getOrCreateSession, saveSession } from "@/lib/session";
import { createRenewalTools } from "@/lib/agent/tools";
import { renewalSystemPrompt } from "@/lib/agent/prompt";
import { getModel } from "@/lib/llm/resolve";
import { demoRenewalReply } from "@/lib/agent/demo-reply";
import { appendAudit } from "@/lib/audit";
import { nanoid } from "nanoid";
import { getLocale } from "@/lib/i18n/locale";
import { CHAT_CHANNELS, type Channel } from "@/lib/types";

export const maxDuration = 60;

function hasAnyLlmKey(session: Awaited<ReturnType<typeof getOrCreateSession>>) {
  if (process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY) return true;
  if (process.env.ANTHROPIC_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return true;
  }
  return Object.values(session.settings.providerKeys).some(Boolean);
}

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const customerId = body.customerId as string;
  const messages = (body.messages || []) as UIMessage[];
  const channel: Channel = CHAT_CHANNELS.includes(body.channel) ? body.channel : "zalo";

  const session = await getOrCreateSession(auth.sessionId);
  const customer = session.customers.find((c) => c.id === customerId);
  if (!customer) {
    return Response.json({ error: "Customer not found" }, { status: 404 });
  }

  // Keep agent language in sync with the UI locale toggle
  const locale = await getLocale();
  customer.preferredLanguage = locale;

  if (auth.persona === "customer" && auth.customerId) {
    const allowed = session.customers.find((c) => c.demoKey === auth.customerId);
    if (!allowed || allowed.id !== customerId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (session.caseStates[customerId] === "reminded" || session.caseStates[customerId] === "scored" || session.caseStates[customerId] === "link_sent") {
    session.caseStates[customerId] = "engaged";
    session.funnel.engaged += 1;
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const lastText =
    lastUser?.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n") || "";

  appendAudit(session, {
    persona: auth.persona,
    customerId,
    action: "chat.message",
    detail: lastText.slice(0, 120),
  });
  await saveSession(session);

  if (!hasAnyLlmKey(session)) {
    const reply = await demoRenewalReply({
      session,
      customerId,
      userText: lastText || "hello",
      persona: auth.persona,
      channel,
      save: async () => {
        await saveSession(session);
      },
    });

    // Demo mode replies with JSON; LLM mode below streams. `sendRenewalChat` reads both.
    const vehicle = session.vehicles.find((v) => v.customerId === customerId);
    return Response.json({
      demo: true,
      text: reply,
      id: nanoid(),
      vehicleIncomplete: Boolean(vehicle?.incomplete),
    });
  }

  const model = await getModel(session, "chat");
  const tools = createRenewalTools({
    session,
    customerId,
    persona: auth.persona,
    channel,
    save: async () => {
      await saveSession(session);
    },
  });

  const result = streamText({
    model,
    system: renewalSystemPrompt(customer.preferredLanguage),
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}