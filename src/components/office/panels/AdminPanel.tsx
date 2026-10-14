"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CaseState, Claim, ConsentFlags } from "@/lib/types";
import type { Locale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { officeCopy } from "../office-copy";

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
  locale = "vi",
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
  locale?: Locale;
}) {
  const t = officeCopy(locale).adminPanel;
  const dict = getDictionary(locale);
  return (
    <div className="jrpg-window pointer-events-auto max-h-[75vh] w-full max-w-xl overflow-y-auto">
      <div className="flex items-center justify-between border-b border-white/15 px-4 py-3">
        <div>
          <div className="font-pixel text-sm tracking-wide text-tasco-sky">{t.title}</div>
          <div className="text-[11px] text-white/70">
            {t.subtitle}
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
            {t.renewalPin}
          </div>
          <h3 className="mt-1 font-display text-lg text-tasco-deep">
            {customerName} · {plate}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone="sky">{dict.caseStates[caseState] ?? caseState}</Badge>
            {certificateId && <Badge tone="green">{t.certIssued}</Badge>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" type="button" onClick={onOpenCs}>
              {t.continueCs}
            </Button>
            <Link href={`/chat/${customerId}`}>
              <Button size="sm" variant="outline" type="button">
                {t.openClassic}
              </Button>
            </Link>
            {certificateId && (
              <Link href={`/verify/${certificateId}`}>
                <Button size="sm" variant="success" type="button">
                  {t.viewCert}
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.claimsPin}
          </div>
          {claims.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {t.noClaims}
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {claims.map((c) => (
                <li key={c.id} className="text-sm">
                  <span className="font-mono text-xs">{c.id}</span>{" "}
                  <Badge tone="muted">{dict.claimStates[c.status]}</Badge>
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
            {t.addClaim}
          </Button>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.consentPin}
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            <li>{t.messaging}: {consent.messaging ? "✓" : "✗"}</li>
            <li>{t.calls}: {consent.calls ? "✓" : "✗"}</li>
            <li>{t.dataUse}: {consent.dataUse ? "✓" : "✗"}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
