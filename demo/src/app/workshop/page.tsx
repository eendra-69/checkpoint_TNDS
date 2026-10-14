import { AppShell } from "@/components/app-shell";
import { WorkshopExperience } from "@/components/workshop/WorkshopExperience";
import type { WorkshopVehicle } from "@/components/workshop/InspectionPanel";
import { requirePermission } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { getDemoCustomerId } from "@/lib/data/seed";
import { getLocale } from "@/lib/i18n/locale";
import { redirect } from "next/navigation";

export default async function WorkshopPage() {
  const auth = await requirePermission("workshop:use");

  const session = await getOrCreateSession(auth.sessionId);
  // Customers browse their own car; staff browse the demo driver's car.
  const customerId = getDemoCustomerId(
    auth.persona === "customer" ? auth.customerId || "minh" : "minh",
  );

  const customer = session.customers.find((c) => c.id === customerId);
  const vehicle = session.vehicles.find((v) => v.customerId === customerId);
  const policy = session.policies.find((p) => p.customerId === customerId);
  if (!customer || !vehicle || !policy) redirect("/login");

  const claims = session.claims.filter((c) => c.customerId === customerId);
  const locale = await getLocale();

  const vehicleView: WorkshopVehicle = {
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    plate: vehicle.plate,
    vehicleType: vehicle.vehicleType,
    expiresAt: policy.expiresAt,
  };

  return (
    <AppShell compact bleed>
      <WorkshopExperience
        customerName={customer.fullNameVi}
        vehicle={vehicleView}
        claims={claims}
        locale={locale}
      />
    </AppShell>
  );
}
