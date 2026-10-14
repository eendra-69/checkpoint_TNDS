"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatText, plainChatText } from "@/components/chat/chat-text";
import type { Locale } from "@/lib/i18n/locale";
import { format } from "@/lib/i18n/t";
import { formatDate } from "@/lib/utils";
import { ChatRequestError, sendRenewalChat } from "@/lib/agent/chat-client";

export type VoiceLabels = {
  engine: string;
  noConsent: string;
  idle: string;
  bot: string;
  user: string;
  start: string;
  speak: string;
  listening: string;
  askHuman: string;
  askHumanUtterance: string;
  typedPlaceholder: string;
  send: string;
  noRecognition: string;
  fallbackReply: string;
  errorPrefix: string;
  opening: string;
};

type Line = { role: "bot" | "user"; text: string };

// Minimal typings for Web Speech (not in all TS libs)
type SpeechRec = {
  lang: string;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
};

export function VoiceCall({
  customerId,
  customerName,
  plate,
  expiresAt,
  hasCallConsent,
  engine,
  locale = "vi",
  labels,
}: {
  customerId: string;
  customerName: string;
  plate: string;
  expiresAt: string;
  hasCallConsent: boolean;
  engine: "elevenlabs" | "webspeech";
  locale?: Locale;
  labels: VoiceLabels;
}) {
  const speechLang = locale === "en" ? "en-US" : "vi-VN";
  const [lines, setLines] = useState<Line[]>([]);
  const [listening, setListening] = useState(false);
  const [typed, setTyped] = useState("");
  const recognitionRef = useRef<SpeechRec | null>(null);

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(plainChatText(text).slice(0, 220));
    u.lang = speechLang;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  async function botTurn(userText: string) {
    setLines((l) => [...l, { role: "user", text: userText }, { role: "bot", text: "" }]);
    const setBotLine = (text: string) =>
      setLines((l) => [...l.slice(0, -1), { role: "bot", text }]);
    let reply: string;
    try {
      const res = await sendRenewalChat({
        customerId,
        channel: "voice",
        turns: [{ id: crypto.randomUUID(), role: "user", content: userText }],
        onText: setBotLine,
      });
      reply = res.text || labels.fallbackReply;
    } catch (err) {
      reply =
        err instanceof ChatRequestError
          ? `${labels.errorPrefix}: ${err.message}`
          : labels.fallbackReply;
    }
    setBotLine(reply);
    speak(reply);
  }

  function startCall() {
    if (!hasCallConsent) return;
    const opening = format(labels.opening, {
      name: customerName,
      plate,
      expires: formatDate(expiresAt),
    });
    setLines([{ role: "bot", text: opening }]);
    speak(opening);
  }

  function startListening() {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRec;
      webkitSpeechRecognition?: new () => SpeechRec;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setTyped(labels.noRecognition);
      return;
    }
    const recognition = new SR();
    recognition.lang = speechLang;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      void botTurn(text);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <Badge tone={engine === "elevenlabs" ? "green" : "sky"}>
          {labels.engine}: {engine === "elevenlabs" ? "ElevenLabs" : "Web Speech"}
        </Badge>
        {!hasCallConsent && <Badge tone="warn">{labels.noConsent}</Badge>}
      </div>
      <div className="mt-6 flex flex-col items-center">
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-tasco-deep text-white">
          <div className="absolute inset-0 animate-pulse rounded-full bg-tasco-sky/20" />
          <span className="text-2xl font-semibold">AI</span>
        </div>
        <h2 className="mt-4 font-semibold text-tasco-deep">{customerName}</h2>
        <p className="text-sm text-muted-foreground">{plate}</p>
      </div>

      <div className="mt-4 max-h-56 space-y-2 overflow-y-auto rounded-xl bg-tasco-pale/50 p-3 text-sm">
        {lines.length === 0 && (
          <p className="text-muted-foreground">
            {labels.idle}
          </p>
        )}
        {lines.map((l, i) => (
          <div
            key={i}
            className={
              l.role === "bot" ? "text-tasco-deep" : "text-right text-tasco-navy"
            }
          >
            <span className="text-[10px] font-bold uppercase opacity-60">
              {l.role === "bot" ? labels.bot : labels.user}
            </span>
            <div className="whitespace-pre-wrap">
              <ChatText text={l.text} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={startCall} disabled={!hasCallConsent}>
          {labels.start}
        </Button>
        <Button variant="secondary" onClick={startListening} disabled={listening}>
          {listening ? labels.listening : labels.speak}
        </Button>
        <Button
          variant="outline"
          onClick={() => void botTurn(labels.askHumanUtterance)}
        >
          {labels.askHuman}
        </Button>
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!typed.trim()) return;
          void botTurn(typed);
          setTyped("");
        }}
      >
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={labels.typedPlaceholder}
          className="h-10 flex-1 rounded-xl border px-3 text-sm"
        />
        <Button type="submit" size="sm">
          {labels.send}
        </Button>
      </form>
    </div>
  );
}