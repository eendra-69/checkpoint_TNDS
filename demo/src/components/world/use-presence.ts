"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Facing, PresenceUser, WorldSceneId } from "@/lib/types";
import { PRESENCE_TTL_MS } from "@/lib/presence";

const BEAT_MS = 2_000;
const POLL_MS = 2_000;

/**
 * Stable per-tab id. sessionStorage (not localStorage) so two tabs of the same
 * browser show up as two distinct people, which is exactly what you want when
 * demoing "other users" to a judge.
 */
function tabId() {
  if (typeof window === "undefined") return "server";
  const KEY = "tasco_presence_tab";
  let id = window.sessionStorage.getItem(KEY);
  if (!id) {
    id = `u_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    window.sessionStorage.setItem(KEY, id);
  }
  return id;
}

export function usePresence(scene: WorldSceneId, enabled = true) {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  // Lazy init rather than setState-in-effect: the id is never rendered, so a
  // server/client split here cannot cause a hydration mismatch, and the
  // effects that depend on it only ever run in the browser.
  const [selfId] = useState(() => tabId());
  const [connected, setConnected] = useState(false);
  const posRef = useRef<{ x: number; z: number; facing: Facing }>({
    x: 0,
    z: 0,
    facing: "down",
  });

  /** Called every frame from the player; the hook throttles actual sends. */
  const update = useCallback((x: number, z: number, facing: Facing) => {
    posRef.current = { x, z, facing };
  }, []);

  useEffect(() => {
    if (!enabled || !selfId) return;
    let cancelled = false;

    async function beat() {
      try {
        const { x, z, facing } = posRef.current;
        const res = await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: selfId, scene, x, z, facing }),
        });
        if (!cancelled && res.ok) setConnected(true);
      } catch {
        if (!cancelled) setConnected(false);
      }
    }

    async function poll() {
      try {
        const res = await fetch(`/api/presence?scene=${scene}`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { users?: PresenceUser[] };
        if (!cancelled) setUsers(data.users ?? []);
      } catch {
        // Offline is fine; the next tick retries.
      }
    }

    beat();
    poll();
    const beatTimer = window.setInterval(beat, BEAT_MS);
    const pollTimer = window.setInterval(poll, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(beatTimer);
      window.clearInterval(pollTimer);
      // No explicit "leave" here: sendBeacon can only POST, so it would post a
      // heartbeat-shaped body that fails validation and quietly do nothing.
      // Presence records instead expire on their own after PRESENCE_TTL_MS.
    };
  }, [scene, enabled, selfId]);

  const others = users.filter((u) => u.id !== selfId);

  return { users, others, selfId, update, connected, ttlMs: PRESENCE_TTL_MS };
}
