import { AppShell } from "@/components/app-shell";
import { signInAs } from "@/app/actions/auth";
import { PERSONAS } from "@/lib/rbac";
import { getDemoCustomerId } from "@/lib/data/seed";
import type { DemoCustomerId, PersonaId } from "@/lib/types";
import { Button } from "@/components/ui/button";

const CUSTOMERS: {
  key: DemoCustomerId;
  label: string;
  blurb: string;
  path?: string;
}[] = [
  {
    key: "minh",
    label: "Anh Minh",
    blurb: "Happy-path Zalo renewal · high score · VETC active",
  },
  {
    key: "lan",
    label: "Chị Lan",
    blurb: "Ignores reminder · voice call · handover to telesales",
    path: `/call/${getDemoCustomerId("lan")}`,
  },
  {
    key: "tuan",
    label: "Anh Tuấn",
    blurb: "Incomplete vehicle data · agent asks to confirm",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AppShell
      title="Sign in as…"
      subtitle="No passwords — pick a persona. Server-side RBAC still enforces every screen, API and AI tool."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(Object.keys(PERSONAS) as PersonaId[]).map((id) => {
          const p = PERSONAS[id];
          if (id === "customer") {
            return (
              <div
                key={id}
                className="rounded-2xl border bg-card p-5 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-tasco-deep">{p.label}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-4 space-y-2">
                  {CUSTOMERS.map((c) => (
                    <form
                      key={c.key}
                      action={async () => {
                        "use server";
                        await signInAs({
                          persona: "customer",
                          customerKey: c.key,
                          next: next || c.path,
                        });
                      }}
                    >
                      <button
                        type="submit"
                        className="w-full rounded-xl border border-border bg-tasco-pale/50 px-3 py-3 text-left transition hover:border-tasco-sky/50 hover:bg-tasco-pale"
                      >
                        <div className="font-semibold text-tasco-deep">{c.label}</div>
                        <div className="text-xs text-muted-foreground">{c.blurb}</div>
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <form
              key={id}
              action={async () => {
                "use server";
                await signInAs({ persona: id, next });
              }}
              className="rounded-2xl border bg-card p-5 shadow-sm transition hover:border-tasco-sky/40 hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-tasco-deep">{p.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
              <Button type="submit" className="mt-4 w-full">
                Continue as {p.label}
              </Button>
            </form>
          );
        })}
      </div>
    </AppShell>
  );
}