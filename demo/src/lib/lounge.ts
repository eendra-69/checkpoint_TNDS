import { Redis } from "@upstash/redis";
import { nanoid } from "nanoid";
import { moderate } from "./moderation";
import type { LoungeMessage, ModerationSettings, PersonaId } from "./types";

/**
 * Shared virtual-lounge chat.
 *
 * The lounge is a *public* room: everyone signed into the demo sees the same
 * feed regardless of which session they signed in with. That means messages
 * and moderation config live in a shared store (Redis), not on DemoSession,
 * so there is exactly one source of truth for "what is on screen" and one for
 * "what words are blocked".
 */

const MESSAGES_KEY = "tasco:lounge:messages";
const MODERATION_KEY = "tasco:lounge:moderation";
const MAX_MESSAGES = 100;

export const DEFAULT_MODERATION: ModerationSettings = {
  enabled: true,
  badwords: [
    "đm",
    "vcl",
    "vl",
    "clm",
    "dcm",
    "shit",
    "fuck",
    "bitch",
    "asshole",
    "idiot",
  ],
  maskChar: "*",
  logToAudit: true,
};

function redisConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

function getRedis() {
  if (!redisConfigured()) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

let memoryMessages: LoungeMessage[] = [];
let memoryModeration: ModerationSettings | null = null;

export async function listMessages(limit = MAX_MESSAGES): Promise<LoungeMessage[]> {
  const redis = getRedis();
  if (!redis) return memoryMessages.slice(-limit).reverse();

  try {
    const rows = await redis.lrange<LoungeMessage>(MESSAGES_KEY, 0, limit - 1);
    return (rows ?? []).filter(Boolean);
  } catch {
    return [];
  }
}

export async function getModeration(): Promise<ModerationSettings> {
  const redis = getRedis();
  if (!redis) return memoryModeration ?? DEFAULT_MODERATION;

  try {
    const raw = await redis.get<ModerationSettings>(MODERATION_KEY);
    if (!raw) return DEFAULT_MODERATION;
    return {
      ...DEFAULT_MODERATION,
      ...raw,
      badwords: Array.isArray(raw.badwords) ? raw.badwords : [],
    };
  } catch {
    return DEFAULT_MODERATION;
  }
}

export async function saveModeration(
  next: Partial<ModerationSettings>,
): Promise<ModerationSettings> {
  const current = await getModeration();
  const merged: ModerationSettings = {
    ...current,
    ...next,
    badwords: Array.isArray(next.badwords)
      ? next.badwords.map((w) => String(w).trim()).filter(Boolean)
      : current.badwords,
  };

  const redis = getRedis();
  if (!redis) {
    memoryModeration = merged;
    return merged;
  }
  await redis.set(MODERATION_KEY, merged);
  return merged;
}

export type PostResult = {
  message: LoungeMessage;
  /** True when at least one badword was masked before storing. */
  moderated: boolean;
};

/**
 * Apply moderation and append to the shared feed.
 * Moderation is enforced here, server-side, before anything is persisted —
 * the client never gets to decide whether its own text was filtered.
 */
export async function postMessage(input: {
  text: string;
  name: string;
  persona: PersonaId;
}): Promise<PostResult> {
  const settings = await getModeration();
  const result = moderate(input.text, settings);

  const message: LoungeMessage = {
    id: `msg_${nanoid(8)}`,
    userId: "",
    name: input.name.slice(0, 24),
    persona: input.persona,
    text: result.masked.slice(0, 500),
    at: new Date().toISOString(),
    moderated: !result.clean,
    matched: result.matched.length ? result.matched : undefined,
  };

  const redis = getRedis();
  if (!redis) {
    memoryMessages.push(message);
    if (memoryMessages.length > MAX_MESSAGES) {
      memoryMessages = memoryMessages.slice(-MAX_MESSAGES);
    }
    return { message, moderated: message.moderated };
  }

  await redis.rpush(MESSAGES_KEY, JSON.stringify(message));
  await redis.ltrim(MESSAGES_KEY, -MAX_MESSAGES, -1);
  return { message, moderated: message.moderated };
}

export async function clearMessages(): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    memoryMessages = [];
    return;
  }
  await redis.del(MESSAGES_KEY);
}

export function usingMemoryLounge() {
  return !redisConfigured();
}
