import { AppShell } from "@/components/app-shell";
import { VoiceCall } from "@/components/voice/voice-call";
import { requirePermission } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { notFound } from "next/navigation";

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
  const vehicle = session.vehicles.find((v) => v.customerId === customerId)!;
  const policy = session.policies.find((p) => p.customerId === customerId)!;
  const hasEleven =
    Boolean(session.settings.elevenLabsApiKey) ||
    Boolean(process.env.ELEVENLABS_API_KEY);

  return (
    <AppShell
      title="AI voice bot"
      subtitle="Consent-based call. ElevenLabs if a key is set; otherwise free Web Speech."
    >
      <VoiceCall
        customerId={customer.id}
        customerName={customer.fullNameVi}
        plate={vehicle.plate}
        expiresAt={policy.expiresAt}
        hasCallConsent={customer.consent.calls}
        engine={hasEleven ? "elevenlabs" : "webspeech"}
      />
    </AppShell>
  );
}