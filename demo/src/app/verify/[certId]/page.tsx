import Image from "next/image";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { getAuth } from "@/lib/auth";
import { maskCustomer } from "@/lib/masking";
import { getOrCreateSession } from "@/lib/session";
import { formatDate, formatVnd } from "@/lib/utils";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PILOT_INSURER } from "@/lib/data/seed";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ certId: string }>;
}) {
  const { certId } = await params;
  const auth = await getAuth();
  const locale = await getLocale();
  const dict = getDictionary(locale);

  if (!auth) {
    return (
      <AppShell title={dict.verify.title}>
        <div className="rounded-2xl border bg-card p-6 text-sm">
          {dict.verify.signInNeeded}{" "}
          <a className="font-semibold text-tasco-lime" href="/login">
            {dict.verify.signIn}
          </a>
        </div>
      </AppShell>
    );
  }

  const session = await getOrCreateSession(auth.sessionId);
  const cert = session.certificates.find((c) => c.id === certId);
  if (!cert) notFound();

  const rawCustomer = session.customers.find((c) => c.id === cert.customerId);
  if (!rawCustomer) notFound();

  // Route through the same masking layer as every other surface. This page
  // used to read `customer.fullNameVi` straight off the session, which let an
  // executive or campaign manager read any full name by visiting /verify/<id>.
  const customer = maskCustomer(rawCustomer, auth.persona);
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify/${cert.id}`;
  const qr = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 180 });

  return (
    <AppShell title={dict.verify.title} subtitle={dict.verify.subtitle}>
      <div className="relative mx-auto max-w-lg overflow-hidden rounded-2xl border shadow-lg">
        <Image
          src="/brand/cert-texture.jpg"
          alt=""
          fill
          className="object-cover opacity-40"
          sizes="512px"
        />
        <div className="relative">
          <div className="hero-gradient px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-xs uppercase tracking-[0.2em] text-white/70">
                  TASCO · TNDS
                </div>
                <div className="font-display text-xl font-semibold">
                  {locale === "vi"
                    ? "Giấy chứng nhận điện tử"
                    : "Digital certificate"}
                </div>
              </div>
              <Badge tone="green">{dict.verify.valid}</Badge>
            </div>
          </div>
          <div className="space-y-4 bg-white/90 p-6 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-muted-foreground">{dict.verify.certificateId}</div>
                <div className="font-mono text-sm font-semibold">{cert.id}</div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {locale === "vi" ? "Xe" : "Vehicle"}
                </div>
                <div className="font-display text-lg font-semibold text-tasco-ink">
                  {cert.plate}
                </div>
                <div className="text-sm text-muted-foreground">
                  {customer.fullNameVi}
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="Verify QR" className="rounded-xl border bg-white" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-tasco-mist/70 p-3">
                <div className="text-xs text-muted-foreground">{dict.verify.issued}</div>
                <div className="font-medium">{formatDate(cert.issuedAt)}</div>
              </div>
              <div className="rounded-xl bg-tasco-mist/70 p-3">
                <div className="text-xs text-muted-foreground">{dict.verify.expires}</div>
                <div className="font-medium">{formatDate(cert.expiresAt)}</div>
              </div>
              <div className="rounded-xl bg-tasco-mist/70 p-3">
                <div className="text-xs text-muted-foreground">{dict.verify.premium}</div>
                <div className="font-medium tabular-nums">
                  {formatVnd(cert.premiumVnd)}
                </div>
              </div>
              <div className="rounded-xl bg-tasco-mist/70 p-3">
                <div className="text-xs text-muted-foreground">{dict.verify.insurer}</div>
                <div className="font-medium">
                  {cert.insurer === PILOT_INSURER ? dict.verify.pilotInsurer : cert.insurer}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Assumption: insurer issuance API · DEMO synthetic data
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
