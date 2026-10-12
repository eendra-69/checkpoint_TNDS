import { AppShell } from "@/components/app-shell";
import { OfficeExperience } from "@/components/office/OfficeExperience";
import { requirePermission } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { getDemoCustomerId } from "@/lib/data/seed";
import { redirect } from "next/navigation";
import type { OfficeStation } from "@/components/office/Stations";

export default async function OfficePage({
  searchParams,
}: {
  searchParams: Promise<{ station?: string }>;
}) {
  const auth = await requirePermission("chat:use");
  if (auth.persona !== "customer") {
    redirect("/");
  }

  const { station: stationParam } = await searchParams;
  const session = await getOrCreateSession(auth.sessionId);
  const customerId = getDemoCustomerId(auth.customerId || "minh");
  const customer = session.customers.find((c) => c.id === customerId);
  if (!customer) redirect("/login");

  const policy = session.policies.find((p) => p.customerId === customerId)!;
  const vehicle = session.vehicles.find((v) => v.id === policy.vehicleId)!;
  const claims = session.claims.filter((c) => c.customerId === customerId);

  const allowed: OfficeStation[] = ["cs", "claims", "admin", "vetc"];
  const initialStation =
    stationParam && allowed.includes(stationParam as OfficeStation)
      ? (stationParam as OfficeStation)
      : null;

  return (
    <AppShell compact bleed>
      <OfficeExperience
        customerId={customer.id}
        customerName={customer.fullNameVi}
        plate={vehicle.plate}
        caseState={session.caseStates[customer.id] || "scored"}
        claims={claims}
        consent={customer.consent}
        certificateId={policy.certificateId}
        initialStation={initialStation}
      />
    </AppShell>
  );
}
