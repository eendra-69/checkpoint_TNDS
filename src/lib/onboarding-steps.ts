import type { PersonaId } from "./types";

export type OnboardingLocale = "vi" | "en";

export type OnboardingStep = {
  id: string;
  title: string;
  body: string;
  hint?: string;
};

const guest = {
  vi: [
    {
      id: "welcome",
      title: "Chào mừng đến Tasco Demo",
      body: "Đây là hành trình gia hạn TNDS cho BeyondPilot × Tasco — lead scoring, chat AI, Virtual Office, và RBAC theo persona.",
      hint: "Không cần mật khẩu",
    },
    {
      id: "personas",
      title: "Chọn vai trò để bắt đầu",
      body: "Customer mở Virtual Office. Staff (Ops, Telesales, Compliance…) thấy màn hình và quyền khác nhau.",
      hint: "Thử Anh Minh trước",
    },
    {
      id: "modes",
      title: "Hai bề mặt khách hàng",
      body: "Virtual Office = chơi JRPG HD-2D. Classic = chat Zalo / VETC / voice như sản phẩm thật.",
    },
  ],
  en: [
    {
      id: "welcome",
      title: "Welcome to the Tasco Demo",
      body: "This is the TNDS renewal journey for BeyondPilot × Tasco — lead scoring, AI chat, Virtual Office, and persona RBAC.",
      hint: "No passwords",
    },
    {
      id: "personas",
      title: "Pick a persona to start",
      body: "Customer opens the Virtual Office. Staff (Ops, Telesales, Compliance…) see different screens and permissions.",
      hint: "Try Anh Minh first",
    },
    {
      id: "modes",
      title: "Two customer surfaces",
      body: "Virtual Office = HD-2D JRPG play. Classic = Zalo / VETC / voice chat shaped like production.",
    },
  ],
} as const satisfies Record<OnboardingLocale, OnboardingStep[]>;

const customer = {
  vi: [
    {
      id: "office-welcome",
      title: "Bạn đang ở Virtual Office",
      body: "Văn phòng Tasco kiểu JRPG HD-2D. Đi bộ, nói chuyện với nhân viên, gửi bồi thường, theo dõi hồ sơ.",
    },
    {
      id: "controls",
      title: "Cách điều khiển",
      body: "WASD hoặc phím mũi tên để đi. E / Space / Enter (hoặc nút A trên điện thoại) để nói chuyện khi gần NPC.",
      hint: "Esc đóng bảng thoại",
    },
    {
      id: "stations",
      title: "Các điểm dừng",
      body: "Lễ tân (hướng dẫn) · CS (gia hạn) · Bồi thường (upload ảnh) · Hồ sơ (trạng thái) · VETC (sang Classic).",
    },
    {
      id: "toggle",
      title: "Classic ↔ Virtual Office",
      body: "Dùng nút trên header để chuyển giữa office game và chat Zalo/VETC bất cứ lúc nào.",
    },
  ],
  en: [
    {
      id: "office-welcome",
      title: "You're in the Virtual Office",
      body: "A Tasco HD-2D JRPG office. Walk around, talk to staff, file claims, and track your case.",
    },
    {
      id: "controls",
      title: "How to move",
      body: "WASD or arrow keys to walk. E / Space / Enter (or the phone A button) to talk when near an NPC.",
      hint: "Esc closes dialogue",
    },
    {
      id: "stations",
      title: "Where to go",
      body: "Reception (tips) · CS (renew) · Claims (upload photos) · Admin board (status) · VETC (Classic app).",
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

export function stepsFor(
  kind: "guest" | "customer" | "staff",
  locale: OnboardingLocale = "vi",
): OnboardingStep[] {
  if (kind === "guest") return [...guest[locale]];
  if (kind === "customer") return [...customer[locale]];
  return [...staffBase[locale]];
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
