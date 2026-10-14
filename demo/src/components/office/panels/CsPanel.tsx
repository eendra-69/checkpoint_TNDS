"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/locale";

type Msg = { id: string; role: "assistant" | "user"; content: string };

export function CsPanel({
  customerId,
  customerName,
  onClose,
  locale = "vi",
}: {
  customerId: string;
  customerName: string;
  onClose: () => void;
  locale?: Locale;
}) {
  const opener = useMemo(
    () =>
      locale === "en"
        ? `Hi ${customerName}!\n\nI'm Tasco's virtual CS at the Virtual Office. I can help renew TNDS, explain coverage, or connect you to a human agent.`
        : `Xin chào ${customerName}!\n\nEm là CS ảo của Tasco tại Virtual Office. Em có thể giúp gia hạn TNDS, giải thích quyền lợi, hoặc kết nối nhân viên.`,
    [customerName, locale],
  );
  const chips =
    locale === "en"
      ? ["renew", "TNDS coverage", "talk to human"]
      : ["gia hạn", "quyền lợi TNDS", "gặp nhân viên"];
  const [messages, setMessages] = useState<Msg[]>([
    { id: "open", role: "assistant", content: opener },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          messages: next.map((m) => ({
            id: m.id,
            role: m.role,
            parts: [{ type: "text", text: m.content }],
          })),
        }),
      });
      const data = await res.json();
      const reply =
        data.demo && data.text
          ? data.text
          : data.error
            ? locale === "en"
              ? `Error: ${data.error}`
              : `Lỗi: ${data.error}`
            : locale === "en"
              ? "Got it. Try: renew / coverage / human."
              : "Em đã nhận tin. Thử: gia hạn / quyền lợi / nhân viên.";
      setMessages((m) => [
        ...m,
        { id: data.id || crypto.randomUUID(), role: "assistant", content: reply },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            locale === "en"
              ? "Connection lost — please try again."
              : "Mất kết nối — thử lại giúp em.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="jrpg-window pointer-events-auto flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/15 px-4 py-3">
        <div>
          <div className="font-pixel text-sm tracking-wide text-tasco-lime">
            {locale === "en" ? "Tasco CS Desk" : "Bàn CS Tasco"}
          </div>
          <div className="text-[11px] text-white/70">AI CS · Virtual Office</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-sm text-white/80 hover:bg-white/10"
        >
          Esc
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-8 rounded-xl bg-tasco-lime/30 px-3 py-2 text-sm text-white"
                : "mr-8 rounded-xl border border-white/20 bg-black/25 px-3 py-2 text-sm text-white"
            }
          >
            <div className="whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/15 p-3">
        <div className="mb-2 flex flex-wrap gap-1">
          {chips.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white"
            >
              {q}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={locale === "en" ? "Ask CS…" : "Hỏi CS…"}
            className="h-10 flex-1 rounded-xl border border-white/20 bg-black/30 px-3 text-sm text-white outline-none focus:ring-2 focus:ring-tasco-lime"
          />
          <Button type="submit" disabled={busy}>
            {locale === "en" ? "Send" : "Gửi"}
          </Button>
        </form>
      </div>
    </div>
  );
}
