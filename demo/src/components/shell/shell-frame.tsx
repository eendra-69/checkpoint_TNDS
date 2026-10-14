"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  Building2,
  Coffee,
  FileText,
  GitBranch,
  Headset,
  Home,
  Menu,
  RefreshCw,
  Settings,
  ShieldCheck,
  TrendingUp,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ShellControls } from "@/components/shell/shell-controls";
import type { Locale } from "@/lib/i18n/locale";

export type ShellNavItem = {
  href: string;
  label: string;
  icon: "home" | "office" | "workshop" | "lounge" | "ops" | "agent" | "compliance" | "metrics" | "admin" | "workflow" | "renewal" | "claim";
};

const ICONS: Record<ShellNavItem["icon"], typeof Home> = {
  home: Home,
  office: Building2,
  workshop: Wrench,
  lounge: Coffee,
  ops: BarChart3,
  agent: Headset,
  compliance: ShieldCheck,
  metrics: TrendingUp,
  admin: Settings,
  workflow: GitBranch,
  renewal: RefreshCw,
  claim: FileText,
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({
  items,
  pathname,
  onNavigate,
}: {
  items: ShellNavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-r-xl px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-white/12 text-white"
                : "text-white/70 hover:bg-white/8 hover:text-white",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "nav-rail absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full transition-opacity",
                active ? "opacity-100" : "opacity-0",
              )}
            />
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function ShellFrame({
  items,
  brand,
  personaLabel,
  profile,
  actions,
  locale,
  title,
  subtitle,
  compact,
  bleed,
  children,
}: {
  items: ShellNavItem[];
  brand: { name: string; tagline: string };
  personaLabel?: string;
  profile?: ReactNode;
  /** Identity and account controls, shown in the sidebar footer. */
  actions: ReactNode;
  locale: Locale;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  bleed?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  // Derived rather than effect-driven: the drawer is considered open only while
  // the route it was opened on is still current, so any navigation closes it
  // without a setState-in-effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn !== null && openedOn === pathname;
  const setOpen = useCallback(
    (next: boolean) => setOpenedOn(next ? pathname : null),
    [pathname],
  );

  // Escape closes the drawer.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenedOn(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const sidebarInner = (
    <>
      <Link href="/" className="flex items-center gap-3 px-4 py-4 text-white">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tasco-lime-bright font-display text-sm font-bold tracking-tight text-tasco-ink">
          T
        </div>
        <div className="min-w-0">
          <div className="font-display text-sm font-semibold tracking-[0.16em]">
            {brand.name}
          </div>
          <div className="truncate text-xs text-white/70">{brand.tagline}</div>
        </div>
      </Link>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <NavList
          items={items}
          pathname={pathname}
          onNavigate={() => setOpen(false)}
        />
      </div>

      <div className="border-t border-white/10 px-4 py-3">
        {profile && <div className="mb-2">{profile}</div>}
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/50">
          {personaLabel ?? ""}
        </div>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop rail */}
      <aside className="sidebar-surface sticky top-0 hidden h-screen w-64 shrink-0 flex-col text-white lg:flex">
        {sidebarInner}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-tasco-ink/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="sidebar-surface absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col text-white shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarInner}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* One bar for every breakpoint: brand + menu on mobile, and the
            language/tour frame pinned right on all sizes. Desktop used to have
            no top bar at all, which is why these controls lived in the sidebar
            footer. The 3D worlds reserve 100vh - 4.5rem, so a ~3.5rem bar
            keeps them from overflowing. */}
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-tasco-ink px-3 py-2 text-sm font-semibold text-white lg:hidden"
          >
            <Menu className="h-4 w-4" />
            Menu
          </button>
          <span className="font-display text-sm font-semibold tracking-[0.16em] text-tasco-ink lg:hidden">
            {brand.name}
          </span>
          <div className="ml-auto">
            <ShellControls locale={locale} tone="light" />
          </div>
        </div>

        {(title || subtitle) && !bleed && (
          <div className={cn("px-4 sm:px-6", compact ? "pt-2" : "pt-4")}>
            {title && (
              <h1 className="font-display text-2xl font-semibold tracking-tight text-tasco-ink sm:text-3xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}

        <main
          className={cn(
            "min-w-0 flex-1",
            bleed ? "relative flex min-h-0 flex-col" : "mx-auto w-full max-w-7xl px-4 py-6 sm:px-6",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
