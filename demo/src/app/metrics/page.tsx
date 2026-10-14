import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { requirePermission } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/t";

export default async function MetricsPage() {
  const auth = await requirePermission("metrics:view");
  const session = await getOrCreateSession(auth.sessionId);
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const f = session.funnel;
  const t = dict.metricsBody;

  const cards = [
    { label: t.reminded, value: f.reminded },
    { label: t.engaged, value: f.engaged },
    { label: t.confirmed, value: f.confirmed },
    { label: t.paid, value: f.paid },
    { label: t.issued, value: f.issued },
    { label: t.handedOver, value: f.handedOver },
  ];

  const baseline = 0.28;
  const assumedUplift = 0.08;
  const target = baseline + assumedUplift;
  const minutesSaved = 4.5;

  return (
    <AppShell
      title={dict.metrics.title}
      subtitle={dict.metrics.subtitle}
      compact
    >
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border bg-gradient-to-b from-white to-tasco-mist/40 p-4 shadow-sm"
          >
            <div className="text-xs text-muted-foreground">{c.label}</div>
            <div className="mt-1 font-display text-2xl font-semibold tabular-nums text-tasco-ink">
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <Badge tone="sky">{t.headline}</Badge>
          <h2 className="mt-3 text-lg font-semibold text-tasco-ink">
            {t.assumedImpact}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>{format(t.baseline, { n: (baseline * 100).toFixed(0) })}</li>
            <li>{format(t.target, { n: (target * 100).toFixed(0) })}</li>
            <li>{format(t.uplift, { n: (assumedUplift * 100).toFixed(0) })}</li>
            <li>{format(t.minutesSaved, {
              n: minutesSaved.toLocaleString(locale === "vi" ? "vi-VN" : "en-GB"),
            })}</li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            {t.baselineNote}
          </p>
        </section>
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <Badge>{t.costBadge}</Badge>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>{t.llmCost}</li>
            <li>{t.voiceCost}</li>
            <li>{t.noDiscount}</li>
          </ul>
          <div className="mt-4 rounded-xl bg-tasco-mist/60 p-3 text-sm">
            {t.outcomesLogged}{" "}
            <strong>{session.outcomes.length}</strong>
          </div>
        </section>
      </div>
    </AppShell>
  );
}