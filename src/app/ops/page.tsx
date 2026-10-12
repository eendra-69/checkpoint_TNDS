import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { maskCustomer } from "@/lib/masking";
import { daysUntil, formatVnd } from "@/lib/utils";
import { runRenewalCampaign } from "@/app/actions/campaign";
import { getDemoCustomerId } from "@/lib/data/seed";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function OpsPage() {
  const auth = await requirePermission("ops:view");
  const session = await getOrCreateSession(auth.sessionId);
  const lastCampaign = session.campaigns[0];
  const dict = getDictionary(await getLocale());

  const rows = session.scores.slice(0, 25).map((score) => {
    const customer = session.customers.find((c) => c.id === score.customerId)!;
    const policy = session.policies.find((p) => p.customerId === score.customerId)!;
    const vehicle = session.vehicles.find((v) => v.id === policy.vehicleId)!;
    const masked = maskCustomer(
      customer,
      auth.persona,
      session.revealedPii[customer.id] || [],
    );
    return { score, customer: masked, policy, vehicle };
  });

  return (
    <AppShell
      title={dict.ops.title}
      subtitle={dict.ops.subtitle}
      compact
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge tone="sky">{session.customers.length} synthetic owners</Badge>
          <Badge>Assumption: CRM export</Badge>
        </div>
        <form action={runRenewalCampaign}>
          <Button type="submit">Run renewal campaign</Button>
        </form>
      </div>

      {lastCampaign && (
        <div className="mb-4 rounded-2xl border border-tasco-sky/30 bg-gradient-to-r from-tasco-pale to-white p-4 text-sm shadow-sm">
          Last run targeted <strong>{lastCampaign.targeted}</strong>, excluded{" "}
          <strong>{lastCampaign.excluded}</strong>
          {Object.keys(lastCampaign.exclusionReasons).length > 0 && (
            <span className="text-muted-foreground">
              {" "}
              (
              {Object.entries(lastCampaign.exclusionReasons)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")}
              )
            </span>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-tasco-deep text-white">
              <tr>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Plate</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Consent</th>
                <th className="px-4 py-3 font-medium">Next best action</th>
                <th className="px-4 py-3 font-medium">State</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ score, customer, policy, vehicle }) => {
                const days = daysUntil(policy.expiresAt);
                const state = session.caseStates[customer.id];
                const isDemo = Boolean(customer.demoKey);
                return (
                  <tr
                    key={customer.id}
                    className="border-t border-border odd:bg-white even:bg-tasco-pale/30"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold tabular-nums text-tasco-deep">
                        {score.score}
                      </div>
                      <Badge
                        tone={
                          score.propensity === "high"
                            ? "green"
                            : score.propensity === "medium"
                              ? "sky"
                              : "muted"
                        }
                      >
                        {score.propensity}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{customer.fullNameVi}</div>
                      <div className="text-xs text-muted-foreground">
                        {score.reasons[0]}
                      </div>
                      {isDemo && customer.demoKey === "minh" && (
                        <Link
                          href={`/chat/${getDemoCustomerId("minh")}`}
                          className="mt-1 inline-block text-xs font-semibold text-tasco-sky"
                        >
                          Open chat demo →
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{vehicle.plate}</td>
                    <td className="px-4 py-3">
                      <div className="tabular-nums">{days}d</div>
                      <div className="text-xs text-muted-foreground">
                        {formatVnd(policy.premiumVnd)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div>msg {customer.consent.messaging ? "✓" : "✗"}</div>
                      <div>call {customer.consent.calls ? "✓" : "✗"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium capitalize">
                        {score.nextBestAction.channel}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {score.nextBestAction.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {score.nextBestAction.sendAtHint}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="muted">{state}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}