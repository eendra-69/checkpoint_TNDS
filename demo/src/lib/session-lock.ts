/**
 * Per-key serialisation for read-modify-write cycles.
 *
 * `updateSession` reads the whole session blob, lets a caller mutate it, then
 * writes the whole blob back. Two overlapping server actions (chat + claim +
 * outcome landing together) both read the same state and the second write
 * silently discards the first one's work — lost claims, double-counted funnels.
 *
 * Chaining operations per key applies them in order instead.
 *
 * Scope, stated honestly: this coordinates within a single process. On Vercel,
 * each serverless instance has its own module registry, so concurrent requests
 * landing on different instances are NOT serialised. Closing that gap needs a
 * distributed lock (Redis SET NX + token release), which adds a network round
 * trip and its own failure modes. For a demo running on one machine this is the
 * right trade; see docs/DEPLOY.md.
 *
 * Deliberately dependency-free so it can be unit-tested without the app.
 */

export class SessionBusyError extends Error {
  constructor(timeoutMs: number) {
    super(
      `Timed out after ${timeoutMs}ms waiting for the session lock. ` +
        `Another write is still in flight — retry.`,
    );
    this.name = "SessionBusyError";
  }
}

const chains = new Map<string, Promise<unknown>>();
const DEFAULT_TIMEOUT_MS = 10_000;

export async function withSessionLock<T>(
  key: string,
  fn: () => Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const prev = chains.get(key) ?? Promise.resolve();
  // Run whether or not the previous holder succeeded, so one failure can't
  // wedge the queue for every later write.
  const result = prev.then(fn, fn);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const guard = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new SessionBusyError(timeoutMs)), timeoutMs);
  });

  const tail = result.then(
    () => {
      if (chains.get(key) === tail) chains.delete(key);
    },
    () => {
      if (chains.get(key) === tail) chains.delete(key);
    },
  );
  chains.set(key, tail);

  try {
    return await Promise.race([result, guard]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Number of keys with in-flight work. Exposed for tests and diagnostics. */
export function pendingLockCount(): number {
  return chains.size;
}
