import Link from "next/link";
import { Check, Circle, Loader } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/t";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { WelcomeMetric, WelcomeModel, WelcomeTask } from "@/lib/welcome";

/**
 * Persona landing screen reached from the sidebar Home button.
 *
 * Every role sees its own numbers: a customer gets their renewal standing, a
 * telesales rep gets today's checklist and KPI, an admin gets live application
 * analytics. Values are counted in `lib/welcome.ts` from real session state;
 * all prose and labels are resolved here from the dictionary, so VI and EN stay
 * in step and a missing key degrades to its key rather than blanking the screen.
 */

const TONE_BAR: Record<NonNullable<WelcomeMetric["tone"]>, string> = {
  leaf: "bg-tasco-leaf",
  lime: "bg-tasco-lime",
  sky: "bg-tasco-lime-bright",
  vetc: "bg-vetc-green",
  warn: "bg-amber-500",
};

function MetricCard({
  metric,
  label,
  hint,
}: {
  metric: WelcomeMetric;
  label: string;
  hint?: string;
}) {
  const tone = metric.tone ?? "lime";
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-white to-tasco-mist/40 p-4 shadow-sm">
      <span className={cn("absolute inset-x-0 top-0 h-1", TONE_BAR[tone])} />
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-semibold tabular-nums text-tasco-ink">
        {metric.value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      {metric.progress !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-tasco-mist">
          <div
            className={cn("h-full rounded-full", TONE_BAR[tone])}
            style={{ width: `${Math.round(metric.progress * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

const TASK_ICON = { done: Check, active: Loader, todo: Circle } as const;

const TASK_STYLE = {
  done: "border-vetc-green/40 bg-vetc-green/5 text-tasco-ink",
  active: "border-tasco-lime bg-tasco-lime/10 text-tasco-ink",
  todo: "border-border bg-card text-muted-foreground",
} as const;

function TaskRow({ task, label }: { task: WelcomeTask; label: string }) {
  const Icon = TASK_ICON[task.state];
  const body = (
    <>
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
          TASK_STYLE[task.state],
        )}
      >
        <Icon
          className={cn("h-3.5 w-3.5", task.state === "active" && "animate-pulse")}
        />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>
      {task.meta && (
        <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
          {task.meta}
        </span>
      )}
    </>
  );

  if (task.href) {
    return (
      <Link
        href={task.href}
        className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-tasco-lime/40 hover:bg-tasco-mist/50"
      >
        {body}
      </Link>
    );
  }
  return <div className="flex items-center gap-3 px-3 py-2.5">{body}</div>;
}

export function WelcomeScreen({
  model,
  dict,
}: {
  model: WelcomeModel;
  dict: Dictionary;
}) {
  const { persona, vars } = model;
  const label = (group: "metrics" | "tasks" | "actions", id: string) =>
    t(dict, `welcome.${group}.${persona}.${id}`, vars);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-tasco-ink p-6 text-white shadow-sm sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_10%_0%,rgba(163,230,53,0.22),transparent_60%)]" />
        <div className="relative">
          <Badge tone="green">{t(dict, `welcome.role.${persona}`, vars)}</Badge>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t(dict, `welcome.headline.${persona}`, vars)}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/75">
            {t(dict, `welcome.sub.${persona}`, vars)}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {model.actions.map((a) => (
              <Link key={a.id} href={a.href}>
                <Button
                  size="lg"
                  variant={a.tone === "ghost" ? "outline" : "default"}
                  className={
                    a.tone === "primary"
                      ? "bg-tasco-lime-bright text-tasco-ink hover:bg-white"
                      : "border border-white/25 bg-transparent text-white hover:bg-white/10"
                  }
                >
                  {label("actions", a.id)}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-tasco-ink">
          {t(dict, `welcome.section.${persona}.snapshot`, vars)}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {model.metrics.map((m) => (
            <MetricCard
              key={m.id}
              metric={m}
              label={label("metrics", m.id)}
              hint={m.hint ? t(dict, `welcome.hint.${persona}.${m.id}`, vars) : undefined}
            />
          ))}
        </div>
      </section>

      {model.tasks.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-tasco-ink">
            {t(dict, `welcome.section.${persona}.tasks`, vars)}
          </h2>
          <div className="mt-3 divide-y divide-border rounded-2xl border bg-card p-1 shadow-sm">
            {model.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                label={label("tasks", task.id)}
              />
            ))}
          </div>
        </section>
      )}

      {model.assumptionKeys.length > 0 && (
        <section className="rounded-2xl border border-dashed bg-tasco-mist/40 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-tasco-forest">
            {t(dict, "welcome.assumptionsTitle", vars)}
          </h2>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {model.assumptionKeys.map((k) => (
              <li key={k}>{t(dict, `welcome.assumption.${persona}.${k}`, vars)}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}