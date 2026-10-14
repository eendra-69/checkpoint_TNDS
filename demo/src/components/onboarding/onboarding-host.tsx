"use client";

import type { PersonaId } from "@/lib/types";
import { OnboardingProvider } from "./onboarding-context";
import { OnboardingTour } from "./onboarding-tour";

export function OnboardingHost({
  persona,
  locale = "vi",
  children,
}: {
  persona: PersonaId | null;
  locale?: "vi" | "en";
  children?: React.ReactNode;
}) {
  return (
    <OnboardingProvider persona={persona} locale={locale}>
      {children}
      <OnboardingTour />
    </OnboardingProvider>
  );
}
