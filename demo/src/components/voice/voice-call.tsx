"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
}: {
  customerId: string;
  customerName: string;
  plate: string;
  expiresAt: string;
  hasCallConsent: boolean;
  engine: "elevenlabs" | "webspeech";
}) {
  const [lines, setLines] = useState<Line[]>([]);
  const [listening, setListening] = useState(false);
  const [typed, setTyped] = useState("");
  const recognitionRef = useRef<SpeechRec | null>(null);

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "vi-VN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  async function botTurn(userText: string) {
    setLines((l) => [...l, { role: "user", text: userText }]);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        messages: [
          {
            id: crypto.randomUUID(),
            role: "user",
            parts: [{ type: "text", text: userText }],
          },
        ],
      }),
    });
    const data = await res.json();
    const reply =
      data.text ||
      "Xin lỗi, em chưa nghe rõ. Anh/chị muốn gặp nhân viên không?";
    setLines((l) => [...l, { role: "bot", text: reply }]);
    speak(reply.slice(0, 220));
  }

  function startCall() {
    if (!hasCallConsent) return;
    const opening = `Xin chào ${customerName}. Em gọi về TNDS xe biển ${plate}, hết hạn ${expiresAt.slice(0, 10)}. Anh/chị có muốn gia hạn hoặc gặp nhân viên không?`;
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
      setTyped("Browser speech recognition unavailable — type instead.");
      return;
    }
    const recognition = new SR();
    recognition.lang = "vi-VN";
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
          Voice engine: {engine === "elevenlabs" ? "ElevenLabs" : "Web Speech"}
        </Badge>
        {!hasCallConsent && <Badge tone="warn">No call consent</Badge>}
      </div>
      <div className="mt-6 flex flex-col items-center">
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-tasco-ink text-white">
          <div className="absolute inset-0 animate-pulse rounded-full bg-tasco-lime/20" />
          <span className="text-2xl font-semibold">AI</span>
        </div>
        <h2 className="mt-4 font-semibold text-tasco-ink">{customerName}</h2>
        <p className="text-sm text-muted-foreground">{plate}</p>
      </div>

      <div className="mt-4 max-h-56 space-y-2 overflow-y-auto rounded-xl bg-tasco-mist/50 p-3 text-sm">
        {lines.length === 0 && (
          <p className="text-muted-foreground">
            Press start to begin the consent-based call.
          </p>
        )}
        {lines.map((l, i) => (
          <div
            key={i}
            className={
              l.role === "bot" ? "text-tasco-ink" : "text-right text-tasco-forest"
            }
          >
            <span className="text-[10px] font-bold uppercase opacity-60">
              {l.role}
            </span>
            <div className="whitespace-pre-wrap">{l.text}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={startCall} disabled={!hasCallConsent}>
          Start call
        </Button>
        <Button variant="secondary" onClick={startListening} disabled={listening}>
          {listening ? "Listening…" : "Speak"}
        </Button>
        <Button
          variant="outline"
          onClick={() => void botTurn("Tôi muốn gặp nhân viên")}
        >
          Ask for human
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
          placeholder="Typed fallback…"
          className="h-10 flex-1 rounded-xl border px-3 text-sm"
        />
        <Button type="submit" size="sm">
          Send
        </Button>
      </form>
    </div>
  );
}