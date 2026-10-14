"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/locale";
import { format } from "@/lib/i18n/t";
import { suggestionsFor, type AssistantTopic } from "@/lib/assistant-topics";

export function FloatingAssistant({
  enabled,
  badgeCount = 0,
  guest = false,
  locale = "vi",
  labels,
}: {
  enabled: boolean;
  badgeCount?: number;
  /** Signed out: the API only answers the "where to start" topic, so always offer home chips. */
  guest?: boolean;
  locale?: Locale;
  labels: {
    title: string;
    context: string;
    empty: string;
    placeholder: string;
    send: string;
    noReply: string;
    unavailable: string;
  };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const suggestions = useMemo(
    () => suggestionsFor(guest ? "/" : pathname, locale),
    [guest, pathname, locale],
  );

  if (!enabled) return null;
  if (pathname.startsWith("/chat") || pathname.startsWith("/call") || pathname.startsWith("/vetc")) {
    return null;
  }

  async function ask(text: string, topic?: AssistantTopic) {
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);
    setInput("");
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, pathname, topic }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.text || data.error || labels.noReply },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: labels.unavailable },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[420px] w-[340px] flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl">
          <div className="hero-gradient px-4 py-3 text-white">
            <div className="text-sm font-semibold">{labels.title}</div>
            <div className="text-[11px] text-white/70">
              {format(labels.context, { path: pathname })}
            </div>
          </div>
          <div className="flex flex-wrap gap-1 border-b p-2">
            {suggestions.map((s) => (
              <button
                key={s.text}
                type="button"
                onClick={() => ask(s.text, s.topic)}
                className="rounded-full bg-tasco-pale px-2 py-1 text-[10px] font-medium text-tasco-navy"
              >
                {s.text}
              </button>
            ))}
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
            {messages.length === 0 && (
              <p className="text-muted-foreground">
                {labels.empty}
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-6 rounded-xl bg-primary px-3 py-2 text-primary-foreground"
                    : "mr-4 rounded-xl bg-tasco-pale px-3 py-2 text-tasco-deep"
                }
              >
                {m.text}
              </div>
            ))}
          </div>
          <form
            className="flex gap-2 border-t p-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) void ask(input.trim());
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-9 flex-1 rounded-lg border px-2 text-sm"
              placeholder={labels.placeholder}
            />
            <Button type="submit" size="sm" disabled={busy}>
              {labels.send}
            </Button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-tasco-deep text-sm font-bold text-white shadow-xl hover:bg-primary"
      >
        AI
        {badgeCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px]">
            {badgeCount}
          </span>
        )}
      </button>
    </div>
  );
}