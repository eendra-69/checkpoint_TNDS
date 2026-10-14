import { MarketingShell } from "@/components/marketing-shell";
import {
  PersonaPicker,
  type CustomerOption,
  type StaffOption,
} from "@/components/login/persona-picker";
import { PERSONAS } from "@/lib/rbac";
import { getDemoCustomerId } from "@/lib/data/seed";
import type { PersonaId } from "@/lib/types";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

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

  const customers: CustomerOption[] = [
    { key: "minh", label: "Anh Minh", blurb: dict.demoCustomers.minh },
    {
      key: "lan",
      label: "Chị Lan",
      blurb: dict.demoCustomers.lan,
      path: `/call/${getDemoCustomerId("lan")}`,
    },
    // Tuấn's story is confirming incomplete vehicle data; Classic chat shows the "needs confirmation" badge.
    {
      key: "tuan",
      label: "Anh Tuấn",
      blurb: dict.demoCustomers.tuan,
      path: `/chat/${getDemoCustomerId("tuan")}`,
    },
  ];

  const staff: StaffOption[] = (Object.keys(PERSONAS) as PersonaId[])
    .filter((id) => id !== "customer")
    .map((id) => ({
      id,
      label: dict.personas[id].label,
      description: dict.personas[id].description,
      img: STAFF_IMG[id] || "/brand/persona-ops.jpg",
    }));

  return (
    <MarketingShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-tasco-ink sm:text-4xl">
          {dict.login.title}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {dict.login.subtitle}
        </p>

        <div className="mt-8">
          <PersonaPicker
            customers={customers}
            staff={staff}
            next={next}
            continueLabel={dict.login.continue}
            locale={locale}
          />
        </div>
      </div>
    </MarketingShell>
  );
}
