"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CaseState, Claim, ConsentFlags } from "@/lib/types";
import type { Interactable, OfficeStation } from "./world/map";
import { officeCopy } from "./office-copy";
import { CsPanel } from "./panels/CsPanel";
import { ClaimsPanel } from "./panels/ClaimsPanel";
import { AdminPanel } from "./panels/AdminPanel";
import { TouchPad } from "./ui/TouchPad";
import { InteractPrompt } from "./ui/InteractPrompt";
import { JrpgDialog } from "./ui/JrpgDialog";
import { useOnboardingOptional } from "@/components/onboarding/onboarding-context";

const OfficeScene = dynamic(
  () => import("./OfficeScene").then((m) => m.OfficeScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-tasco-deep text-white">
        <div className="font-pixel tracking-wide">Loading Virtual Office…</div>
      </div>
    ),
  },
);

const PORTRAITS: Partial<Record<OfficeStation, string>> = {
  cs: "/office/portrait-cs.png",
  claims: "/office/portrait-claims.png",
  reception: "/office/portrait-reception.png",
  admin: "/office/portrait-reception.png",
};

export function OfficeExperience({
  customerId,
  customerName,
  plate,
  caseState,
  claims,
  consent,
  certificateId,
  initialStation,
  locale = "vi",
}: {
  customerId: string;
  customerName: string;
  plate: string;
  caseState: CaseState;
  claims: Claim[];
  consent: ConsentFlags;
  certificateId?: string;
  initialStation?: OfficeStation | null;
  locale?: "vi" | "en";
}) {
  const router = useRouter();
  const onboarding = useOnboardingOptional();
  const t = useMemo(() => officeCopy(locale), [locale]);
  const [active, setActive] = useState<OfficeStation | null>(
    initialStation && initialStation !== "vetc" ? initialStation : null,
  );
  const [near, setNear] = useState<Interactable | null>(null);
  const [introDone, setIntroDone] = useState(false);
  const movementLocked = Boolean(active) || Boolean(onboarding?.locksOffice);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(null);
        setIntroDone(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onNear = useCallback((it: Interactable | null) => setNear(it), []);

  const onInteract = useCallback(
    (it: Interactable) => {
      if (it.id === "vetc") {
        router.push(`/vetc/${customerId}`);
        return;
      }
      setIntroDone(false);
      setActive(it.id);
    },
    [customerId, router],
  );

  const stationCopy = active ? t.stations[active] : null;

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] flex-1 bg-tasco-deep">
      <div className="absolute inset-0">
        <OfficeScene
          locked={movementLocked}
          nearId={near?.id ?? null}
          onNear={onNear}
          onInteract={onInteract}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-4">
        <div className="jrpg-window px-4 py-2 font-pixel text-xs text-white/90 sm:text-sm">
          {near && !active ? t.stations[near.id].prompt : t.hintWalk}
        </div>
      </div>

      {near && !active && !onboarding?.locksOffice && (
        <InteractPrompt text={`${t.hintNear} — ${t.stations[near.id].name}`} />
      )}

      {!onboarding?.locksOffice && <TouchPad />}

      {active && stationCopy && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-tasco-deep/40 p-3 backdrop-blur-[2px] sm:items-center sm:p-6">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-3 overflow-y-auto">
            <div className="flex justify-end">
              <button
                type="button"
                className="jrpg-window pointer-events-auto px-3 py-1 font-pixel text-xs text-white"
                onClick={() => {
                  setActive(null);
                  setIntroDone(false);
                }}
              >
                Esc
              </button>
            </div>
            <JrpgDialog
              name={stationCopy.name}
              portrait={PORTRAITS[active]}
              intro={stationCopy.intro}
              onDone={() => setIntroDone(true)}
            >
              {introDone && active === "cs" && (
                <CsPanel
                  customerId={customerId}
                  customerName={customerName}
                  locale={locale}
                  onClose={() => setActive(null)}
                />
              )}
              {introDone && active === "claims" && (
                <ClaimsPanel
                  claims={claims}
                  locale={locale}
                  onClose={() => setActive(null)}
                />
              )}
              {introDone && active === "admin" && (
                <AdminPanel
                  customerId={customerId}
                  customerName={customerName}
                  plate={plate}
                  caseState={caseState}
                  claims={claims}
                  consent={consent}
                  certificateId={certificateId}
                  locale={locale}
                  onClose={() => setActive(null)}
                  onOpenClaims={() => {
                    setIntroDone(false);
                    setActive("claims");
                  }}
                  onOpenCs={() => {
                    setIntroDone(false);
                    setActive("cs");
                  }}
                />
              )}
              {introDone && active === "reception" && (
                <div className="jrpg-window pointer-events-auto p-4 text-sm text-white">
                  <p className="text-white/80">
                    {locale === "vi"
                      ? "Đi tới bàn CS (phải), bồi thường (trái), hoặc bảng hồ sơ."
                      : "Walk to CS (right), Claims (left), or the Admin board."}
                  </p>
                  <button
                    type="button"
                    className="mt-3 rounded-lg bg-tasco-sky px-3 py-2 font-pixel text-tasco-deep"
                    onClick={() => setActive(null)}
                  >
                    OK
                  </button>
                </div>
              )}
            </JrpgDialog>
          </div>
        </div>
      )}
    </div>
  );
}
