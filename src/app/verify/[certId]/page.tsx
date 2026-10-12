import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { getAuth } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { formatVnd } from "@/lib/utils";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ certId: string }>;
}) {
  const { certId } = await params;
  const auth = await getAuth();
  // Public verify — use any session if logged in, else create ephemeral lookup from memory is hard.
  // Certificates live in the visitor session; require login for demo fidelity.
  if (!auth) {
    return (
      <AppShell title="Certificate verify">
        <div className="rounded-2xl border bg-card p-6 text-sm">
          Sign in to verify certificates from your demo session.{" "}
          <a className="font-semibold text-tasco-sky" href="/login">
            Sign in
          </a>
        </div>
      </AppShell>
    );
  }

  const session = await getOrCreateSession(auth.sessionId);
  const cert = session.certificates.find((c) => c.id === certId);
  if (!cert) notFound();

  const customer = session.customers.find((c) => c.id === cert.customerId)!;
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify/${cert.id}`;
  const qr = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 180 });

  return (
    <AppShell title="Digital TNDS certificate" subtitle="Instantly verifiable proof — impossible to leave at home.">
      <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border bg-card shadow-lg">
        <div className="hero-gradient px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/70">TNDS</div>
              <div className="text-xl font-semibold">Giấy chứng nhận điện tử</div>
            </div>
            <Badge tone="green">Valid</Badge>
          </div>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Certificate ID</div>
              <div className="font-mono text-sm font-semibold">{cert.id}</div>
              <div className="mt-3 text-xs text-muted-foreground">Vehicle</div>
              <div className="text-lg font-semibold text-tasco-deep">{cert.plate}</div>
              <div className="text-sm text-muted-foreground">{customer.fullNameVi}</div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="Verify QR" className="rounded-xl border" />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-tasco-pale/60 p-3">
              <div className="text-xs text-muted-foreground">Issued</div>
              <div className="font-medium">{cert.issuedAt.slice(0, 10)}</div>
            </div>
            <div className="rounded-xl bg-tasco-pale/60 p-3">
              <div className="text-xs text-muted-foreground">Expires</div>
              <div className="font-medium">{cert.expiresAt.slice(0, 10)}</div>
            </div>
            <div className="rounded-xl bg-tasco-pale/60 p-3">
              <div className="text-xs text-muted-foreground">Premium paid</div>
              <div className="font-medium tabular-nums">{formatVnd(cert.premiumVnd)}</div>
            </div>
            <div className="rounded-xl bg-tasco-pale/60 p-3">
              <div className="text-xs text-muted-foreground">Insurer</div>
              <div className="font-medium">{cert.insurer}</div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Assumption: insurer issuance API · DEMO synthetic data
          </p>
        </div>
      </div>
    </AppShell>
  );
}