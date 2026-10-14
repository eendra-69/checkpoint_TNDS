import { nanoid } from "nanoid";
import { createSeedSession } from "./data/seed";
import { clearAudit, appendAudit } from "./audit";
import { withSessionLock } from "./session-lock";
import type { DemoSession } from "./types";

const memory = new Map<string, DemoSession>();

function redisConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

async function getRedis() {
  if (!redisConfigured()) return null;
  const { Redis } = await import("@upstash/redis");
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

function key(sessionId: string) {
  return `tasco:session:${sessionId}`;
}

function normalizeSession(data: DemoSession): DemoSession {
  // Backfill fields added after a session was first written. Without this a
  // session persisted by an older deploy throws on first access to
  // `session.checkouts`.
  if (!Array.isArray(data.claims)) data.claims = [];
  if (!Array.isArray(data.checkouts)) data.checkouts = [];
  // `audit` moved out to an append-only ledger; drop the stale copy so the
  // compliance page can never render a mutable one.
  delete (data as { audit?: unknown }).audit;
  return data;
}

export async function getSession(sessionId: string): Promise<DemoSession | null> {
  const redis = await getRedis();
  if (redis) {
    const data = await redis.get<DemoSession>(key(sessionId));
    return data ? normalizeSession(data) : null;
  }
  const mem = memory.get(sessionId);
  return mem ? normalizeSession(mem) : null;
}

export async function saveSession(session: DemoSession): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    await redis.set(key(session.id), session, { ex: 60 * 60 * 24 * 7 });
    return;
  }
  memory.set(session.id, session);
}

export async function getOrCreateSession(sessionId?: string): Promise<DemoSession> {
  if (sessionId) {
    const existing = await getSession(sessionId);
    if (existing) return existing;
  }
  const id = sessionId || nanoid(16);
  const seeded = createSeedSession(id);
  await saveSession(seeded);
  // Recorded into the append-only ledger rather than baked into the seed blob,
  // so the very first event is in the same tamper-resistant place as the rest.
  await appendAudit(id, {
    persona: "admin",
    action: "session.seeded",
    detail: `Seeded ${seeded.customers.length} synthetic car owners`,
  });
  return seeded;
}

export async function resetSession(sessionId: string): Promise<DemoSession> {
  const seeded = createSeedSession(sessionId);
  await saveSession(seeded);
  // A demo reset must not leave the previous run's ledger readable.
  await clearAudit(sessionId);
  return seeded;
}

export class MissingSessionError extends Error {
  constructor(sessionId: string) {
    super(
      `Session ${sessionId} no longer exists (expired or reset mid-request). ` +
        `Refusing to fabricate a fresh session over it — sign in again to start a new demo.`,
    );
    this.name = "MissingSessionError";
  }
}

export async function updateSession(
  sessionId: string,
  updater: (
    session: DemoSession,
  ) => DemoSession | void | Promise<DemoSession | void>,
): Promise<DemoSession> {
  return withSessionLock(sessionId, async () => {
    // Deliberately NOT getOrCreateSession here. If the key is gone (TTL
    // expiry, a reset landing mid-request) re-seeding would silently discard
    // the caller's real state and apply their mutation to fresh seed data.
    // Reads stay forgiving via getOrCreateSession; writes must not fabricate.
    const session = await getSession(sessionId);
    if (!session) throw new MissingSessionError(sessionId);

    // Updaters may be async so they can record audit events, which now live in
    // their own append-only store rather than on the session object.
    const next = (await updater(session)) ?? session;
    await saveSession(next);
    return next;
  });
}

export function usingMemoryStore() {
  return !redisConfigured();
}