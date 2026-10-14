import { Redis } from "@upstash/redis";

/**
 * Per-session rate limit for LLM-backed endpoints.
 *
 * `@upstash/ratelimit` has been a dependency since the demo was scaffolded but
 * was never wired up, which left /api/chat as an open, unmetered proxy onto a
 * real model with tool access. On Vercel without Redis we fall back to a
 * process-local map, which is best-effort: serverless instances are not shared,
 * so this only meaningfully limits traffic on a single long-lived instance.
 */

const CHAT_LIMIT = 20; // messages
const CHAT_WINDOW_SECONDS = 60;

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();
const memory = {
  get(key: string): Bucket | null {
    const b = memoryBuckets.get(key);
    if (!b) return null;
    if (Date.now() > b.resetAt) {
      memoryBuckets.delete(key);
      return null;
    }
    return b;
  },
  set(key: string, bucket: Bucket) {
    // Cheap bound so a long demo session cannot grow the map without limit.
    if (memoryBuckets.size > 5000) {
      const cutoff = Date.now();
      for (const [k, v] of memoryBuckets) {
        if (v.resetAt < cutoff) memoryBuckets.delete(k);
      }
    }
    memoryBuckets.set(key, bucket);
  },
  incr(key: string, windowSeconds: number): { count: number; reset: number } {
    const now = Date.now();
    const existing = memory.get(key);
    if (!existing) {
      const bucket = { count: 1, resetAt: now + windowSeconds * 1000 };
      memory.set(key, bucket);
      return { count: 1, reset: Math.ceil(bucket.resetAt / 1000) };
    }
    existing.count += 1;
    memory.set(key, existing);
    return { count: existing.count, reset: Math.ceil(existing.resetAt / 1000) };
  },
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

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfter: number;
};

/**
 * Consume one unit of quota for `key`. Returns whether the caller may proceed.
 */
export async function consume(
  key: string,
  limit = CHAT_LIMIT,
  windowSeconds = CHAT_WINDOW_SECONDS,
): Promise<RateLimitResult> {
  const redis = getRedis();

  if (!redis) {
    const { count, reset } = memory.incr(key, windowSeconds);
    return {
      ok: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfter: Math.max(1, reset - Math.floor(Date.now() / 1000)),
    };
  }

  const window = Math.floor(Date.now() / 1000 / windowSeconds);
  const bucketKey = `tasco:rl:${key}:${window}`;
  const count = await redis.incr(bucketKey);
  if (count === 1) {
    await redis.expire(bucketKey, windowSeconds + 1);
  }
  const reset = (window + 1) * windowSeconds;
  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfter: Math.max(1, reset - Math.floor(Date.now() / 1000)),
  };
}

export function checkChatRateLimit(sessionId: string): Promise<RateLimitResult> {
  return consume(`chat:${sessionId}`);
}
