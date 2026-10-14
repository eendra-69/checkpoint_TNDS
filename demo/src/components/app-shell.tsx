import { getAuth } from "@/lib/auth";
import { getCustomerUiMode } from "@/lib/customer-mode";
import { getSession } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { PersonaPill } from "@/components/persona-pill";
import { DemoWatermark } from "@/components/demo-watermark";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { OnboardingHost } from "@/components/onboarding/onboarding-host";
import { ShellTourButton } from "@/components/onboarding/shell-tour-button";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ShellFrame, type ShellNavItem } from "@/components/shell/shell-frame";
import { DisplayNameEditor } from "@/components/shell/display-name-editor";

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
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const isCustomer = auth?.persona === "customer";

  const NAV: (ShellNavItem & { permission?: Parameters<typeof hasPermission>[1] })[] = [
    { href: "/", label: dict.nav.home, icon: "home" },
    { href: "/office", label: dict.nav.office, icon: "office", permission: "chat:use" },
    { href: "/workshop", label: dict.nav.workshop, icon: "workshop", permission: "workshop:use" },
    { href: "/lounge", label: dict.nav.lounge, icon: "lounge", permission: "lounge:use" },
    { href: "/ops", label: dict.nav.ops, icon: "ops", permission: "ops:view" },
    { href: "/agent", label: dict.nav.agent, icon: "agent", permission: "agent:view" },
    { href: "/compliance", label: dict.nav.compliance, icon: "compliance", permission: "compliance:view" },
    { href: "/metrics", label: dict.nav.metrics, icon: "metrics", permission: "metrics:view" },
    { href: "/admin/workflow", label: dict.nav.workflow, icon: "workflow", permission: "workflow:view" },
    { href: "/admin", label: dict.nav.admin, icon: "admin", permission: "settings:manage" },
  ];

  const items: ShellNavItem[] = NAV.filter((item) => {
    if (!item.permission) return true;
    if (!auth) return false;
    // Customers only roam the three worlds plus home; staff screens stay hidden.
    if (isCustomer) {
      return ["/", "/office", "/workshop", "/lounge"].includes(item.href);
    }
    return hasPermission(auth.persona, item.permission, overrides);
  }).map(({ href, label, icon }) => ({ href, label, icon }));

  return (
    <OnboardingHost persona={auth?.persona ?? null} locale={locale}>
      <ShellFrame
        items={items}
        brand={{ name: "TASCO", tagline: "Renewal Journey Demo" }}
        personaLabel={auth ? PERSONA_LABEL[auth.persona] : undefined}
        profile={
          auth ? (
            <DisplayNameEditor
              persona={auth.persona}
              displayName={auth.displayName}
            />
          ) : null
        }
        title={title}
        subtitle={subtitle}
        compact={compact}
        bleed={bleed}
        actions={
          <>
            <LanguageToggle locale={locale} />
            <ShellTourButton />
            {isCustomer && <ModeToggle mode={uiMode} labels={dict.chrome} />}
            {auth ? (
              <PersonaPill auth={auth} labels={dict.personaPill} />
            ) : (
              <a
                href="/login"
                className="rounded-full bg-tasco-lime-bright px-4 py-2 text-sm font-semibold text-tasco-ink"
              >
                {dict.chrome.signIn}
              </a>
            )}
          </>
        }
      >
        {children}
      </ShellFrame>
      <DemoWatermark label={dict.chrome.demoWatermark} />
    </OnboardingHost>
  );
}

const PERSONA_LABEL: Record<string, string> = {
  customer: "Customer",
  telesales: "Telesales",
  campaign_manager: "Campaign manager",
  compliance: "Compliance",
  executive: "Executive",
  admin: "Admin",
};
