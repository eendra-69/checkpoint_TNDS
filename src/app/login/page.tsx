import Image from "next/image";
import { MarketingShell } from "@/components/marketing-shell";
import { signInAs } from "@/app/actions/auth";
import { PERSONAS } from "@/lib/rbac";
import { getDemoCustomerId } from "@/lib/data/seed";
import type { DemoCustomerId, PersonaId } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

const CUSTOMERS: {
  key: DemoCustomerId;
  label: string;
  path?: string;
}[] = [
  { key: "minh", label: "Anh Minh" },
  { key: "lan", label: "Chị Lan", path: `/call/${getDemoCustomerId("lan")}` },
  // Tuấn's story is confirming incomplete vehicle data; Classic chat shows the "needs confirmation" badge.
  { key: "tuan", label: "Anh Tuấn", path: `/chat/${getDemoCustomerId("tuan")}` },
];

const STAFF_IMG: Partial<Record<PersonaId, string>> = {
  campaign_manager: "/brand/persona-ops.jpg",
  telesales: "/brand/persona-voice.jpg",
  executive: "/brand/persona-ops.jpg",
  compliance: "/brand/persona-ops.jpg",
  admin: "/brand/persona-ops.jpg",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <MarketingShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-tasco-deep sm:text-4xl">
          {dict.login.title}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {dict.login.subtitle}
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
            <div className="relative h-48 sm:h-56">
              <Image
                src="/brand/persona-driver.jpg"
                alt=""
                fill
                className="object-cover object-top"
                sizes="(max-width:1024px) 100vw, 55vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-tasco-deep/80 to-transparent" />
              <div className="absolute bottom-4 left-5 text-white">
                <div className="font-display text-xl font-semibold">
                  {dict.home.personaCustomer}
                </div>
                <p className="text-sm text-white/80">
                  {dict.login.customerEntry}
                </p>
              </div>
            </div>
            <div className="space-y-2 p-5">
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
                    className="w-full rounded-2xl border border-border bg-tasco-pale/40 px-4 py-3 text-left transition hover:border-tasco-sky/50 hover:bg-tasco-pale"
                  >
                    <div className="font-semibold text-tasco-deep">{c.label}</div>
                    <div className="text-xs text-muted-foreground">{dict.demoCustomers[c.key]}</div>
                  </button>
                </form>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(PERSONAS) as PersonaId[])
              .filter((id) => id !== "customer")
              .map((id) => {
                const p = dict.personas[id];
                const img = STAFF_IMG[id] || "/brand/persona-ops.jpg";
                return (
                  <form
                    key={id}
                    action={async () => {
                      "use server";
                      await signInAs({ persona: id, next });
                    }}
                    className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:border-tasco-sky/40"
                  >
                    <div className="relative h-28">
                      <Image
                        src={img}
                        alt=""
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="280px"
                      />
                      <div className="absolute inset-0 bg-tasco-deep/45" />
                    </div>
                    <div className="p-4">
                      <h2 className="font-display font-semibold text-tasco-deep">
                        {p.label}
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.description}
                      </p>
                      <Button type="submit" className="mt-3 w-full" size="sm">
                        {dict.login.continue}
                      </Button>
                    </div>
                  </form>
                );
              })}
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
