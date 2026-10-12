import Link from "next/link";
import { getAuth } from "@/lib/auth";
import { getCustomerUiMode } from "@/lib/customer-mode";
import { getSession } from "@/lib/session";
import { PERSONAS, hasPermission, type Permission } from "@/lib/rbac";
import { PersonaPill } from "@/components/persona-pill";
import { DemoWatermark } from "@/components/demo-watermark";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; permission?: Permission }[] = [
  { href: "/", label: "Home" },
  { href: "/ops", label: "Ops", permission: "ops:view" },
  { href: "/agent", label: "Telesales", permission: "agent:view" },
  { href: "/compliance", label: "Compliance", permission: "compliance:view" },
  { href: "/metrics", label: "Metrics", permission: "metrics:view" },
  { href: "/admin", label: "Admin", permission: "settings:manage" },
  { href: "/admin/workflow", label: "Workflow", permission: "workflow:view" },
];

export async function AppShell({
  children,
  title,
  subtitle,
  compact = false,
  bleed = false,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  bleed?: boolean;
}) {
  const auth = await getAuth();
  const session = auth ? await getSession(auth.sessionId) : null;
  const overrides = session?.settings.permissionOverrides;
  const uiMode = await getCustomerUiMode();
  const isCustomer = auth?.persona === "customer";

  const links = NAV.filter((item) => {
    if (!item.permission) return true;
    if (!auth) return false;
    return hasPermission(auth.persona, item.permission, overrides);
  });

  return (
    <div className={cn("min-h-screen", bleed && "flex flex-col")}>
      <header className="hero-gradient text-white">
        <div
          className={cn(
            "mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:px-6",
            compact ? "py-3" : "py-4",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 font-display text-sm font-bold tracking-tight">
                T
              </div>
              <div>
                <div className="font-display text-sm font-semibold tracking-[0.16em]">
                  TASCO
                </div>
                <div className="text-xs text-white/70">Renewal Journey Demo</div>
              </div>
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              {isCustomer && <ModeToggle mode={uiMode} />}
              {auth ? (
                <PersonaPill auth={auth} />
              ) : (
                <Link
                  href="/login"
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-tasco-deep"
                >
                  Sign in as…
                </Link>
              )}
            </div>
          </div>
          {(title || subtitle) && !bleed && (
            <div>
              {title && (
                <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 max-w-2xl text-sm text-white/75">{subtitle}</p>
              )}
            </div>
          )}
          {!isCustomer && (
            <nav className="flex flex-wrap gap-1 border-t border-white/10 pt-3">
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
              {auth && (
                <span className="ml-auto self-center text-xs text-white/50">
                  {PERSONAS[auth.persona].label}
                </span>
              )}
            </nav>
          )}
        </div>
      </header>
      <main
        className={cn(
          bleed
            ? "relative flex min-h-0 flex-1 flex-col"
            : "mx-auto max-w-7xl px-4 py-6 sm:px-6",
        )}
      >
        {children}
      </main>
      <DemoWatermark />
    </div>
  );
}
