"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

const SUGGESTIONS: Record<string, string[]> = {
  "/": [
    "What should I try first?",
    "Which persona is best for Demo Day?",
    "Summarise the renewal story",
  ],
  "/ops": [
    "Why is Minh scored high?",
    "How does consent filtering work?",
    "What happens when I run a campaign?",
  ],
  "/agent": [
    "Summarise my queue",
    "Which case is most urgent?",
    "How do I send a renewal link?",
  ],
  "/compliance": [
    "Show recent PII reveals",
    "Who opted out of calls?",
    "What is audited?",
  ],
  "/metrics": [
    "Explain the uplift assumption",
    "What is cost per renewal?",
    "How is the funnel counted?",
  ],
  "/admin": [
    "Can I use Ollama here?",
    "How do permission overrides work?",
    "Where do API keys live?",
  ],
  "/admin/workflow": [
    "What if a customer doesn't respond?",
    "Who can see national ID?",
    "Explain the issued state",
  ],
};

export function FloatingAssistant({
  enabled,
  badgeCount = 0,
}: {
  enabled: boolean;
  badgeCount?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const suggestions = useMemo(() => {
    const key = Object.keys(SUGGESTIONS).find(
      (k) => pathname === k || pathname.startsWith(`${k}/`),
    );
    return SUGGESTIONS[key || "/"] || SUGGESTIONS["/"];
  }, [pathname]);

  if (!enabled) return null;
  if (pathname.startsWith("/chat") || pathname.startsWith("/call") || pathname.startsWith("/vetc")) {
    return null;
  }

  async function ask(text: string) {
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);
    setInput("");
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, pathname }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.text || data.error || "No reply" },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Assistant unavailable — try again." },
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
            <div className="text-sm font-semibold">Tasco assistant</div>
            <div className="text-[11px] text-white/70">
              Context: {pathname} · RBAC-scoped
            </div>
          </div>
          <div className="flex flex-wrap gap-1 border-b p-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="rounded-full bg-tasco-mist px-2 py-1 text-[10px] font-medium text-tasco-forest"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
            {messages.length === 0 && (
              <p className="text-muted-foreground">
                Ask about this page. I never see more than your persona allows.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-6 rounded-xl bg-primary px-3 py-2 text-primary-foreground"
                    : "mr-4 rounded-xl bg-tasco-mist px-3 py-2 text-tasco-ink"
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
              placeholder="Ask…"
            />
            <Button type="submit" size="sm" disabled={busy}>
              Send
            </Button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-tasco-ink text-sm font-bold text-white shadow-xl hover:bg-primary"
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