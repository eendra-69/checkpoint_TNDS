import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { requirePermission } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { auditDropped, listAudit, totalAuditEvents } from "@/lib/audit";
import { maskCustomer } from "@/lib/masking";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/t";
import { describeAudit, describeTriage } from "@/lib/i18n/generated";

export default async function CompliancePage() {
  const auth = await requirePermission("compliance:view");
  const session = await getOrCreateSession(auth.sessionId);
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const t = dict.complianceBody;

  const claimOwner = (customerId: string) => {
    const owner = session.customers.find((c) => c.id === customerId);
    return owner ? maskCustomer(owner, auth.persona, []).fullNameVi : customerId;
  };

  const [auditEvents, auditTotal, auditDroppedCount] = await Promise.all([
    listAudit(auth.sessionId, 200),
    totalAuditEvents(auth.sessionId),
    auditDropped(auth.sessionId),
  ]);

  const consentRows = session.customers.slice(0, 30).map((c) => ({
    customer: maskCustomer(c, auth.persona, []),
    raw: c,
  }));

  return (
    <AppShell
      title={dict.compliance.title}
      subtitle={dict.compliance.subtitle}
    >
      {(session.claims?.length ?? 0) > 0 && (
        <section className="mb-6 rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-4 py-3 font-display font-semibold text-tasco-ink">
            {t.claimsLedger}
          </div>
          <div className="max-h-64 space-y-2 overflow-auto p-3">
            {session.claims.map((c) => (
              <div key={c.id} className="rounded-xl bg-tasco-mist/50 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold">{c.id}</span>
                  <Badge tone="sky">{dict.claimStates[c.status]}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {claimOwner(c.customerId)}
                  </span>
                </div>
                <div className="mt-1 text-muted-foreground">{c.note}</div>
                {describeTriage(c, locale) && (
                  <div className="mt-1 text-xs text-tasco-forest">{describeTriage(c, locale)}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-4 py-3 font-display font-semibold text-tasco-ink">
            {t.consentLedger}
          </div>
          <div className="max-h-[480px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="px-3 py-2">{t.customer}</th>
                  <th className="px-3 py-2">{t.msg}</th>
                  <th className="px-3 py-2">{t.call}</th>
                  <th className="px-3 py-2">{t.data}</th>
                </tr>
              </thead>
              <tbody>
                {consentRows.map(({ customer, raw }) => (
                  <tr key={customer.id} className="border-t">
                    <td className="px-3 py-2">{customer.fullNameVi}</td>
                    <td className="px-3 py-2">{raw.consent.messaging ? "✓" : "✗"}</td>
                    <td className="px-3 py-2">{raw.consent.calls ? "✓" : "✗"}</td>
                    <td className="px-3 py-2">{raw.consent.dataUse ? "✓" : "✗"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
            <span className="font-display font-semibold text-tasco-ink">
              {t.auditLog}
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge tone="muted">{t.appendOnly}</Badge>
              <span>{format(t.eventsRetained, { n: auditTotal })}</span>
              {auditDroppedCount > 0 && (
                // Retention is counted, never silent.
                <span className="text-amber-800">
                  · {format(t.eventsAgedOut, { n: auditDroppedCount })}
                </span>
              )}
            </div>
          </div>
          <div className="max-h-[480px] space-y-2 overflow-auto p-3">
            {auditEvents.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">
                No audit events yet.
              </p>
            )}
            {auditEvents.slice(0, 80).map((e) => (
              <div key={e.id} className="rounded-xl bg-tasco-mist/50 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="muted">#{e.seq}</Badge>
                  <Badge tone="muted">{dict.personas[e.persona].label}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Date(e.at).toLocaleString(locale === "vi" ? "vi-VN" : "en-GB")}
                  </span>
                </div>
                <div className="mt-1 font-semibold text-tasco-ink" title={e.action}>
                  {describeAudit(e, locale).label}
                </div>
                <div className="text-muted-foreground">{describeAudit(e, locale).detail}</div>
                {e.reason && (
                  <div className="mt-1 text-xs text-amber-800">
                    {t.reason}: {e.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}