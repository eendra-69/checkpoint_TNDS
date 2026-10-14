"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import type { PersonaId } from "@/lib/types";
import { pageStepsFor } from "@/lib/page-tours";
import {
  introStepsFor,
  onboardingUi,
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
  /** JRPG window styling: only inside the Virtual Office. */
  jrpg: boolean;
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

const subscribeNever = () => () => {};

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
  const pathname = usePathname();
  // "intro": first visit for this persona (intro, then this page). "page": the Tour button.
  const [mode, setMode] = useState<"intro" | "page">("intro");
  const steps = useMemo(() => {
    const page = pageStepsFor(pathname, locale);
    if (mode === "page" && page.length > 0) return page;
    return [...introStepsFor(kind, locale), ...page];
  }, [mode, pathname, kind, locale]);
  const ui = onboardingUi[locale];
  const onOffice = pathname === "/office" || pathname.startsWith("/office/");

  // False during SSR and hydration, true afterwards: the tour only ever renders client-side,
  // so reading localStorage below cannot cause a hydration mismatch.
  const ready = useSyncExternalStore(subscribeNever, () => true, () => false);
  const autoOpen = () => typeof window !== "undefined" && !readDone(key);
  const [open, setOpen] = useState(autoOpen);
  const [stepIndex, setStepIndex] = useState(0);

  // Persona changed without a remount: show that persona's first-visit intro if unseen.
  const [shownFor, setShownFor] = useState(key);
  if (shownFor !== key) {
    setShownFor(key);
    setMode("intro");
    setStepIndex(0);
    setOpen(autoOpen());
  }

  const finish = useCallback(() => {
    writeDone(key);
    setOpen(false);
    setStepIndex(0);
  }, [key]);

  const start = useCallback(
    (force = true) => {
      if (!force && readDone(key)) return;
      setMode("page");
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
    jrpg: onOffice,
    locale,
    ui,
    locksOffice: ready && open && onOffice,
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
