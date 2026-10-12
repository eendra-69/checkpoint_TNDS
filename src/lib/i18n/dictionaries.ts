import type { Locale } from "./locale";

const vi = {
  nav: {
    home: "Trang chủ",
    ops: "Ops",
    agent: "Telesales",
    compliance: "Compliance",
    metrics: "Metrics",
    admin: "Admin",
    workflow: "Workflow",
  },
  chrome: {
    signIn: "Đăng nhập với…",
    switch: "Đổi",
    reset: "Reset demo",
    signOut: "Đăng xuất",
    tour: "Tour",
    classic: "Classic",
    office: "Virtual Office",
    demoWatermark: "DEMO — SYNTHETIC",
  },
  home: {
    headline: "Khiến TNDS trở thành thứ tài xế muốn giữ",
    sub: "Demo gia hạn BeyondPilot — chấm điểm lead, chat AI, hoặc bước vào Virtual Office của Tasco.",
    enter: "Vào demo",
    continue: "Tiếp tục demo",
    workflow: "Sơ đồ workflow",
    sectionTitle: "Một hành trình, hai bề mặt khách hàng",
    sectionBody:
      "Classic Zalo / VETC cho gia hạn kiểu production — hoặc Virtual Office game HD-2D với CS AI, bồi thường ảnh, và theo dõi hồ sơ.",
    personaCustomer: "Khách hàng",
    personaCustomerBody: "Mặc định Virtual Office — Classic chat chỉ một nút chuyển.",
    personaOps: "Campaign ops",
    personaOpsBody: "Điểm số minh bạch, chiến dịch tôn trọng consent, funnel metrics.",
    personaVoice: "Voice + telesales",
    personaVoiceBody: "Voice có consent và bàn giao cho nhân viên.",
    signInPersona: "Đăng nhập theo persona",
  },
  login: {
    title: "Đăng nhập với…",
    subtitle:
      "Không mật khẩu — chọn persona. RBAC phía server vẫn khóa mọi màn hình, API và AI tool.",
    customerOffice: "Mở Virtual Office theo mặc định",
    continue: "Tiếp tục",
  },
  office: {
    loading: "Đang vào Virtual Office…",
  },
  chat: {
    title: "Chat gia hạn Zalo",
    subtitle: "Official Account + ZNS mô phỏng. Chỉ phí quy định — không giảm giá.",
    classic: "Classic chat",
    profileOk: "Hồ sơ OK",
    needsConfirm: "Cần xác nhận",
    openCheckout: "Mở thanh toán giả",
    vetcEntry: "Vào VETC App",
    virtualOffice: "Virtual Office",
    viewCert: "Xem giấy chứng nhận",
    placeholder: "Nhập tin nhắn…",
    send: "Gửi",
    chips: ["xác nhận", "cover", "thanh toán", "nhân viên"] as string[],
  },
  verify: {
    title: "Giấy chứng nhận TNDS điện tử",
    subtitle: "Chứng minh tức thì — không thể để quên ở nhà.",
    signInNeeded: "Đăng nhập để xác minh chứng nhận trong phiên demo.",
    signIn: "Đăng nhập",
    valid: "Hợp lệ",
    issued: "Phát hành",
    expires: "Hết hạn",
    premium: "Phí đã trả",
    insurer: "Công ty bảo hiểm",
  },
  vetc: {
    title: "Ứng dụng VETC",
    subtitle: "Cổng vào thứ hai tới cùng agent gia hạn.",
  },
  call: {
    title: "Cuộc gọi AI",
    subtitle: "Voice fallback khi khách không trả lời chat.",
  },
  ops: {
    title: "Lead scoring",
    subtitle:
      "Điểm số quy tắc minh bạch kèm next-best action. Chiến dịch tự loại khách không consent.",
  },
  agent: {
    title: "Bàn telesales",
    subtitle:
      "Handover ấm từ AI kèm tóm tắt. Gửi link gia hạn — khách tự xác nhận và thanh toán.",
  },
  compliance: {
    title: "Compliance",
    subtitle: "Sổ consent và audit log append-only. Chỉ đọc với persona này.",
  },
  metrics: {
    title: "Impact metrics",
    subtitle: "Funnel từ phiên demo cộng giả định cho phần pitch.",
  },
  admin: {
    title: "Admin",
    subtitle: "Nhà cung cấp AI, khóa, và quyền demo.",
  },
  workflow: {
    title: "Workflow visualizer",
    subtitle: "Sơ đồ quy trình gia hạn và vận hành.",
  },
  forbidden: {
    title: "Không có quyền",
    body: "Persona hiện tại không được phép mở màn hình này.",
    back: "Về trang chủ",
  },
  personaPill: {
    reset: "Reset demo",
    signOut: "Đăng xuất",
    switch: "Đổi",
  },
} as const;

const en = {
  nav: {
    home: "Home",
    ops: "Ops",
    agent: "Telesales",
    compliance: "Compliance",
    metrics: "Metrics",
    admin: "Admin",
    workflow: "Workflow",
  },
  chrome: {
    signIn: "Sign in as…",
    switch: "Switch",
    reset: "Reset demo",
    signOut: "Sign out",
    tour: "Tour",
    classic: "Classic",
    office: "Virtual Office",
    demoWatermark: "DEMO — SYNTHETIC",
  },
  home: {
    headline: "Make TNDS something drivers are glad to hold",
    sub: "BeyondPilot renewal demo — score the lead, renew in chat, or step into a Tasco Virtual Office.",
    enter: "Enter the demo",
    continue: "Continue demo",
    workflow: "Workflow map",
    sectionTitle: "One journey, two customer surfaces",
    sectionBody:
      "Classic Zalo / VETC for production-shaped renewal — or a game-like HD-2D Virtual Office with AI CS, claims photo upload, and admin tracking.",
    personaCustomer: "Customer",
    personaCustomerBody: "Virtual Office by default — Classic chat one toggle away.",
    personaOps: "Campaign ops",
    personaOpsBody: "Transparent scores, consent-safe campaigns, funnel metrics.",
    personaVoice: "Voice + telesales",
    personaVoiceBody: "Consent-aware voice fallback and human handover.",
    signInPersona: "Sign in as a persona",
  },
  login: {
    title: "Sign in as…",
    subtitle:
      "No passwords — pick a persona. Server-side RBAC still enforces every screen, API, and AI tool.",
    customerOffice: "Opens in Virtual Office by default",
    continue: "Continue",
  },
  office: {
    loading: "Entering Virtual Office…",
  },
  chat: {
    title: "Zalo renewal chat",
    subtitle: "Simulated Official Account + ZNS. Regulated premium only — no discounts.",
    classic: "Classic chat",
    profileOk: "Profile OK",
    needsConfirm: "Needs confirmation",
    openCheckout: "Open mock checkout",
    vetcEntry: "VETC App entry",
    virtualOffice: "Virtual Office",
    viewCert: "View certificate",
    placeholder: "Type a message…",
    send: "Send",
    chips: ["confirm", "cover", "pay", "human"] as string[],
  },
  verify: {
    title: "Digital TNDS certificate",
    subtitle: "Instantly verifiable proof — impossible to leave at home.",
    signInNeeded: "Sign in to verify certificates from your demo session.",
    signIn: "Sign in",
    valid: "Valid",
    issued: "Issued",
    expires: "Expires",
    premium: "Premium paid",
    insurer: "Insurer",
  },
  vetc: {
    title: "VETC App",
    subtitle: "Second entry point into the same renewal agent.",
  },
  call: {
    title: "AI voice call",
    subtitle: "Voice fallback when the customer ignores chat.",
  },
  ops: {
    title: "Lead scoring",
    subtitle:
      "Transparent rule-based scores with next-best action. Campaigns auto-exclude customers without consent.",
  },
  agent: {
    title: "Telesales console",
    subtitle:
      "Warm AI handovers with summaries. Send a renewal link — customer confirms and pays themselves.",
  },
  compliance: {
    title: "Compliance",
    subtitle: "Consent ledger and append-only audit log. Read-only for this persona.",
  },
  metrics: {
    title: "Impact metrics",
    subtitle: "Funnel from this demo session plus stated assumptions for the pitch.",
  },
  admin: {
    title: "Admin",
    subtitle: "AI providers, keys, and demo permissions.",
  },
  workflow: {
    title: "Workflow visualizer",
    subtitle: "Map of the renewal and operations process.",
  },
  forbidden: {
    title: "Forbidden",
    body: "Your current persona is not allowed to open this screen.",
    back: "Back home",
  },
  personaPill: {
    reset: "Reset demo",
    signOut: "Sign out",
    switch: "Switch",
  },
} as const;

type DeepStringify<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? string[]
    : T extends object
      ? { [K in keyof T]: DeepStringify<T[K]> }
      : T;

export type Dictionary = DeepStringify<typeof vi>;

export const dictionaries: Record<Locale, Dictionary> = { vi, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || dictionaries.vi;
}
