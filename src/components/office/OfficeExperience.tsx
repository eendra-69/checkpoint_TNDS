"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CaseState, Claim, ConsentFlags } from "@/lib/types";
import type { OfficeStation } from "./Stations";
import { STATION_META } from "./Stations";
import { CsPanel } from "./panels/CsPanel";
import { ClaimsPanel } from "./panels/ClaimsPanel";
import { AdminPanel } from "./panels/AdminPanel";

const OfficeScene = dynamic(
  () => import("./OfficeScene").then((m) => m.OfficeScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-tasco-deep text-white">
        <div className="font-display tracking-wide">Loading Virtual Office…</div>
      </div>
    ),
  },
);

export function OfficeExperience({
  customerId,
  customerName,
  plate,
  caseState,
  claims,
  consent,
  certificateId,
  initialStation,
}: {
  customerId: string;
  customerName: string;
  plate: string;
  caseState: CaseState;
  claims: Claim[];
  consent: ConsentFlags;
  certificateId?: string;
  initialStation?: OfficeStation | null;
}) {
  const router = useRouter();
  const [active, setActive] = useState<OfficeStation | null>(
    initialStation || null,
  );
  const [hint, setHint] = useState("Chọn bàn để bắt đầu · phím 1 / 2 / 3");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
      if (e.key === "1") setActive("cs");
      if (e.key === "2") setActive("claims");
      if (e.key === "3") setActive("admin");
      if (e.key === "4") setActive("vetc");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function select(id: OfficeStation) {
    if (id === "vetc") {
      setHint("Chuyển sang Classic VETC…");
      router.push(`/vetc/${customerId}`);
      return;
    }
    setActive(id);
    setHint(STATION_META[id].prompt);
  }

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] flex-1 bg-tasco-deep">
      <div className="absolute inset-0">
        <OfficeScene active={active} onSelect={select} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-4">
        <div className="office-prompt pointer-events-none rounded-full border border-white/20 bg-tasco-deep/70 px-4 py-2 text-sm font-medium text-white backdrop-blur">
          {hint}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden max-w-xs rounded-2xl border border-white/15 bg-tasco-deep/75 p-3 text-xs text-white/80 backdrop-blur sm:block">
        <div className="font-display text-sm text-white">Tasco Virtual Office</div>
        <p className="mt-1">
          1 CS · 2 Claims · 3 Admin · 4 VETC · Esc đóng panel
        </p>
      </div>

      {active && active !== "vetc" && (
        <div className="absolute inset-0 z-20 flex items-end justify-center bg-tasco-deep/35 p-4 backdrop-blur-[2px] sm:items-center">
          {active === "cs" && (
            <CsPanel
              customerId={customerId}
              customerName={customerName}
              onClose={() => setActive(null)}
            />
          )}
          {active === "claims" && (
            <ClaimsPanel claims={claims} onClose={() => setActive(null)} />
          )}
          {active === "admin" && (
            <AdminPanel
              customerId={customerId}
              customerName={customerName}
              plate={plate}
              caseState={caseState}
              claims={claims}
              consent={consent}
              certificateId={certificateId}
              onClose={() => setActive(null)}
              onOpenClaims={() => setActive("claims")}
              onOpenCs={() => setActive("cs")}
            />
          )}
        </div>
      )}
    </div>
  );
}
