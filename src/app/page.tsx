import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAuth } from "@/lib/auth";

const STEPS = [
  {
    n: "01",
    title: "Score the renewal",
    body: "Campaign manager sees Anh Minh ranked high — VETC-active, Zalo opt-in, 21 days to expiry.",
    href: "/ops",
  },
  {
    n: "02",
    title: "Renew in chat",
    body: "Zalo-style reminder → confirm plate → regulated premium → digital certificate.",
    href: "/login",
  },
  {
    n: "03",
    title: "Voice fallback",
    body: "Chị Lan ignores the message. AI voice calls with consent, then hands to telesales.",
    href: "/login",
  },
  {
    n: "04",
    title: "Measure impact",
    body: "Funnel metrics and assumptions for renewal uplift and telesales minutes saved.",
    href: "/metrics",
  },
];

export default async function HomePage() {
  const auth = await getAuth();

  return (
    <AppShell
      title="Make TNDS something drivers are glad to hold"
      subtitle="Combined renewal journey for the BeyondPilot × Tasco challenge — lead scoring, Zalo-style AI chat, voice handover, and RBAC personas."
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <Badge tone="sky">Open scope · TNDS focus</Badge>
            <Badge tone="green">No discounts</Badge>
            <Badge>Synthetic data</Badge>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-tasco-deep">
            Demo story in four beats
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {STEPS.map((step) => (
              <Link
                key={step.n}
                href={auth ? step.href : "/login"}
                className="rounded-2xl border border-border bg-tasco-pale/40 p-4 transition hover:border-tasco-sky/40 hover:bg-tasco-pale"
              >
                <div className="text-xs font-bold tracking-widest text-tasco-sky">
                  {step.n}
                </div>
                <div className="mt-1 font-semibold text-tasco-deep">{step.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
              </Link>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login">
              <Button size="lg">Sign in as a persona</Button>
            </Link>
            <Link href="/admin/workflow">
              <Button size="lg" variant="outline">
                View workflow map
              </Button>
            </Link>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h3 className="font-semibold text-tasco-deep">Six personas</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Customer, Telesales, Campaign manager, Compliance, Executive, Admin — each sees different screens and masked fields.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h3 className="font-semibold text-tasco-deep">Hard constraint</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No premium discounts, cashback, or disguised price incentives. Convenience, clarity, and service only.
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-tasco-sky/40 bg-tasco-pale/50 p-5">
            <h3 className="font-semibold text-tasco-deep">Floating assistant</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Internal personas get a context-aware helper that never sees more than your role allows.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}