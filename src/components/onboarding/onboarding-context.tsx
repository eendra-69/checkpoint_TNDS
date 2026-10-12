"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { PersonaId } from "@/lib/types";
import {
  onboardingUi,
  stepsFor,
  storageKeyFor,
  type OnboardingLocale,
  type OnboardingStep,
} from "@/lib/onboarding-steps";

type Kind = "guest" | "customer" | "staff";

type Ctx = {
  open: boolean;
  stepIndex: number;
  steps: OnboardingStep[];
  kind: Kind;
  locale: OnboardingLocale;
  ui: (typeof onboardingUi)[OnboardingLocale];
  locksOffice: boolean;
  start: (force?: boolean) => void;
  next: () => void;
  back: () => void;
  skip: () => void;
  close: () => void;
};

const OnboardingContext = createContext<Ctx | null>(null);

function readDone(key: string) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return true;
  }
}

function writeDone(key: string) {
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

export function OnboardingProvider({
  persona,
  locale = "vi",
  children,
}: {
  persona: PersonaId | null;
  locale?: OnboardingLocale;
  children: React.ReactNode;
}) {
  const kind: Kind = !persona
    ? "guest"
    : persona === "customer"
      ? "customer"
      : "staff";
  const key = storageKeyFor(kind, persona || undefined);
  const steps = useMemo(() => stepsFor(kind, locale), [kind, locale]);
  const ui = onboardingUi[locale];

  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const done = readDone(key);
    if (!done) {
      setStepIndex(0);
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [key]);

  const finish = useCallback(() => {
    writeDone(key);
    setOpen(false);
    setStepIndex(0);
  }, [key]);

  const start = useCallback(
    (force = true) => {
      if (!force && readDone(key)) return;
      setStepIndex(0);
      setOpen(true);
    },
    [key],
  );

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i >= steps.length - 1) {
        finish();
        return 0;
      }
      return i + 1;
    });
  }, [finish, steps.length]);

  const back = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const value: Ctx = {
    open: ready && open,
    stepIndex,
    steps,
    kind,
    locale,
    ui,
    locksOffice: ready && open && kind === "customer",
    start,
    next,
    back,
    skip: finish,
    close: finish,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
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
