import { AppShell } from "@/components/app-shell";
import { RenewalChat } from "@/components/chat/renewal-chat";
import { requirePermission } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
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
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <AppShell title={dict.chat.title} subtitle={dict.chat.subtitle}>
      <RenewalChat
        customerId={customer.id}
        customerName={customer.fullNameVi}
        plate={vehicle.plate}
        expiresAt={policy.expiresAt}
        premiumVnd={policy.premiumVnd}
        incomplete={vehicle.incomplete}
        initialCertificateId={policy.certificateId}
        locale={locale}
        labels={dict.chat}
      />
    </AppShell>
  );
}
