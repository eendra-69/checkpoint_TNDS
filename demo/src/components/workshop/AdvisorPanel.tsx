"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; text: string };

/**
 * Free-text Q&A with the workshop's AI mechanic. Advisory only — the server
 * route exposes no tools, so this chat cannot mutate a claim or a case state.
 */
export function AdvisorPanel({
  locale,
  onClose,
}: {
  locale: "vi" | "en";
  onClose: () => void;
}) {
  const greeting =
    locale === "en"
      ? "Ask me about your car, TNDS coverage, or how to file a claim."
      : "Anh/chị hỏi em về xe, quyền lợi TNDS, hoặc cách khai báo bồi thường.";

  // Lazy init so the greeting is part of the first render rather than a
  // setState-in-effect. The parent mounts this with key={locale} so switching
  // language starts a fresh conversation.
  const [messages, setMessages] = useState<Msg[]>(() => [
    { role: "assistant", text: greeting },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy]);

  const send = useCallback(async () => {
    const question = input.trim();
    if (!question || busy) return;
    setInput("");
    setError(null);
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text: question }]);

    try {
      const res = await fetch("/api/workshop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = (await res.json()) as { text?: string };
        setMessages((m) => [
          ...m,
          { role: "assistant", text: data.text || "(no reply)" },
        ]);
      } else {
        // Streaming text response.
        const reader = res.body?.getReader();
        let acc = "";
        if (reader) {
          const decoder = new TextDecoder();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            acc += decoder.decode(value, { stream: true });
          }
        }
        setMessages((m) => [...m, { role: "assistant", text: acc.trim() || "(no reply)" }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }, [input, busy]);

  return (
    <div className="jrpg-window pointer-events-auto flex max-h-[70vh] w-full max-w-2xl flex-col p-4 text-white">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-pixel text-sm">
          {locale === "en" ? "AI Mechanic" : "Cơ sở sửa xe AI"}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 font-pixel text-xs text-white/70 hover:bg-white/10 hover:text-white"
        >
          Esc
        </button>
      </div>

      <div ref={scrollRef} className="min-h-40 flex-1 space-y-2 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
              m.role === "user"
                ? "ml-auto bg-tasco-lime-bright text-tasco-ink"
                : "bg-white/10 text-white/90",
            )}
          >
            {m.text}
          </div>
        ))}
        {busy && (
          <div className="text-sm text-white/60">
            {locale === "en" ? "Thinking…" : "Đang suy nghĩ…"}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 rounded-lg bg-destructive/20 px-2 py-1 text-xs text-red-200">
          {error}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder={locale === "en" ? "Ask about your car…" : "Hỏi về xe của anh/chị…"}
          className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-tasco-lime-bright focus:outline-none"
        />
        <button
          type="button"
          onClick={send}
          disabled={busy || !input.trim()}
          className="rounded-xl bg-tasco-lime-bright px-3 py-2 text-tasco-ink disabled:opacity-40"
          aria-label="Send"
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
