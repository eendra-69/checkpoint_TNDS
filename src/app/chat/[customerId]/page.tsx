import { AppShell } from "@/components/app-shell";
import { RenewalChat } from "@/components/chat/renewal-chat";
import { requirePermission } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";

export default async function ChatPage({
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
      redirect(`/chat/${allowed?.id || customerId}`);
    }
  }

  const policy = session.policies.find((p) => p.customerId === customerId)!;
  const vehicle = session.vehicles.find((v) => v.id === policy.vehicleId)!;

  return (
    <AppShell
      title="Zalo renewal chat"
      subtitle="Simulated Official Account + ZNS. Regulated premium only — no discounts."
    >
      <RenewalChat
        customerId={customer.id}
        customerName={customer.fullNameVi}
        plate={vehicle.plate}
        expiresAt={policy.expiresAt}
        premiumVnd={policy.premiumVnd}
        incomplete={vehicle.incomplete}
        initialCertificateId={policy.certificateId}
      />
    </AppShell>
  );
}