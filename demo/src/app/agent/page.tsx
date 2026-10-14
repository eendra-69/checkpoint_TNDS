import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { maskCustomer } from "@/lib/masking";
import {
  logOutcome,
  revealPii,
  sendRenewalLink,
} from "@/app/actions/telesales";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function AgentPage() {
  const auth = await requirePermission("agent:view");
  const session = await getOrCreateSession(auth.sessionId);
  const queue = session.handovers.filter((h) => h.status !== "resolved");
  const dict = getDictionary(await getLocale());

  return (
    <AppShell
      title={dict.agent.title}
      subtitle={dict.agent.subtitle}
      compact
    >
      {queue.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No handovers yet. Sign in as Chị Lan (customer), ask for a human in chat/voice, or escalate from Minh&apos;s chat.
          </p>
          <Link href="/login" className="mt-4 inline-block">
            <Button variant="outline">Switch to customer</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {queue.map((ho) => {
            const customer = session.customers.find((c) => c.id === ho.customerId)!;
            const vehicle = session.vehicles.find((v) => v.customerId === ho.customerId)!;
            const revealed = session.revealedPii[customer.id] || [];
            const masked = maskCustomer(customer, auth.persona, revealed);
            return (
              <div key={ho.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="warn">{ho.status}</Badge>
                      <Badge tone="sky">from {ho.fromChannel}</Badge>
                      {ho.renewalLinkSent && <Badge tone="green">link sent</Badge>}
                    </div>
                    <h2 className="mt-2 text-lg font-semibold text-tasco-ink">
                      {masked.fullNameVi} · {vehicle.plate}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{ho.reason}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(ho.createdAt).toLocaleString("en-GB")}
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-tasco-mist/60 p-4 text-sm">
                  <div className="text-xs font-semibold uppercase tracking-wide text-tasco-lime">
                    AI summary
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{ho.summary}</p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border p-3 text-sm">
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="font-mono">{masked.phone}</div>
                    {masked._masked.phone && (
                      <form
                        className="mt-2 flex gap-2"
                        action={async (fd) => {
                          "use server";
                          await revealPii({
                            customerId: customer.id,
                            field: "phone",
                            reason: String(fd.get("reason") || "callback requested"),
                          });
                        }}
                      >
                        <input
                          name="reason"
                          defaultValue="callback requested"
                          className="h-8 flex-1 rounded-lg border px-2 text-xs"
                        />
                        <Button type="submit" size="sm" variant="outline">
                          Reveal
                        </Button>
                      </form>
                    )}
                  </div>
                  <div className="rounded-xl border p-3 text-sm">
                    <div className="text-xs text-muted-foreground">National ID</div>
                    <div className="font-mono">{masked.nationalId}</div>
                    {masked._masked.nationalId && (
                      <form
                        className="mt-2 flex gap-2"
                        action={async (fd) => {
                          "use server";
                          await revealPii({
                            customerId: customer.id,
                            field: "nationalId",
                            reason: String(fd.get("reason") || "identity check"),
                          });
                        }}
                      >
                        <input
                          name="reason"
                          defaultValue="identity check"
                          className="h-8 flex-1 rounded-lg border px-2 text-xs"
                        />
                        <Button type="submit" size="sm" variant="outline">
                          Reveal
                        </Button>
                      </form>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await sendRenewalLink({
                        customerId: customer.id,
                        handoverId: ho.id,
                      });
                    }}
                  >
                    <Button type="submit">Send renewal link</Button>
                  </form>
                  <Link href={`/chat/${customer.id}`}>
                    <Button type="button" variant="outline">
                      Open customer chat
                    </Button>
                  </Link>
                  {(
                    [
                      "link_sent",
                      "callback_requested",
                      "not_interested",
                      "renewed",
                    ] as const
                  ).map((code) => (
                    <form
                      key={code}
                      action={async () => {
                        "use server";
                        await logOutcome({
                          customerId: customer.id,
                          code,
                          handoverId: ho.id,
                        });
                      }}
                    >
                      <Button type="submit" size="sm" variant="secondary">
                        {code}
                      </Button>
                    </form>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}