import { AppShell } from "@/components/app-shell";
import { VoiceCall } from "@/components/voice/voice-call";
import { requirePermission } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function CallPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const auth = await requirePermission("voice:use");
  const { customerId } = await params;
  const session = await getOrCreateSession(auth.sessionId);
  const customer = session.customers.find((c) => c.id === customerId);
  if (!customer) notFound();

  if (auth.persona === "customer" && auth.customerId) {
    const allowed = session.customers.find((c) => c.demoKey === auth.customerId);
    if (!allowed || allowed.id !== customerId) {
      redirect(`/call/${allowed?.id || customerId}`);
    }
  }
  const vehicle = session.vehicles.find((v) => v.customerId === customerId)!;
  const policy = session.policies.find((p) => p.customerId === customerId)!;
  const hasEleven =
    Boolean(session.settings.elevenLabsApiKey) ||
    Boolean(process.env.ELEVENLABS_API_KEY);
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <AppShell title={dict.call.title} subtitle={dict.call.subtitle}>
      <VoiceCall
        customerId={customer.id}
        customerName={customer.fullNameVi}
        plate={vehicle.plate}
        expiresAt={policy.expiresAt}
        hasCallConsent={customer.consent.calls}
        engine={hasEleven ? "elevenlabs" : "webspeech"}
        locale={locale}
        labels={dict.voice}
      />
    </AppShell>
  );
}
