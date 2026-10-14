export type OnboardingLocale = "vi" | "en";

/** One step of a page tour (`src/lib/page-tours.ts`). */
export type OnboardingStep = {
  id: string;
  title: string;
  body: string;
  hint?: string;
};

export const onboardingUi = {
  vi: {
    next: "Tiếp",
    back: "Lại",
    skip: "Bỏ qua",
    done: "Đã hiểu",
    tour: "Tour",
    progress: (i: number, n: number) => `Bước ${i}/${n}`,
  },
  en: {
    next: "Next",
    back: "Back",
    skip: "Skip",
    done: "Got it",
    tour: "Tour",
    progress: (i: number, n: number) => `Step ${i}/${n}`,
  },
} as const;
