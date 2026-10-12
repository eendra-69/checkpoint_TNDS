import { nanoid } from "nanoid";
import { createSeedSession } from "./data/seed";
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
  if (!Array.isArray(data.claims)) data.claims = [];
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
  return seeded;
}

export async function resetSession(sessionId: string): Promise<DemoSession> {
  const seeded = createSeedSession(sessionId);
  await saveSession(seeded);
  return seeded;
}

export async function updateSession(
  sessionId: string,
  updater: (session: DemoSession) => DemoSession | void,
): Promise<DemoSession> {
  const session = await getOrCreateSession(sessionId);
  const next = updater(session) ?? session;
  await saveSession(next);
  return next;
}

export function usingMemoryStore() {
  return !redisConfigured();
}