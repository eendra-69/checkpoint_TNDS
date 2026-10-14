import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { maskCustomer } from "@/lib/masking";
import {
  logOutcome,
  revealPii,
  sendRenewalLink,
} from "@/app/actions/telesales";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/t";
import { currentCertificate } from "@/lib/workflow/renewal";
import { describeHandover } from "@/lib/i18n/generated";

export default async function AgentPage() {
  const auth = await requirePermission("agent:view");
  const session = await getOrCreateSession(auth.sessionId);
  const queue = session.handovers.filter((h) => h.status !== "resolved");
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const t = dict.agentBody;
  const { reasonCallback, reasonIdentity } = t;

  return (
    <AppShell
      title={dict.agent.title}
      subtitle={dict.agent.subtitle}
      compact
    >
      {queue.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {t.empty}
          </p>
          <Link href="/login" className="mt-4 inline-block">
            <Button variant="outline">{t.switchToCustomer}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {queue.map((ho) => {
            const customer = session.customers.find((c) => c.id === ho.customerId)!;
            const vehicle = session.vehicles.find((v) => v.customerId === ho.customerId)!;
            const revealed = session.revealedPii[customer.id] || [];
            const masked = maskCustomer(customer, auth.persona, revealed);
            const hasCertificate = Boolean(currentCertificate(session, customer.id));
            const lastOutcome = session.outcomes.find((o) => o.customerId === customer.id);
            const text = describeHandover(ho, locale);
            return (
              <div key={ho.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="warn">{t.handoverStatus[ho.status]}</Badge>
                      <Badge tone="sky">{format(t.from, { channel: t.channels[ho.fromChannel] })}</Badge>
                      {ho.renewalLinkSent && <Badge tone="green">{t.linkSent}</Badge>}
                      {lastOutcome && (
                        <Badge tone="muted">
                          {format(t.lastOutcome, { outcome: t.outcomes[lastOutcome.code] })}
                        </Badge>
                      )}
                    </div>
                    <h2 className="mt-2 text-lg font-semibold text-tasco-ink">
                      {masked.fullNameVi} · {vehicle.plate}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{text.reason}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(ho.createdAt).toLocaleString(locale === "vi" ? "vi-VN" : "en-GB")}
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-tasco-mist/60 p-4 text-sm">
                  <div className="text-xs font-semibold uppercase tracking-wide text-tasco-lime">
                    {t.aiSummary}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{text.summary}</p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border p-3 text-sm">
                    <div className="text-xs text-muted-foreground">{t.phone}</div>
                    <div className="font-mono">{masked.phone}</div>
                    {masked._masked.phone && (
                      <form
                        className="mt-2 flex gap-2"
                        action={async (fd) => {
                          "use server";
                          await revealPii({
                            customerId: customer.id,
                            field: "phone",
                            reason: String(fd.get("reason") || reasonCallback),
                          });
                        }}
                      >
                        <input
                          name="reason"
                          defaultValue={t.reasonCallback}
                          className="h-8 flex-1 rounded-lg border px-2 text-xs"
                        />
                        <Button type="submit" size="sm" variant="outline">
                          {t.reveal}
                        </Button>
                      </form>
                    )}
                  </div>
                  <div className="rounded-xl border p-3 text-sm">
                    <div className="text-xs text-muted-foreground">{t.nationalId}</div>
                    <div className="font-mono">{masked.nationalId}</div>
                    {masked._masked.nationalId && (
                      <form
                        className="mt-2 flex gap-2"
                        action={async (fd) => {
                          "use server";
                          await revealPii({
                            customerId: customer.id,
                            field: "nationalId",
                            reason: String(fd.get("reason") || reasonIdentity),
                          });
                        }}
                      >
                        <input
                          name="reason"
                          defaultValue={t.reasonIdentity}
                          className="h-8 flex-1 rounded-lg border px-2 text-xs"
                        />
                        <Button type="submit" size="sm" variant="outline">
                          {t.reveal}
                        </Button>
                      </form>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await sendRenewalLink({
                        customerId: customer.id,
                        handoverId: ho.id,
                      });
                    }}
                  >
                    <Button type="submit">{t.sendLink}</Button>
                  </form>
                  <Link href={`/chat/${customer.id}`}>
                    <Button type="button" variant="outline">
                      {t.openChat}
                    </Button>
                  </Link>
                  {(
                    [
                      "link_sent",
                      "callback_requested",
                      "not_interested",
                      "renewed",
                    ] as const
                  ).map((code) => (
                    <form
                      key={code}
                      action={async () => {
                        "use server";
                        await logOutcome({
                          customerId: customer.id,
                          code,
                          handoverId: ho.id,
                        });
                      }}
                    >
                      <Button
                        type="submit"
                        size="sm"
                        variant="secondary"
                        disabled={code === "renewed" && !hasCertificate}
                        title={code === "renewed" && !hasCertificate ? t.renewedNeedsCert : undefined}
                      >
                        {t.outcomes[code]}
                      </Button>
                    </form>
                  ))}
                </div>
                {!hasCertificate && (
                  <p className="mt-2 text-xs text-muted-foreground">{t.renewedNeedsCert}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}