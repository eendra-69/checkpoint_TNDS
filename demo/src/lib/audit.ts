import { Redis } from "@upstash/redis";
import { nanoid } from "nanoid";
import type { AuditEvent, PersonaId } from "./types";

/**
 * Append-only audit ledger.
 *
 * This used to be `session.audit` — a mutable array inside the same blob as
 * everything else, trimmed with `length = 500`, which meant (a) anyone with
 * session access could rewrite history, and (b) the oldest events vanished
 * silently. For a demo whose pitch is a consent-and-audit ledger, that is the
 * weakest possible place to keep it.
 *
 * Now each event is RPUSHed to its own Redis list keyed by session, so entries
 * are only ever appended. Two counters sit alongside it so nothing disappears
 * without being counted and surfaced:
 *   `tasco:audit:<id>:dropped` — how many events fell off the retention window
 *   `tasco:audit:<id>:seq`    — monotonic counter, the event's sequence number
 *
 * Without Redis we fall back to a process-local array. Same limitations as the
 * session store: one instance only, and not tamper-evident — `/admin` shows a
 * badge so nobody mistakes the fallback for the real thing.
 */

const RETENTION = 5000;
const memoryLedger = new Map<string, AuditEvent[]>();

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

function ledgerKey(sessionId: string) {
  return `tasco:audit:${sessionId}`;
}
function droppedKey(sessionId: string) {
  return `tasco:audit:${sessionId}:dropped`;
}
function seqKey(sessionId: string) {
  return `tasco:audit:${sessionId}:seq`;
}

export type AuditInput = {
  persona: PersonaId;
  action: string;
  detail: string;
  customerId?: string;
  reason?: string;
};

export async function appendAudit(
  sessionId: string,
  input: AuditInput,
): Promise<AuditEvent> {
  const redis = getRedis();

  let seq = 1;
  if (redis) {
    seq = (await redis.incr(seqKey(sessionId))) ?? 1;
  } else {
    const existing = memoryLedger.get(sessionId) ?? [];
    seq = existing.length + 1;
  }

  const event: AuditEvent = {
    id: `audit_${nanoid(8)}`,
    seq,
    at: new Date().toISOString(),
    persona: input.persona,
    action: input.action,
    detail: input.detail,
    customerId: input.customerId,
    reason: input.reason,
  };

  if (!redis) {
    const bucket = memoryLedger.get(sessionId) ?? [];
    bucket.push(event);
    if (bucket.length > RETENTION) bucket.shift();
    memoryLedger.set(sessionId, bucket);
    return event;
  }

  await redis.rpush(ledgerKey(sessionId), JSON.stringify(event));

  // Trim from the front, and record how many went so the UI can say so out
  // loud instead of quietly losing them. After the trim the list holds exactly
  // RETENTION entries, so total - RETENTION is the cumulative dropped count.
  const total = (await redis.llen(ledgerKey(sessionId))) ?? 0;
  if (total > RETENTION) {
    const over = total - RETENTION;
    await redis.ltrim(ledgerKey(sessionId), over, -1);
    await redis.set(droppedKey(sessionId), over);
  }

  return event;
}

/** Newest first. */
export async function listAudit(
  sessionId: string,
  limit = 200,
): Promise<AuditEvent[]> {
  const redis = getRedis();
  if (!redis) {
    const bucket = memoryLedger.get(sessionId) ?? [];
    return bucket.slice(-limit).reverse();
  }
  try {
    const rows = await redis.lrange<AuditEvent>(ledgerKey(sessionId), -limit, -1);
    return (rows ?? []).filter(Boolean).reverse();
  } catch {
    return [];
  }
}

/** How many events aged out of the retention window for this session. */
export async function auditDropped(sessionId: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  try {
    return (await redis.get<number>(droppedKey(sessionId))) ?? 0;
  } catch {
    return 0;
  }
}

export async function totalAuditEvents(sessionId: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return (memoryLedger.get(sessionId) ?? []).length;
  try {
    return (await redis.llen(ledgerKey(sessionId))) ?? 0;
  } catch {
    return 0;
  }
}

/** Used by "reset demo" — a reset must not leave the old ledger readable. */
export async function clearAudit(sessionId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    memoryLedger.delete(sessionId);
    return;
  }
  await redis.del(ledgerKey(sessionId), droppedKey(sessionId), seqKey(sessionId));
}

export function usingMemoryAudit() {
  return !redisConfigured();
}
