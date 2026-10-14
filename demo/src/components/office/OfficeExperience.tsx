"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CaseState, Claim, ConsentFlags } from "@/lib/types";
import type { InteractableDef } from "@/components/world/world-map";
import type { OfficeStation } from "./world/map";
import { officeCopy } from "./office-copy";
import { CsPanel } from "./panels/CsPanel";
import { ClaimsPanel } from "./panels/ClaimsPanel";
import { AdminPanel } from "./panels/AdminPanel";
import { TouchPad } from "./ui/TouchPad";
import { InteractPrompt } from "./ui/InteractPrompt";
import { JrpgDialog } from "./ui/JrpgDialog";
import { useOnboardingOptional } from "@/components/onboarding/onboarding-context";
import { usePresence } from "@/components/world/use-presence";
import { WorldTopBar } from "@/components/world/world-top-bar";
import type { WorldLabels } from "@/components/world/world-switcher";

const OfficeScene = dynamic(
  () => import("./OfficeScene").then((m) => m.OfficeScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-tasco-ink text-white">
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
  worldLabels,
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
  worldLabels: WorldLabels;
  locale?: "vi" | "en";
}) {
  const router = useRouter();
  const onboarding = useOnboardingOptional();
  const t = useMemo(() => officeCopy(locale), [locale]);
  const [active, setActive] = useState<OfficeStation | null>(
    initialStation && initialStation !== "vetc" ? initialStation : null,
  );
  const [near, setNear] = useState<InteractableDef | null>(null);
  const [introDone, setIntroDone] = useState(false);

  // The sidebar's "Renewal process" and "Claim process" deep-link into a
  // station via ?station=. If the office is already mounted, the useState
  // above never re-runs, so the panel would silently not open.
  //
  // Disabled deliberately: the dependency is `initialStation`, so this fires
  // only when a navigation actually changes the station — never per render,
  // which is the cascading-render case the rule guards against. Deriving from
  // `useSearchParams()` instead would mean a server round trip before the
  // panel opens, because changing ?station= re-runs the page on the server.
  useEffect(() => {
    if (initialStation && initialStation !== "vetc") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActive(initialStation);
      setIntroDone(false);
    }
  }, [initialStation]);
  const movementLocked = Boolean(active) || Boolean(onboarding?.locksOffice);

  // Other signed-in users currently standing in the office.
  const { others, update, connected } = usePresence("office");

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

  const onNear = useCallback((it: InteractableDef | null) => setNear(it), []);

  const onInteract = useCallback(
    (it: InteractableDef) => {
      const id = it.id as OfficeStation;
      if (id === "vetc") {
        router.push(`/vetc/${customerId}`);
        return;
      }
      setIntroDone(false);
      setActive(id);
    },
    [customerId, router],
  );

  const stationCopy = active ? t.stations[active] : null;
  const nearCopy = near ? t.stations[near.id as OfficeStation] : null;

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] flex-1 bg-tasco-ink">
      <div className="absolute inset-0">
        <OfficeScene
          locked={movementLocked}
          nearId={near?.id ?? null}
          onNear={onNear}
          onInteract={onInteract}
          others={others}
          onMove={update}
        />
      </div>

      <WorldTopBar
        labels={worldLabels}
        hint={nearCopy && !active ? nearCopy.prompt : t.hintWalk}
        online={connected ? `${others.length + 1} online` : "…"}
      />

      {nearCopy && !active && !onboarding?.locksOffice && (
        <InteractPrompt text={`${t.hintNear} — ${nearCopy.name}`} />
      )}

      {!onboarding?.locksOffice && <TouchPad />}

      {active && stationCopy && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-tasco-ink/40 p-3 backdrop-blur-[2px] sm:items-center sm:p-6">
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
                    className="mt-3 rounded-lg bg-tasco-lime px-3 py-2 font-pixel text-tasco-ink"
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
