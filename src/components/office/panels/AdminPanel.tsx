"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CaseState, Claim, ConsentFlags } from "@/lib/types";

export function AdminPanel({
  customerId,
  customerName,
  plate,
  caseState,
  claims,
  consent,
  certificateId,
  onClose,
  onOpenClaims,
  onOpenCs,
}: {
  customerId: string;
  customerName: string;
  plate: string;
  caseState: CaseState;
  claims: Claim[];
  consent: ConsentFlags;
  certificateId?: string;
  onClose: () => void;
  onOpenClaims: () => void;
  onOpenCs: () => void;
}) {
  return (
    <div className="jrpg-window pointer-events-auto max-h-[75vh] w-full max-w-xl overflow-y-auto">
      <div className="flex items-center justify-between border-b border-white/15 px-4 py-3">
        <div>
          <div className="font-pixel text-sm tracking-wide text-tasco-sky">Admin Board</div>
          <div className="text-[11px] text-white/70">
            Theo dõi hồ sơ · quest log
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-sm text-white/80 hover:bg-white/10"
        >
          Esc
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div className="rounded-xl border bg-tasco-pale/50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pin · TNDS renewal
          </div>
          <h3 className="mt-1 font-display text-lg text-tasco-deep">
            {customerName} · {plate}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone="sky">{caseState}</Badge>
            {certificateId && <Badge tone="green">Certificate issued</Badge>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" type="button" onClick={onOpenCs}>
              Continue with CS
            </Button>
            <Link href={`/chat/${customerId}`}>
              <Button size="sm" variant="outline" type="button">
                Open Classic chat
              </Button>
            </Link>
            {certificateId && (
              <Link href={`/verify/${certificateId}`}>
                <Button size="sm" variant="success" type="button">
                  View certificate
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pin · Claims
          </div>
          {claims.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Chưa có hồ sơ bồi thường.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {claims.map((c) => (
                <li key={c.id} className="text-sm">
                  <span className="font-mono text-xs">{c.id}</span>{" "}
                  <Badge tone="muted">{c.status}</Badge>
                  <div className="text-muted-foreground">{c.note}</div>
                </li>
              ))}
            </ul>
          )}
          <Button
            className="mt-3"
            size="sm"
            variant="secondary"
            type="button"
            onClick={onOpenClaims}
          >
            Add claim photo
          </Button>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pin · Consent checklist
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Messaging: {consent.messaging ? "✓" : "✗"}</li>
            <li>Calls: {consent.calls ? "✓" : "✗"}</li>
            <li>Data use: {consent.dataUse ? "✓" : "✗"}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
