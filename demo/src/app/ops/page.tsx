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
import { format } from "@/lib/i18n/t";
import { describeNextAction, describeReason } from "@/lib/i18n/generated";

export default async function OpsPage() {
  const auth = await requirePermission("ops:view");
  const session = await getOrCreateSession(auth.sessionId);
  const lastCampaign = session.campaigns[0];
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const t = dict.opsBody;

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
          <Badge tone="sky">
            {format(t.syntheticOwners, { n: session.customers.length })}
          </Badge>
          <Badge>{t.crmAssumption}</Badge>
        </div>
        <form action={runRenewalCampaign}>
          <Button type="submit">{t.runCampaign}</Button>
        </form>
      </div>

      {lastCampaign && (
        <div className="mb-4 rounded-2xl border border-tasco-lime/30 bg-gradient-to-r from-tasco-mist to-white p-4 text-sm shadow-sm">
          {t.lastRunTargeted} <strong>{lastCampaign.targeted}</strong>,{" "}
          {t.lastRunExcluded}{" "}
          <strong>{lastCampaign.excluded}</strong>
          {Object.keys(lastCampaign.exclusionReasons).length > 0 && (
            <span className="text-muted-foreground">
              {" "}
              (
              {Object.entries(lastCampaign.exclusionReasons)
                .map(([k, v]) => `${t.exclusionReasons[k] ?? k}: ${v}`)
                .join(", ")}
              )
            </span>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-tasco-ink text-white">
              <tr>
                <th className="px-4 py-3 font-medium">{t.colScore}</th>
                <th className="px-4 py-3 font-medium">{t.colCustomer}</th>
                <th className="px-4 py-3 font-medium">{t.colPlate}</th>
                <th className="px-4 py-3 font-medium">{t.colExpires}</th>
                <th className="px-4 py-3 font-medium">{t.colConsent}</th>
                <th className="px-4 py-3 font-medium">{t.colNextAction}</th>
                <th className="px-4 py-3 font-medium">{t.colState}</th>
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
                    className="border-t border-border odd:bg-white even:bg-tasco-mist/30"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold tabular-nums text-tasco-ink">
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
                        {t.propensity[score.propensity]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{customer.fullNameVi}</div>
                      <div className="text-xs text-muted-foreground">
                        {score.reasons[0] && describeReason(score.reasons[0], locale)}
                      </div>
                      {isDemo && customer.demoKey === "minh" && (
                        <Link
                          href={`/chat/${getDemoCustomerId("minh")}`}
                          className="mt-1 inline-block text-xs font-semibold text-tasco-lime"
                        >
                          {t.openChatDemo}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{vehicle.plate}</td>
                    <td className="px-4 py-3">
                      <div className="tabular-nums">{format(t.days, { n: days })}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatVnd(policy.premiumVnd)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div>
                        {t.consentMsg} {customer.consent.messaging ? "✓" : "✗"}
                      </div>
                      <div>
                        {t.consentCall} {customer.consent.calls ? "✓" : "✗"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium first-letter:uppercase">
                        {dict.agentBody.channels[score.nextBestAction.channel]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {describeNextAction(score.nextBestAction, locale).label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {describeNextAction(score.nextBestAction, locale).when}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="muted">{dict.caseStates[state] ?? state}</Badge>
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