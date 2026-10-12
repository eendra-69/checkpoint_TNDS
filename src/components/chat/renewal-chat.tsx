"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatVnd } from "@/lib/utils";

type Msg = { id: string; role: "assistant" | "user"; content: string };

export function RenewalChat({
  customerId,
  customerName,
  plate,
  expiresAt,
  premiumVnd,
  incomplete,
  initialCertificateId,
}: {
  customerId: string;
  customerName: string;
  plate: string;
  expiresAt: string;
  premiumVnd: number;
  incomplete: boolean;
  initialCertificateId?: string;
}) {
  const [lang, setLang] = useState<"vi" | "en">("vi");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [certificateId, setCertificateId] = useState(initialCertificateId);
  const opener = useMemo(
    () =>
      lang === "vi"
        ? `Xin chào ${customerName},\n\nTNDS xe biển ${plate} sẽ hết hạn vào ${expiresAt.slice(0, 10)}. Phí quy định: ${formatVnd(premiumVnd)} (không giảm giá).\n\nĐây là tin nhắn ZNS mô phỏng. Em có thể giúp xác nhận xe và gia hạn ngay trong chat.`
        : `Hi ${customerName},\n\nTNDS for ${plate} expires on ${expiresAt.slice(0, 10)}. Regulated premium: ${formatVnd(premiumVnd)} (no discount).\n\nThis is a simulated Zalo ZNS. I can help confirm your vehicle and renew in chat.`,
    [lang, customerName, plate, expiresAt, premiumVnd],
  );

  const [messages, setMessages] = useState<Msg[]>([
    { id: "zns", role: "assistant", content: opener },
  ]);

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
      if (data.demo && data.text) {
        setMessages((m) => [
          ...m,
          { id: data.id || crypto.randomUUID(), role: "assistant", content: data.text },
        ]);
        if (String(data.text).includes("/verify/")) {
          const match = String(data.text).match(/\/verify\/(CERT-[A-Z0-9]+)/);
          if (match) setCertificateId(match[1]);
        }
        if (
          text.toLowerCase().includes("thanh toán") ||
          text.toLowerCase().includes("pay")
        ) {
          setShowPay(false);
        }
      } else if (data.error) {
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Error: ${data.error}`,
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              lang === "vi"
                ? "Em đã nhận tin. (Chế độ LLM streaming — thử lại hoặc dùng từ khoá: xác nhận / thanh toán / nhân viên)"
                : "Got it. (LLM stream mode — try keywords: confirm / pay / human)",
          },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Network error — please try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[380px_1fr]">
      <div className="mx-auto w-full max-w-[380px]">
        <div className="relative overflow-hidden rounded-[2.2rem] border-[10px] border-tasco-deep bg-tasco-deep shadow-[0_25px_60px_rgba(0,16,62,0.35)]">
          <div className="absolute left-1/2 top-2 z-10 h-5 w-28 -translate-x-1/2 rounded-full bg-black/40" />
          <div className="bg-zalo-blue px-4 pb-3 pt-7 text-white">
            <div className="mb-2 flex items-center justify-between text-[10px] opacity-80">
              <span>9:41</span>
              <span>Zalo · DEMO</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 font-display text-sm font-bold">
                T
              </div>
              <div>
                <div className="text-sm font-semibold">Tasco Bảo hiểm</div>
                <div className="text-[11px] text-white/80">Official Account · ZNS</div>
              </div>
            </div>
          </div>
          <div className="flex h-[540px] flex-col bg-[#ebeff5]">
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              <div className="rounded-xl border border-dashed border-tasco-sky/40 bg-white/80 p-2 text-[11px] text-muted-foreground">
                Assumption: Zalo ZNS template + OA chat
              </div>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={
                    m.role === "user"
                      ? "ml-8 rounded-2xl rounded-br-md bg-zalo-blue px-3 py-2 text-sm text-white shadow-sm"
                      : "mr-8 rounded-2xl rounded-bl-md bg-white px-3 py-2 text-sm text-tasco-deep shadow-sm"
                  }
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              ))}
            </div>
            <div className="border-t bg-white p-2">
              <div className="mb-2 flex gap-1 overflow-x-auto">
                {(lang === "vi"
                  ? ["xác nhận", "cover", "thanh toán", "nhân viên"]
                  : ["confirm", "cover", "pay", "human"]
                ).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="shrink-0 rounded-full bg-tasco-pale px-2.5 py-1 text-[11px] font-medium text-tasco-navy"
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
                  placeholder={lang === "vi" ? "Nhập tin nhắn…" : "Type a message…"}
                  className="h-10 flex-1 rounded-full border border-border bg-muted/40 px-3 text-sm outline-none focus:ring-2 focus:ring-zalo-blue"
                />
                <Button type="submit" size="sm" disabled={busy}>
                  Send
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="sky">Classic chat</Badge>
            <Badge>{incomplete ? "Needs confirmation" : "Profile OK"}</Badge>
            <button
              type="button"
              onClick={() => setLang((l) => (l === "vi" ? "en" : "vi"))}
              className="ml-auto text-xs font-semibold text-tasco-sky"
            >
              Lang: {lang.toUpperCase()}
            </button>
          </div>
          <h2 className="mt-3 font-display text-lg font-semibold text-tasco-deep">
            {customerName} · {plate}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Regulated premium {formatVnd(premiumVnd)}. Expires {expiresAt.slice(0, 10)}.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowPay(true)}>
              Open mock checkout
            </Button>
            <Link href={`/vetc/${customerId}`}>
              <Button type="button" variant="outline">
                VETC App entry
              </Button>
            </Link>
            <Link href="/office">
              <Button type="button" variant="outline">
                Virtual Office
              </Button>
            </Link>
            {certificateId && (
              <Link href={`/verify/${certificateId}`}>
                <Button type="button" variant="success">
                  View certificate
                </Button>
              </Link>
            )}
          </div>
        </div>

        {showPay && (
          <div className="rounded-2xl border border-vetc-green/30 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-tasco-deep">Mock VietQR / MoMo</h3>
              <Badge tone="green">Assumption: payment gateway</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Amount locked to regulated premium — no discount field.
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-28 w-28 items-center justify-center rounded-xl border-2 border-dashed border-tasco-navy/30 bg-tasco-pale font-mono text-xs">
                VietQR
              </div>
              <div>
                <div className="text-2xl font-semibold tabular-nums text-tasco-deep">
                  {formatVnd(premiumVnd)}
                </div>
                <p className="text-sm text-muted-foreground">TNDS · {plate}</p>
                <Button
                  className="mt-3"
                  onClick={() => {
                    setShowPay(false);
                    send(lang === "vi" ? "thanh toán" : "pay now");
                  }}
                >
                  Simulate payment
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
