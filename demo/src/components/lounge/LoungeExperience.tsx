"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePresence } from "@/components/world/use-presence";
import type { InteractableDef } from "@/components/world/world-map";
import { TouchPad } from "@/components/office/ui/TouchPad";
import { InteractPrompt } from "@/components/office/ui/InteractPrompt";
import type { PersonaId } from "@/lib/types";
import type { Locale } from "@/lib/i18n/locale";
import { LOUNGE_MAP, LOUNGE_PRESENCE_SHEETS, LoungeWorldNodes } from "./lounge-world";
import { LoungeChat, type LoungeChatCopy } from "./LoungeChat";

type LoungeCopy = {
  loading: string;
  hintWalk: string;
  hintNear: string;
  stationPrompt: string;
  online: (n: number) => string;
  chat: LoungeChatCopy;
};

/**
 * Locale lives in a server component, but `next/dynamic` can only be created at
 * module scope — so the loading fallback reads its string from here instead of
 * hard-coding English the way the office scene does.
 */
const SceneCopyContext = createContext<{ loading: string }>({ loading: "" });

const WorldScene = dynamic(
  () => import("@/components/world/WorldScene").then((m) => m.WorldScene),
  {
    ssr: false,
    loading: () => <LoungeSceneFallback />,
  },
);

function LoungeSceneFallback() {
  const { loading } = useContext(SceneCopyContext);
  return (
    <div className="flex h-full items-center justify-center bg-tasco-ink text-white">
      <div className="font-pixel tracking-wide">{loading}</div>
    </div>
  );
}

const copy: Record<Locale, LoungeCopy> = {
  vi: {
    loading: "Đang vào Virtual Lounge…",
    hintWalk: "WASD / phím mũi tên để đi · E để mở chat",
    hintNear: "Nhấn E / A để mở chat",
    stationPrompt: "Đến gian chat ở giữa phòng",
    online: (n) => `${n} đang online`,
    chat: {
      title: "Trò chuyện chung",
      close: "Esc",
      empty: "Chưa có tin nhắn — hãy chào một câu.",
      placeholder: "Nhắn một câu…",
      send: "Gửi",
      sending: "…",
      waitingId: "Đang kết nối…",
      moderated: "Tin nhắn đã được bộ lọc kiểm duyệt che bớt một phần.",
      loadFailed: "Không tải được tin nhắn. Đang thử lại…",
      errUnauthorized: "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.",
      errForbidden: "Vai trò của bạn không được gửi tin trong phòng này.",
      errRateLimited: "Bạn gửi hơi nhanh — thử lại sau giây lát.",
      errGeneric: "Gửi không thành công. Thử lại nhé.",
    },
  },
  en: {
    loading: "Entering Virtual Lounge…",
    hintWalk: "WASD / arrows to walk · E to open chat",
    hintNear: "Press E / A to open chat",
    stationPrompt: "Step up to the chat wall in the middle",
    online: (n) => `${n} online`,
    chat: {
      title: "Lounge chat",
      close: "Esc",
      empty: "No messages yet — say hello.",
      placeholder: "Say something…",
      send: "Send",
      sending: "…",
      waitingId: "Connecting…",
      moderated: "Message was filtered by the moderation list.",
      loadFailed: "Couldn't load messages. Retrying…",
      errUnauthorized: "Your session expired. Sign in again.",
      errForbidden: "Your persona cannot post in the lounge.",
      errRateLimited: "Slow down a little — try again in a moment.",
      errGeneric: "Couldn't send. Please try again.",
    },
  },
};

export function loungeCopy(locale: Locale = "vi"): LoungeCopy {
  return copy[locale] || copy.vi;
}

export function LoungeExperience({
  displayName,
  persona,
  locale = "vi",
}: {
  displayName: string;
  persona: PersonaId;
  locale?: Locale;
}) {
  const t = useMemo(() => loungeCopy(locale), [locale]);
  const [chatOpen, setChatOpen] = useState(false);
  const [near, setNear] = useState<InteractableDef | null>(null);

  // Reading the chat must not drift the camera around, so the panel locks
  // movement the same way the office panels do.
  const movementLocked = chatOpen;

  const { others, update, connected, selfId } = usePresence("lounge");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setChatOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onNear = useCallback((it: InteractableDef | null) => setNear(it), []);

  const onInteract = useCallback((it: InteractableDef) => {
    if (it.id === "chat") setChatOpen(true);
  }, []);

  const nearChat = near?.id === "chat" && !chatOpen;

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] flex-1 bg-tasco-ink">
      <SceneCopyContext.Provider value={{ loading: t.loading }}>
        <div className="absolute inset-0">
          <WorldScene
            world={LOUNGE_MAP}
            worldNodes={<LoungeWorldNodes />}
            locked={movementLocked}
            nearId={near?.id ?? null}
            onNear={onNear}
            onInteract={onInteract}
            others={others}
            onMove={update}
            playerSheet="/office/player.png"
            presenceSheets={LOUNGE_PRESENCE_SHEETS}
            clearColor="#0b1f12"
          />
        </div>
      </SceneCopyContext.Provider>

      <div className="pointer-events-none absolute right-3 top-3 z-10">
        <span className="jrpg-window px-2.5 py-1 font-pixel text-[11px] text-white">
          {connected ? t.online(others.length + 1) : "…"}
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-4">
        <div className="jrpg-window px-4 py-2 font-pixel text-xs text-white/90 sm:text-sm">
          {nearChat ? t.stationPrompt : t.hintWalk}
        </div>
      </div>

      {nearChat && <InteractPrompt text={t.hintNear} />}

      {!chatOpen && <TouchPad />}

      {chatOpen && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-tasco-ink/40 p-3 backdrop-blur-[2px] sm:items-center sm:p-6">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col">
            <LoungeChat
              selfId={selfId}
              displayName={displayName}
              persona={persona}
              copy={t.chat}
              onClose={() => setChatOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
