import type { PersonaId } from "./types";

export type OnboardingLocale = "vi" | "en";

export type OnboardingStep = {
  id: string;
  title: string;
  body: string;
  hint?: string;
};

// Persona intros, shown once per persona on first visit. Page-specific tours live in page-tours.ts.
const guest = {
  vi: [
    {
      id: "welcome",
      title: "Chào mừng đến Tasco Demo",
      body: "Đây là hành trình gia hạn TNDS cho BeyondPilot × Tasco — lead scoring, chat AI, Virtual Office, và RBAC theo persona.",
      hint: "Không cần mật khẩu",
    },
  ],
  en: [
    {
      id: "welcome",
      title: "Welcome to the Tasco Demo",
      body: "This is the TNDS renewal journey for BeyondPilot × Tasco — lead scoring, AI chat, Virtual Office, and persona RBAC.",
      hint: "No passwords",
    },
  ],
} as const satisfies Record<OnboardingLocale, OnboardingStep[]>;

const customer = {
  vi: [
    {
      id: "customer-welcome",
      title: "Bạn là khách hàng demo",
      body: "Gia hạn TNDS của bạn trong Virtual Office (văn phòng game HD-2D) hoặc Classic (chat Zalo, ứng dụng VETC, cuộc gọi AI).",
    },
    {
      id: "toggle",
      title: "Classic ↔ Virtual Office",
      body: "Dùng nút trên header để chuyển giữa văn phòng game và chat Zalo/VETC bất cứ lúc nào.",
    },
  ],
  en: [
    {
      id: "customer-welcome",
      title: "You're a demo customer",
      body: "Renew your TNDS in the Virtual Office (an HD-2D game office) or in Classic (Zalo chat, VETC app, AI voice call).",
    },
    {
      id: "toggle",
      title: "Classic ↔ Virtual Office",
      body: "Use the header toggle anytime to switch between the office game and Zalo/VETC chat.",
    },
  ],
} as const satisfies Record<OnboardingLocale, OnboardingStep[]>;

const staffBase = {
  vi: [
    {
      id: "staff-welcome",
      title: "Chế độ nội bộ",
      body: "Bạn đang xem demo với RBAC thật — mỗi persona chỉ thấy màn hình và dữ liệu được phép.",
    },
    {
      id: "nav",
      title: "Điều hướng",
      body: "Dùng menu trên header. Floating assistant (nút AI) giải thích ngữ cảnh theo quyền của bạn.",
    },
    {
      id: "reset",
      title: "Reset demo",
      body: "Nút Reset demo làm mới session synthetic. Switch persona bất cứ lúc nào từ pill góc phải.",
    },
  ],
  en: [
    {
      id: "staff-welcome",
      title: "Internal mode",
      body: "You’re in the staff demo with real RBAC — each persona only sees allowed screens and fields.",
    },
    {
      id: "nav",
      title: "Navigation",
      body: "Use the header menu. The floating AI assistant explains context within your permissions.",
    },
    {
      id: "reset",
      title: "Reset demo",
      body: "Reset demo refreshes the synthetic session. Switch personas anytime from the top-right pill.",
    },
  ],
} as const satisfies Record<OnboardingLocale, OnboardingStep[]>;

export function storageKeyFor(
  kind: "guest" | "customer" | "staff",
  persona?: PersonaId,
) {
  if (kind === "staff" && persona) return `tasco-onboard:staff:${persona}`;
  if (kind === "customer") return "tasco-onboard:customer";
  return "tasco-onboard:guest";
}

const tourTip = {
  vi: {
    id: "tour-button",
    title: "Nút Tour",
    body: "Bấm Tour trên header ở bất kỳ trang nào để xem trang đó dùng để làm gì. Tiếp theo là trang bạn đang mở.",
  },
  en: {
    id: "tour-button",
    title: "The Tour button",
    body: "Press Tour in the header on any page to see what that page is for. Next up: the page you are on.",
  },
} as const satisfies Record<OnboardingLocale, OnboardingStep>;

/** First-visit intro for a persona kind, ending with a pointer to the Tour button. */
export function introStepsFor(
  kind: "guest" | "customer" | "staff",
  locale: OnboardingLocale = "vi",
): OnboardingStep[] {
  const intro = kind === "guest" ? guest : kind === "customer" ? customer : staffBase;
  return [...intro[locale], tourTip[locale]];
}

export const onboardingUi = {
  vi: {
    next: "Tiếp",
    back: "Lại",
    skip: "Bỏ qua",
    done: "Bắt đầu",
    tour: "Tour",
    progress: (i: number, n: number) => `Bước ${i}/${n}`,
  },
  en: {
    next: "Next",
    back: "Back",
    skip: "Skip",
    done: "Let’s go",
    tour: "Tour",
    progress: (i: number, n: number) => `Step ${i}/${n}`,
  },
} as const;
