"use client";

import { OnboardingTourButton } from "./onboarding-tour";
import type { ControlsTone } from "@/components/shell/shell-controls";

export function ShellTourButton({ tone = "dark" }: { tone?: ControlsTone }) {
  return <OnboardingTourButton tone={tone} />;
}
