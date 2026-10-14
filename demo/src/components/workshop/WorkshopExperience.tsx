"use client";

import { useCallback, useEffect, useState } from "react";
import type { Claim } from "@/lib/types";
import type { InteractableDef } from "@/components/world/world-map";
import { WorldScene } from "@/components/world/WorldScene";
import { WORKSHOP_MAP, WorkshopWorldNodes } from "./workshop-world";
import { AdvisorPanel } from "./AdvisorPanel";
import { ClaimsPanel } from "@/components/office/panels/ClaimsPanel";
import { InspectionPanel, type WorkshopVehicle } from "./InspectionPanel";
import { TouchPad } from "@/components/office/ui/TouchPad";
import { InteractPrompt } from "@/components/office/ui/InteractPrompt";
import { usePresence } from "@/components/world/use-presence";

const PRESENCE_SHEETS = {
  customer: "/office/player.png",
  telesales: "/office/npc-cs.png",
  campaign_manager: "/office/npc-cs.png",
  compliance: "/office/npc-claims.png",
  executive: "/office/npc-reception.png",
  admin: "/office/npc-reception.png",
};

export type WorkshopStation = "advisor" | "claims" | "inspect";

type Copy = {
  hintWalk: string;
  hintNear: string;
  stations: Record<WorkshopStation, { name: string; prompt: string }>;
};

function workshopCopy(locale: "vi" | "en"): Copy {
  if (locale === "en") {
    return {
      hintWalk: "Walk with WASD / arrows · E to interact",
      hintNear: "Press E",
      stations: {
        advisor: {
          name: "AI Mechanic",
          prompt: "Ask the mechanic about your car or TNDS coverage.",
        },
        claims: {
          name: "Claims Desk",
          prompt: "File a damage claim with photos.",
        },
        inspect: {
          name: "Inspection Pad",
          prompt: "Get a free synthetic walk-around of your vehicle.",
        },
      },
    };
  }
  return {
    hintWalk: "Di chuyển bằng WASD / phím mũi tên · E để tương tác",
    hintNear: "Nhấn E",
    stations: {
      advisor: {
        name: "Thợ sửa xe AI",
        prompt: "Hỏi thợ về xe của bạn hoặc quyền lợi TNDS.",
      },
      claims: {
        name: "Bàn bồi thường",
        prompt: "Khai báo bồi thường kèm ảnh.",
      },
      inspect: {
        name: "Khu kiểm tra",
        prompt: "Kiểm tra tổng quan xe (dữ liệu mô phỏng, miễn phí).",
      },
    },
  };
}

export function WorkshopExperience({
  customerName,
  vehicle,
  claims,
  locale = "vi",
}: {
  customerName: string;
  vehicle: WorkshopVehicle;
  claims: Claim[];
  locale?: "vi" | "en";
}) {
  const t = workshopCopy(locale);
  const [active, setActive] = useState<WorkshopStation | null>(null);
  const [near, setNear] = useState<InteractableDef | null>(null);
  const movementLocked = Boolean(active);

  const { others, update, connected } = usePresence("workshop");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onNear = useCallback((it: InteractableDef | null) => setNear(it), []);

  const onInteract = useCallback((it: InteractableDef) => {
    const id = it.id as WorkshopStation;
    if (id === "advisor" || id === "claims" || id === "inspect") {
      setActive(id);
    }
  }, []);

  const nearCopy = near ? t.stations[near.id as WorkshopStation] : null;

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] flex-1 bg-tasco-ink">
      <div className="absolute inset-0">
        <WorldScene
          world={WORKSHOP_MAP}
          locked={movementLocked}
          nearId={near?.id ?? null}
          onNear={onNear}
          onInteract={onInteract}
          others={others}
          onMove={update}
          presenceSheets={PRESENCE_SHEETS}
          worldNodes={<WorkshopWorldNodes />}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-4">
        <div className="jrpg-window px-4 py-2 font-pixel text-xs text-white/90 sm:text-sm">
          {nearCopy && !active ? nearCopy.prompt : t.hintWalk}
        </div>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-10">
        <span className="jrpg-window px-2.5 py-1 font-pixel text-[11px] text-white">
          {connected ? `${others.length + 1} online` : "…"}
        </span>
      </div>

      {nearCopy && !active && (
        <InteractPrompt text={`${t.hintNear} — ${nearCopy.name}`} />
      )}

      {!movementLocked && <TouchPad />}

      {active && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-tasco-ink/40 p-3 backdrop-blur-[2px] sm:items-center sm:p-6">
          <div className="flex w-full max-w-2xl flex-col gap-3">
            <div className="flex justify-end">
              <button
                type="button"
                className="jrpg-window pointer-events-auto px-3 py-1 font-pixel text-xs text-white"
                onClick={() => setActive(null)}
              >
                Esc
              </button>
            </div>

            {active === "advisor" && (
              <AdvisorPanel
                key={locale}
                locale={locale}
                onClose={() => setActive(null)}
              />
            )}
            {active === "claims" && (
              <div className="pointer-events-auto">
                <ClaimsPanel
                  claims={claims}
                  locale={locale}
                  onClose={() => setActive(null)}
                />
              </div>
            )}
            {active === "inspect" && (
              <InspectionPanel
                vehicle={vehicle}
                customerName={customerName}
                locale={locale}
                onClose={() => setActive(null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
