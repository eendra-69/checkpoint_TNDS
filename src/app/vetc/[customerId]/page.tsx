import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requirePermission } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { daysUntil, formatVnd } from "@/lib/utils";
import { notFound } from "next/navigation";

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
  const policy = session.policies.find((p) => p.customerId === customerId)!;
  const vehicle = session.vehicles.find((v) => v.id === policy.vehicleId)!;
  const days = daysUntil(policy.expiresAt);

  return (
    <AppShell title="VETC App" subtitle="Second entry point into the same renewal agent.">
      <div className="mx-auto max-w-sm overflow-hidden rounded-[2rem] border-[8px] border-tasco-deep bg-white shadow-2xl">
        <div className="bg-vetc-green px-4 py-5 text-white">
          <div className="text-xs opacity-80">VETC</div>
          <div className="text-lg font-semibold">Xin chào, {customer.fullNameVi}</div>
        </div>
        <div className="space-y-3 p-4">
          <div className="rounded-2xl border bg-tasco-pale/50 p-4">
            <div className="text-xs text-muted-foreground">E-tag balance</div>
            <div className="text-xl font-semibold tabular-nums">₫ 245.000</div>
          </div>
          <div className="rounded-2xl border-2 border-vetc-green/40 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Badge tone="green">Renewal</Badge>
              <Badge tone="warn">{days}d left</Badge>
            </div>
            <h2 className="mt-2 font-semibold text-tasco-deep">
              TNDS · {vehicle.plate}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Regulated premium {formatVnd(policy.premiumVnd)}
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Assumption: VETC in-app banner slot
            </p>
            <Link href={`/chat/${customerId}`} className="mt-3 block">
              <Button className="w-full bg-vetc-green hover:brightness-95">
                Gia hạn ngay
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}