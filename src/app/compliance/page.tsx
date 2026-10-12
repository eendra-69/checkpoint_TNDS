import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { requirePermission } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { maskCustomer } from "@/lib/masking";

export default async function CompliancePage() {
  const auth = await requirePermission("compliance:view");
  const session = await getOrCreateSession(auth.sessionId);

  const consentRows = session.customers.slice(0, 30).map((c) => ({
    customer: maskCustomer(c, auth.persona, []),
    raw: c,
  }));

  return (
    <AppShell
      title="Compliance"
      subtitle="Consent ledger and append-only audit log. Read-only for this persona."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-4 py-3 font-semibold text-tasco-deep">
            Consent ledger
          </div>
          <div className="max-h-[480px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Msg</th>
                  <th className="px-3 py-2">Call</th>
                  <th className="px-3 py-2">Data</th>
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
          <div className="border-b px-4 py-3 font-semibold text-tasco-deep">
            Audit log
          </div>
          <div className="max-h-[480px] space-y-2 overflow-auto p-3">
            {session.audit.slice(0, 80).map((e) => (
              <div key={e.id} className="rounded-xl bg-tasco-pale/50 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="muted">{e.persona}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Date(e.at).toLocaleString("en-GB")}
                  </span>
                </div>
                <div className="mt-1 font-semibold text-tasco-deep">{e.action}</div>
                <div className="text-muted-foreground">{e.detail}</div>
                {e.reason && (
                  <div className="mt-1 text-xs text-amber-800">Reason: {e.reason}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}