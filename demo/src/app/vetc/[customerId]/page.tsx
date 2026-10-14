import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requirePermission } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { daysUntil, formatVnd } from "@/lib/utils";
import { notFound, redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function VetcPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const auth = await requirePermission("chat:use");
  const { customerId } = await params;
  const session = await getOrCreateSession(auth.sessionId);
  const customer = session.customers.find((c) => c.id === customerId);
  if (!customer) notFound();

  if (auth.persona === "customer" && auth.customerId) {
    const allowed = session.customers.find((c) => c.demoKey === auth.customerId);
    if (!allowed || allowed.id !== customerId) {
      redirect(`/vetc/${allowed?.id || customerId}`);
    }
  }
  const policy = session.policies.find((p) => p.customerId === customerId)!;
  const vehicle = session.vehicles.find((v) => v.id === policy.vehicleId)!;
  const days = daysUntil(policy.expiresAt);
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <AppShell title={dict.vetc.title} subtitle={dict.vetc.subtitle}>
      <div className="mx-auto max-w-sm overflow-hidden rounded-[2rem] border-[8px] border-tasco-ink bg-white shadow-2xl">
        <div className="bg-vetc-green px-4 py-5 text-white">
          <div className="text-xs opacity-80">VETC</div>
          <div className="text-lg font-semibold">
            {locale === "vi" ? "Xin chào" : "Hello"}, {customer.fullNameVi}
          </div>
        </div>
        <div className="space-y-3 p-4">
          <div className="rounded-2xl border bg-tasco-mist/50 p-4">
            <div className="text-xs text-muted-foreground">
              {locale === "vi" ? "Số dư E-tag" : "E-tag balance"}
            </div>
            <div className="text-xl font-semibold tabular-nums">₫ 245.000</div>
          </div>
          <div className="rounded-2xl border-2 border-vetc-green/40 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Badge tone="green">
                {locale === "vi" ? "Gia hạn" : "Renewal"}
              </Badge>
              <Badge tone="warn">
                {days}
                {locale === "vi" ? " ngày còn lại" : "d left"}
              </Badge>
            </div>
            <div className="mt-2 font-semibold text-tasco-ink">{vehicle.plate}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              TNDS · {formatVnd(policy.premiumVnd)}
            </p>
            <Link href={`/chat/${customerId}`} className="mt-3 block">
              <Button className="w-full">
                {locale === "vi" ? "Gia hạn trong chat" : "Renew in chat"}
              </Button>
            </Link>
            <Link href="/office" className="mt-2 block">
              <Button className="w-full" variant="outline">
                {dict.chrome.office}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
