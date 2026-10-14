"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { PersonaId } from "@/lib/types";
import { pageStepsFor } from "@/lib/page-tours";
import { onboardingUi, type OnboardingLocale, type OnboardingStep } from "@/lib/onboarding-steps";

type Kind = "guest" | "customer" | "staff";

/*
 * The header Tour button explains the page that is open (src/lib/page-tours.ts).
 * There is no automatic first-visit overlay: signing in lands on the persona welcome
 * screen, which is the introduction, so an overlay on top of it would be a second one.
 */
type Ctx = {
  open: boolean;
  stepIndex: number;
  steps: OnboardingStep[];
  kind: Kind;
  /** JRPG window styling: only inside the Virtual Office. */
  jrpg: boolean;
  locale: OnboardingLocale;
  ui: (typeof onboardingUi)[OnboardingLocale];
  locksOffice: boolean;
  start: () => void;
  next: () => void;
  back: () => void;
  skip: () => void;
  close: () => void;
};

const OnboardingContext = createContext<Ctx | null>(null);

export function OnboardingProvider({
  persona,
  locale = "vi",
  children,
}: {
  persona: PersonaId | null;
  locale?: OnboardingLocale;
  children: React.ReactNode;
}) {
  const kind: Kind = !persona ? "guest" : persona === "customer" ? "customer" : "staff";
  const pathname = usePathname();
  const steps = useMemo(() => pageStepsFor(pathname, locale), [pathname, locale]);
  const ui = onboardingUi[locale];
  const onOffice = pathname === "/office" || pathname.startsWith("/office/");

  // Starts closed and only opens from a click, so server and client render the same.
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const finish = useCallback(() => {
    setOpen(false);
    setStepIndex(0);
  }, []);

  const start = useCallback(() => {
    if (steps.length === 0) return;
    setStepIndex(0);
    setOpen(true);
  }, [steps.length]);

  const next = useCallback(() => {
    if (stepIndex >= steps.length - 1) finish();
    else setStepIndex(stepIndex + 1);
  }, [finish, stepIndex, steps.length]);

  const back = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const value: Ctx = {
    open,
    stepIndex,
    steps,
    kind,
    jrpg: onOffice,
    locale,
    ui,
    locksOffice: open && onOffice,
    start,
    next,
    back,
    skip: finish,
    close: finish,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return ctx;
}

export function useOnboardingOptional() {
  return useContext(OnboardingContext);
}
