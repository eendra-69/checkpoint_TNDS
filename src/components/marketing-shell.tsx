import Link from "next/link";
import { getAuth } from "@/lib/auth";
import { PersonaPill } from "@/components/persona-pill";
import { DemoWatermark } from "@/components/demo-watermark";
import { OnboardingHost } from "@/components/onboarding/onboarding-host";
import { ShellTourButton } from "@/components/onboarding/shell-tour-button";
import { LanguageToggle } from "@/components/language-toggle";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function MarketingShell({
  children,
  transparent = false,
}: {
  children: React.ReactNode;
  transparent?: boolean;
}) {
  const auth = await getAuth();
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <OnboardingHost persona={auth?.persona ?? null} locale={locale}>
      <div className="min-h-screen">
        <header
          className={
            transparent
              ? "absolute inset-x-0 top-0 z-20"
              : "hero-gradient text-white"
          }
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
            <Link href="/" className="flex items-center gap-3 text-white">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 font-display text-lg font-bold tracking-tight">
                T
              </div>
              <div>
                <div className="font-display text-base font-semibold tracking-[0.18em]">
                  TASCO
                </div>
                <div className="text-[11px] text-white/70">BeyondPilot Demo</div>
              </div>
            </Link>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <LanguageToggle locale={locale} />
              <ShellTourButton />
              {auth ? (
                <PersonaPill
                  auth={auth}
                  labels={dict.personaPill}
                  personaLabel={dict.personas[auth.persona].label}
                />
              ) : (
                <Link
                  href="/login"
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-tasco-deep shadow-sm"
                >
                  {dict.chrome.signIn}
                </Link>
              )}
            </div>
          </div>
        </header>
        {children}
        <DemoWatermark label={dict.chrome.demoWatermark} />
      </div>
    </OnboardingHost>
  );
}
