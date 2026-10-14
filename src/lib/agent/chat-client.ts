import {
  parseJsonEventStream,
  readUIMessageStream,
  uiMessageChunkSchema,
  type UIMessage,
  type UIMessageChunk,
} from "ai";
import type { CHAT_CHANNELS } from "@/lib/types";

export type ChatTurn = { id: string; role: "assistant" | "user"; content: string };

export type ChatReply = {
  text: string;
  /** Demo keyword agent (JSON) vs LLM UI message stream. */
  demo: boolean;
  /** Certificate id from reply text or an `issueCertificate` tool result. */
  certificateId?: string;
  /** Vehicle confirmation state after this turn, when the reply says so. */
  vehicleIncomplete?: boolean;
};

export type ChatChannel = (typeof CHAT_CHANNELS)[number];

export class ChatRequestError extends Error {}

// Ids are `CERT-${nanoid(10).toUpperCase()}`, so `_` and `-` can appear too.
const CERT_RE = /CERT-[A-Z0-9_-]{10}/;

function textOf(message: UIMessage) {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

/**
 * POST to `/api/chat` and read either reply shape the route can return:
 * - demo mode (no LLM key): JSON `{ demo: true, text }`
 * - LLM mode: AI SDK UI message stream (SSE); `onText` fires as text arrives
 */
export async function sendRenewalChat({
  customerId,
  channel,
  turns,
  onText,
}: {
  customerId: string;
  /** Where the customer is chatting from; recorded on handovers. */
  channel: ChatChannel;
  turns: ChatTurn[];
  onText?: (text: string) => void;
}): Promise<ChatReply> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerId,
      channel,
      messages: turns.map((m) => ({
        id: m.id,
        role: m.role,
        parts: [{ type: "text", text: m.content }],
      })),
    }),
  });

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new ChatRequestError(String(data.error || res.statusText));
    }
    const text = String(data.text || "");
    onText?.(text);
    return {
      text,
      demo: Boolean(data.demo),
      certificateId: text.match(CERT_RE)?.[0],
      vehicleIncomplete:
        typeof data.vehicleIncomplete === "boolean" ? data.vehicleIncomplete : undefined,
    };
  }

  if (!res.ok || !res.body) {
    throw new ChatRequestError(res.statusText || `HTTP ${res.status}`);
  }

  let streamError: string | undefined;
  const chunks = parseJsonEventStream({
    stream: res.body,
    schema: uiMessageChunkSchema,
  }).pipeThrough(
    new TransformStream<{ success: boolean; value?: UIMessageChunk; error?: unknown }, UIMessageChunk>({
      transform(result, controller) {
        if (result.success && result.value) controller.enqueue(result.value);
        else streamError ??= String(result.error ?? "Malformed stream chunk");
      },
    }),
  );

  let last: UIMessage | undefined;
  for await (const message of readUIMessageStream<UIMessage>({
    stream: chunks,
    onError: (err) => {
      streamError = err instanceof Error ? err.message : String(err);
    },
  })) {
    last = message;
    onText?.(textOf(message));
  }

  const text = last ? textOf(last) : "";
  if (!text && streamError) throw new ChatRequestError(streamError);
  // Tool results (e.g. issueCertificate → { certificateId }) are not in the text.
  const certificateId = last ? JSON.stringify(last.parts).match(CERT_RE)?.[0] : undefined;
  // confirmVehicle / lookupPolicy tool outputs carry `incomplete`.
  let vehicleIncomplete: boolean | undefined;
  for (const part of last?.parts ?? []) {
    const output = (part as { output?: unknown }).output;
    if (output && typeof output === "object" && "incomplete" in output) {
      const value = (output as { incomplete: unknown }).incomplete;
      if (typeof value === "boolean") vehicleIncomplete = value;
    }
  }
  return { text, demo: false, certificateId, vehicleIncomplete };
}
