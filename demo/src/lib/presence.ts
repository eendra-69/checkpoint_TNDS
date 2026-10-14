import { Redis } from "@upstash/redis";
import type { Facing, PersonaId, PresenceUser, WorldSceneId } from "./types";

/**
 * Multiplayer-style presence for the three 3D scenes.
 *
 * Presence is deliberately *global* rather than per-session: the demo wants
 * "other users" to appear when a judge opens a second browser tab (or a
 * teammate opens the link), not only within one signed-in session.
 *
 * Storage is a Redis hash per scene with a whole-key TTL. Each record carries
 * its own `at` timestamp and readers drop anything older than PRESENCE_TTL_MS,
 * so a client that hard-closes its tab fades out within ~15s without needing
 * an explicit leave. Without Redis we fall back to a process-local Map, which
 * only spans one serverless instance — good enough for a single-machine demo,
 * documented as such.
 */

export const PRESENCE_TTL_MS = 15_000;
const SCENE_KEY_TTL_SECONDS = 120;
const MAX_USERS_PER_SCENE = 50;

export const SCENES: WorldSceneId[] = ["office", "workshop", "lounge"];

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

type SceneBucket = Map<string, PresenceUser>;
const memory: Record<string, SceneBucket> = {
  office: new Map(),
  workshop: new Map(),
  lounge: new Map(),
};

function bucket(scene: WorldSceneId): SceneBucket {
  return memory[scene] ?? (memory[scene] = new Map());
}

export function presenceKey(scene: WorldSceneId) {
  return `tasco:presence:${scene}`;
}

export type PresenceInput = {
  userId: string;
  name: string;
  persona: PersonaId;
  scene: WorldSceneId;
  x: number;
  z: number;
  facing: Facing;
};

/** Record a heartbeat for one user. Returns the stored record. */
export async function heartbeat(input: PresenceInput): Promise<PresenceUser> {
  const user: PresenceUser = {
    id: input.userId,
    name: input.name,
    persona: input.persona,
    scene: input.scene,
    x: Number.isFinite(input.x) ? input.x : 0,
    z: Number.isFinite(input.z) ? input.z : 0,
    facing: input.facing,
    at: Date.now(),
  };

  const redis = getRedis();
  if (!redis) {
    bucket(input.scene).set(user.id, user);
    return user;
  }

  const key = presenceKey(input.scene);
  await redis.hset(key, { [user.id]: JSON.stringify(user) });
  await redis.expire(key, SCENE_KEY_TTL_SECONDS);
  return user;
}

/** Remove a user from a scene (used when they navigate away). */
export async function leave(scene: WorldSceneId, userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    bucket(scene).delete(userId);
    return;
  }
  try {
    await redis.hdel(presenceKey(scene), userId);
  } catch {
    // A failed leave is harmless — the TTL sweep removes it anyway.
  }
}

/** Everyone currently present in a scene, excluding callers older than the TTL. */
export async function listPresence(
  scene: WorldSceneId,
): Promise<PresenceUser[]> {
  const cutoff = Date.now() - PRESENCE_TTL_MS;
  const redis = getRedis();

  let entries: PresenceUser[];

  if (!redis) {
    const b = bucket(scene);
    for (const [id, u] of b) if (u.at < cutoff) b.delete(id);
    entries = [...b.values()];
  } else {
    try {
      const raw = (await redis.hgetall<Record<string, string>>(
        presenceKey(scene),
      )) as Record<string, string> | null;
      entries = [];
      for (const value of Object.values(raw ?? {})) {
        try {
          entries.push(
            typeof value === "string" ? JSON.parse(value) : (value as PresenceUser),
          );
        } catch {
          // Skip unparseable rows rather than failing the whole listing.
        }
      }
    } catch {
      entries = [];
    }
  }

  return entries
    .filter((u) => u && typeof u.at === "number" && u.at >= cutoff)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, MAX_USERS_PER_SCENE);
}

/** How many users are in a scene right now (including expired-but-unswept). */
export async function presenceCount(scene: WorldSceneId): Promise<number> {
  return (await listPresence(scene)).length;
}

export function usingMemoryPresence() {
  return !redisConfigured();
}
