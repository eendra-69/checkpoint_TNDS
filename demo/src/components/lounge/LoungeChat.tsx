"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LoungeMessage, PersonaId } from "@/lib/types";

/** Shared lounge feed — everyone signed in reads the same list. */
const POLL_MS = 3_000;

export type LoungeChatCopy = {
  title: string;
  close: string;
  empty: string;
  placeholder: string;
  send: string;
  sending: string;
  waitingId: string;
  moderated: string;
  loadFailed: string;
  errUnauthorized: string;
  errForbidden: string;
  errRateLimited: string;
  errGeneric: string;
};

export function LoungeChat({
  selfId,
  displayName,
  persona,
  copy,
  onClose,
}: {
  /** Presence id from `usePresence`; the API stores messages against it. */
  selfId: string;
  displayName: string;
  persona: PersonaId;
  copy: LoungeChatCopy;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<LoungeMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const cancelled = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/lounge", { cache: "no-store" });
      if (!res.ok) {
        if (!cancelled.current) setFeedError(copy.loadFailed);
        return;
      }
      const data = (await res.json()) as { messages?: LoungeMessage[] };
      if (!cancelled.current) {
        setMessages(data.messages ?? []);
        setFeedError(null);
      }
    } catch {
      // Offline is fine; the next tick retries.
    }
  }, [copy.loadFailed]);

  useEffect(() => {
    cancelled.current = false;
    // Kick the first load off a macrotask rather than calling load() straight
    // from the effect body — keeps it clearly asynchronous (no setState during
    // the effect) and lets the cleanup below cancel it before it lands.
    const kick = window.setTimeout(load, 0);
    const timer = window.setInterval(load, POLL_MS);
    return () => {
      cancelled.current = true;
      window.clearTimeout(kick);
      window.clearInterval(timer);
    };
  }, [load]);

  // The feed arrives newest-first, so "show me the newest" means the top of the
  // list. Keyed on the head id so a poll that changed nothing keeps scroll.
  const newestId = messages[0]?.id;
  useEffect(() => {
    if (!newestId) return;
    const el = listRef.current;
    if (el) el.scrollTop = 0;
  }, [newestId]);

  async function send() {
    const body = text.trim();
    // The API ties messages to the presence id; wait for `usePresence` to mint
    // one rather than posting something the server would reject as too short.
    if (!body || !selfId || sending) return;

    setSending(true);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch("/api/lounge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: body, userId: selfId }),
      });

      if (res.status === 401) return setError(copy.errUnauthorized);
      if (res.status === 403) return setError(copy.errForbidden);
      if (res.status === 429) return setError(copy.errRateLimited);

      const data = (await res.json().catch(() => null)) as
        | { message?: LoungeMessage; moderated?: boolean; error?: string }
        | null;
      const message = data?.message;
      if (!res.ok || !message) {
        setError(data?.error || copy.errGeneric);
        return;
      }

      setText("");
      setNotice(data.moderated ? copy.moderated : null);
      // Moderation already ran server-side. Render exactly what came back —
      // masking again here would double-star the text.
      setMessages((prev) => [message, ...prev.filter((m) => m.id !== message.id)]);
    } catch {
      setError(copy.errGeneric);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="jrpg-window pointer-events-auto flex max-h-[80vh] w-full flex-col gap-3 p-3 sm:p-4">
      <header className="flex items-start justify-between gap-3 border-b border-white/15 pb-2">
        <div className="min-w-0">
          <div className="font-pixel text-sm text-white">{copy.title}</div>
          <div className="mt-0.5 flex items-center gap-2">
            <span
              className={`persona-${persona} h-2.5 w-2.5 shrink-0 rounded-full`}
              style={{ background: "var(--persona)" }}
            />
            <span className="truncate text-xs text-white/70">{displayName}</span>
          </div>
        </div>
        <button
          type="button"
          className="jrpg-window shrink-0 px-2.5 py-1 font-pixel text-[11px] text-white"
          onClick={onClose}
        >
          {copy.close}
        </button>
      </header>

      {notice && (
        <p className="rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
          {notice}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-xs text-red-100">
          {error}
        </p>
      )}

      <div
        ref={listRef}
        className="flex min-h-[35vh] flex-1 flex-col gap-2 overflow-y-auto pr-1"
      >
        {messages.length === 0 &&
          (feedError ? (
            <p className="m-auto px-4 py-6 text-center text-sm text-red-100">{feedError}</p>
          ) : (
            <p className="m-auto px-4 py-6 text-center text-sm text-white/60">{copy.empty}</p>
          ))}
        {messages.map((m) => {
          // Only messages we posted echo a userId back; the shared feed does
          // not, so anything else stays visually neutral rather than guessed.
          const mine = Boolean(selfId) && m.userId === selfId;
          return (
            <article
              key={m.id}
              data-moderated={m.moderated ? "true" : undefined}
              className={`lounge-bubble w-fit max-w-[88%] px-3 py-2 ${
                mine ? "ml-auto" : "mr-auto"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`persona-${m.persona} h-2 w-2 shrink-0 rounded-full`}
                  style={{ background: "var(--persona)" }}
                />
                <span className="text-xs font-semibold text-tasco-ink">{m.name}</span>
                <time className="text-[10px] text-muted-foreground">
                  {new Date(m.at).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
                {m.text}
              </p>
            </article>
          );
        })}
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          value={text}
          maxLength={500}
          disabled={!selfId || sending}
          onChange={(e) => setText(e.target.value)}
          placeholder={selfId ? copy.placeholder : copy.waitingId}
          className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-tasco-lime-bright focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!selfId || sending || !text.trim()}
          className="shrink-0 rounded-lg bg-tasco-lime-bright px-3 py-2 font-pixel text-xs text-tasco-ink disabled:opacity-50"
        >
          {sending ? copy.sending : copy.send}
        </button>
      </form>
    </div>
  );
}
