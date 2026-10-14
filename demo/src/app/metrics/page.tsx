import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { requirePermission } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function MetricsPage() {
  const auth = await requirePermission("metrics:view");
  const session = await getOrCreateSession(auth.sessionId);
  const dict = getDictionary(await getLocale());
  const f = session.funnel;

  const cards = [
    { label: "Reminded", value: f.reminded },
    { label: "Engaged", value: f.engaged },
    { label: "Confirmed", value: f.confirmed },
    { label: "Paid", value: f.paid },
    { label: "Issued", value: f.issued },
    { label: "Handed over", value: f.handedOver },
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
          <Badge tone="sky">Headline: renewal-rate uplift</Badge>
          <h2 className="mt-3 text-lg font-semibold text-tasco-ink">
            Assumed impact
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Baseline voluntary renewal (assumed): {(baseline * 100).toFixed(0)}%</li>
            <li>Target with timely reminders + chat: {(target * 100).toFixed(0)}%</li>
            <li>Uplift claimed for pitch: +{(assumedUplift * 100).toFixed(0)} pp</li>
            <li>Supporting metric: ~{minutesSaved} telesales minutes saved per bot-handled renewal</li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Baselines are labelled assumptions until Tasco shares channel metrics in pilot scoping.
          </p>
        </section>
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <Badge>Cost per renewal (illustrative)</Badge>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>LLM chat turn: ~$0.002–0.01 (Flash / mini class)</li>
            <li>Web Speech voice: $0 · ElevenLabs: per-character TTS</li>
            <li>No discount budget — experience-only acquisition</li>
          </ul>
          <div className="mt-4 rounded-xl bg-tasco-mist/60 p-3 text-sm">
            Outcomes logged this session:{" "}
            <strong>{session.outcomes.length}</strong>
          </div>
        </section>
      </div>
    </AppShell>
  );
}