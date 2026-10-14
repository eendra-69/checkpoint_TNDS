import type { OnboardingLocale, OnboardingStep } from "./onboarding-steps";

type PageTour = Record<OnboardingLocale, OnboardingStep[]>;

/**
 * What each page is for, shown by the header Tour button. Keyed by route prefix;
 * the longest matching prefix wins (so /admin/workflow beats /admin).
 */
const PAGE_TOURS: Record<string, PageTour> = {
  "/": {
    vi: [
      {
        id: "home-what",
        title: "Trang chủ",
        body: "Tổng quan demo gia hạn TNDS cho BeyondPilot × Tasco: chấm điểm lead, nhắc qua Zalo/VETC, chat AI, cuộc gọi AI, bàn giao telesales và Virtual Office.",
      },
      {
        id: "home-start",
        title: "Bắt đầu từ đâu",
        body: "\"Vào demo\" mở trang chọn persona. \"Sơ đồ workflow\" mở bản đồ quy trình (cần đăng nhập Admin).",
        hint: "Ba thẻ bên dưới tóm tắt ba nhóm vai trò trong demo.",
      },
    ],
    en: [
      {
        id: "home-what",
        title: "Home",
        body: "Overview of the BeyondPilot × Tasco TNDS renewal demo: lead scoring, Zalo/VETC reminders, AI chat, AI voice, telesales handover and the Virtual Office.",
      },
      {
        id: "home-start",
        title: "Where to start",
        body: "\"Enter the demo\" opens the persona picker. \"Workflow map\" opens the process map (sign in as Admin).",
        hint: "The three cards below summarise the role groups in the demo.",
      },
    ],
  },
  "/login": {
    vi: [
      {
        id: "login-what",
        title: "Chọn persona",
        body: "Không cần mật khẩu. Mỗi persona có quyền riêng, được kiểm tra phía server cho mọi màn hình, API và công cụ AI.",
      },
      {
        id: "login-customers",
        title: "Ba khách hàng demo",
        body: "Anh Minh: gia hạn suôn sẻ. Chị Lan: bỏ qua tin nhắc → cuộc gọi AI → gặp nhân viên. Anh Tuấn: thiếu dữ liệu xe, phải xác nhận trước khi thanh toán.",
      },
      {
        id: "login-staff",
        title: "Nhân viên",
        body: "Quản lý chiến dịch (chấm điểm, chiến dịch), Telesales (bàn giao), Compliance (consent, audit), Lãnh đạo (số liệu), Admin (cài đặt, quyền, workflow).",
        hint: "Thứ tự gợi ý: Quản lý chiến dịch → Anh Minh → Chị Lan → Telesales → Admin.",
      },
    ],
    en: [
      {
        id: "login-what",
        title: "Pick a persona",
        body: "No passwords. Each persona has its own permissions, enforced on the server for every screen, API and AI tool.",
      },
      {
        id: "login-customers",
        title: "Three demo customers",
        body: "Anh Minh: smooth renewal. Chị Lan: ignores the reminder → AI call → asks for a human. Anh Tuấn: incomplete vehicle data, must confirm before paying.",
      },
      {
        id: "login-staff",
        title: "Staff",
        body: "Campaign manager (scoring, campaigns), Telesales (handovers), Compliance (consent, audit), Executive (metrics), Admin (settings, permissions, workflow).",
        hint: "Suggested order: Campaign manager → Anh Minh → Chị Lan → Telesales → Admin.",
      },
    ],
  },
  "/office": {
    vi: [
      {
        id: "office-welcome",
        title: "Virtual Office",
        body: "Văn phòng Tasco kiểu JRPG HD-2D. Đi bộ, nói chuyện với nhân viên, gia hạn, gửi bồi thường và theo dõi hồ sơ.",
      },
      {
        id: "office-controls",
        title: "Cách điều khiển",
        body: "WASD hoặc phím mũi tên để đi. E / Space / Enter (hoặc nút A trên điện thoại) để nói chuyện khi đứng gần.",
        hint: "Esc đóng bảng thoại.",
      },
      {
        id: "office-stations",
        title: "Các điểm dừng",
        body: "Lễ tân (hướng dẫn) · CS (gia hạn, quyền lợi, gặp nhân viên) · Bồi thường (tải ảnh) · Bảng hồ sơ (trạng thái, giấy chứng nhận, consent) · VETC (sang ứng dụng VETC).",
      },
    ],
    en: [
      {
        id: "office-welcome",
        title: "Virtual Office",
        body: "A Tasco HD-2D JRPG office. Walk around, talk to staff, renew, file claims and track your case.",
      },
      {
        id: "office-controls",
        title: "How to move",
        body: "WASD or arrow keys to walk. E / Space / Enter (or the phone A button) to talk when you are close.",
        hint: "Esc closes dialogue.",
      },
      {
        id: "office-stations",
        title: "Where to go",
        body: "Reception (tips) · CS (renew, coverage, talk to a human) · Claims (upload photos) · Admin board (status, certificate, consent) · VETC (VETC app).",
      },
    ],
  },
  "/chat": {
    vi: [
      {
        id: "chat-what",
        title: "Chat gia hạn Zalo",
        body: "Mô phỏng Zalo Official Account: tin nhắc ZNS mở đầu, sau đó agent giúp xác nhận xe và gia hạn. Chỉ phí quy định, không giảm giá.",
      },
      {
        id: "chat-chips",
        title: "Nút gợi ý",
        body: "xác nhận · cover (quyền lợi) · thanh toán · nhân viên (chuyển telesales). Có thể gõ tự do.",
      },
      {
        id: "chat-side",
        title: "Bảng bên phải",
        body: "Trạng thái hồ sơ, mở thanh toán giả, sang VETC hoặc Virtual Office. Sau khi thanh toán sẽ có nút xem giấy chứng nhận.",
      },
    ],
    en: [
      {
        id: "chat-what",
        title: "Zalo renewal chat",
        body: "A simulated Zalo Official Account: a ZNS reminder opens the chat, then the agent helps confirm the vehicle and renew. Regulated premium only, no discounts.",
      },
      {
        id: "chat-chips",
        title: "Quick replies",
        body: "confirm · cover (what's covered) · pay · human (handover to telesales). You can also type freely.",
      },
      {
        id: "chat-side",
        title: "Side panel",
        body: "Case status, mock checkout, and links to VETC or the Virtual Office. After payment a View certificate button appears.",
      },
    ],
  },
  "/vetc": {
    vi: [
      {
        id: "vetc-what",
        title: "Ứng dụng VETC",
        body: "Cổng vào thứ hai cho cùng một agent gia hạn: số dư E-tag và số ngày TNDS còn lại.",
      },
      {
        id: "vetc-actions",
        title: "Từ đây",
        body: "\"Gia hạn trong chat\" mở chat gia hạn. \"Virtual Office\" quay lại văn phòng.",
      },
    ],
    en: [
      {
        id: "vetc-what",
        title: "VETC app",
        body: "A second entry point into the same renewal agent: E-tag balance and days left on the TNDS policy.",
      },
      {
        id: "vetc-actions",
        title: "From here",
        body: "\"Renew in chat\" opens the renewal chat. \"Virtual Office\" goes back to the office.",
      },
    ],
  },
  "/call": {
    vi: [
      {
        id: "call-what",
        title: "Cuộc gọi AI",
        body: "Dành cho khách không trả lời tin nhắc. Chỉ gọi khi khách đã đồng ý nhận cuộc gọi; nếu chưa, nút gọi bị khóa.",
      },
      {
        id: "call-how",
        title: "Cách dùng",
        body: "\"Bắt đầu gọi\" để AI đọc lời mở. \"Nói\" dùng nhận giọng nói của trình duyệt, hoặc gõ vào ô bên dưới.",
      },
      {
        id: "call-handover",
        title: "Gặp nhân viên",
        body: "Chuyển khách sang telesales kèm tóm tắt cuộc gọi; hồ sơ hiện ở bàn telesales với kênh \"cuộc gọi AI\".",
      },
    ],
    en: [
      {
        id: "call-what",
        title: "AI voice call",
        body: "For customers who ignore the reminder. Only calls customers who consented to calls; otherwise the call button is locked.",
      },
      {
        id: "call-how",
        title: "How to use",
        body: "\"Start call\" makes the AI read the opening. \"Speak\" uses the browser's speech recognition, or type in the box below.",
      },
      {
        id: "call-handover",
        title: "Ask for a human",
        body: "Hands the customer to telesales with a call summary; the case appears on the telesales desk as \"AI voice call\".",
      },
    ],
  },
  "/verify": {
    vi: [
      {
        id: "verify-what",
        title: "Giấy chứng nhận điện tử",
        body: "Bằng chứng TNDS xác minh được ngay; mã QR dẫn về đúng trang này.",
      },
      {
        id: "verify-fields",
        title: "Thông tin",
        body: "Mã giấy, biển số, chủ xe, ngày phát hành và hết hạn (giờ Việt Nam), phí đã trả.",
        hint: "Giả định: API phát hành của hãng bảo hiểm (giai đoạn pilot).",
      },
    ],
    en: [
      {
        id: "verify-what",
        title: "Digital certificate",
        body: "Instantly verifiable TNDS proof; the QR code points back to this page.",
      },
      {
        id: "verify-fields",
        title: "Details",
        body: "Certificate ID, plate, owner, issue and expiry dates (Vietnam time), premium paid.",
        hint: "Assumption: insurer issuance API (pilot phase).",
      },
    ],
  },
  "/ops": {
    vi: [
      {
        id: "ops-scores",
        title: "Chấm điểm lead",
        body: "Khách được chấm điểm theo quy tắc minh bạch, kèm lý do và hành động tiếp theo (kênh + khung giờ gửi).",
      },
      {
        id: "ops-campaign",
        title: "Chạy chiến dịch gia hạn",
        body: "Gửi nhắc cho 40 khách điểm cao nhất. Tự loại khách thiếu consent, đã gia hạn hoặc đã từ chối, và ghi số lượng theo lý do.",
      },
      {
        id: "ops-state",
        title: "Cột Trạng thái",
        body: "Theo dõi hồ sơ: Đã nhắc → Tương tác → Xác nhận → Đã cấp. Tên khách được che một phần theo quyền.",
      },
    ],
    en: [
      {
        id: "ops-scores",
        title: "Lead scoring",
        body: "Customers are scored with transparent rules, with the reasons and a next best action (channel + send window).",
      },
      {
        id: "ops-campaign",
        title: "Run renewal campaign",
        body: "Reminds the top 40 customers. Automatically excludes customers without consent, already renewed or opted out, and counts each reason.",
      },
      {
        id: "ops-state",
        title: "State column",
        body: "Track each case: Reminded → Engaged → Confirmed → Issued. Names are partly masked for this persona.",
      },
    ],
  },
  "/agent": {
    vi: [
      {
        id: "agent-queue",
        title: "Bàn telesales",
        body: "Hàng chờ khách mà AI đã chuyển sang, kèm tóm tắt và kênh gốc (Zalo, Virtual Office, cuộc gọi AI).",
      },
      {
        id: "agent-pii",
        title: "Hiện số điện thoại / CCCD",
        body: "Dữ liệu cá nhân bị che. Muốn xem phải nhập lý do; lý do được ghi vào audit log.",
      },
      {
        id: "agent-link",
        title: "Gửi link gia hạn",
        body: "Khách tự xác nhận và thanh toán trong kênh của mình. Telesales không cấp giấy chứng nhận.",
      },
      {
        id: "agent-outcomes",
        title: "Ghi kết quả",
        body: "\"Hẹn gọi lại\" và \"Đã gửi link\" giữ hồ sơ trong hàng chờ. \"Đã gia hạn\" (khi khách đã có giấy) và \"Không quan tâm\" đóng hồ sơ.",
      },
    ],
    en: [
      {
        id: "agent-queue",
        title: "Telesales desk",
        body: "Queue of customers the AI handed over, with a summary and the source channel (Zalo, Virtual Office, AI voice call).",
      },
      {
        id: "agent-pii",
        title: "Reveal phone / national ID",
        body: "Personal data is masked. Revealing it needs a reason, which is written to the audit log.",
      },
      {
        id: "agent-link",
        title: "Send renewal link",
        body: "The customer confirms and pays in their own channel. Telesales never issues certificates.",
      },
      {
        id: "agent-outcomes",
        title: "Log the outcome",
        body: "\"Callback requested\" and \"Link sent\" keep the case in the queue. \"Renewed\" (once the customer has a certificate) and \"Not interested\" close it.",
      },
    ],
  },
  "/compliance": {
    vi: [
      {
        id: "compliance-consent",
        title: "Sổ consent",
        body: "Đồng ý nhận tin, nhận cuộc gọi và sử dụng dữ liệu của từng khách. Tên được che theo quyền.",
      },
      {
        id: "compliance-audit",
        title: "Audit log",
        body: "Mọi hành động — đăng nhập, chiến dịch, chat, hiện dữ liệu cá nhân kèm lý do, cấp giấy — chỉ được ghi thêm, không sửa.",
      },
      {
        id: "compliance-claims",
        title: "Sổ bồi thường",
        body: "Hồ sơ bồi thường demo và trạng thái của chúng.",
        hint: "Màn hình chỉ đọc với persona này.",
      },
    ],
    en: [
      {
        id: "compliance-consent",
        title: "Consent ledger",
        body: "Each customer's consent to messages, calls and data use. Names are masked for this persona.",
      },
      {
        id: "compliance-audit",
        title: "Audit log",
        body: "Every action — sign-ins, campaigns, chats, PII reveals with their reason, certificate issues — is append-only.",
      },
      {
        id: "compliance-claims",
        title: "Claims ledger",
        body: "Demo claims and their status.",
        hint: "Read-only for this persona.",
      },
    ],
  },
  "/metrics": {
    vi: [
      {
        id: "metrics-funnel",
        title: "Funnel",
        body: "Số khách qua từng bước trong phiên demo này: Đã nhắc → Tương tác → Xác nhận → Thanh toán → Đã cấp, và số ca bàn giao.",
      },
      {
        id: "metrics-impact",
        title: "Tác động giả định",
        body: "Mức tăng tỷ lệ gia hạn và thời gian telesales tiết kiệm là giả định cho phần pitch, được ghi rõ là giả định.",
      },
      {
        id: "metrics-cost",
        title: "Chi phí mỗi lượt gia hạn",
        body: "Chi phí minh họa cho chat LLM và giọng nói. Không có ngân sách giảm giá.",
      },
    ],
    en: [
      {
        id: "metrics-funnel",
        title: "Funnel",
        body: "How many customers reached each step in this demo session: Reminded → Engaged → Confirmed → Paid → Issued, plus handovers.",
      },
      {
        id: "metrics-impact",
        title: "Assumed impact",
        body: "The renewal-rate uplift and telesales time saved are pitch assumptions, labelled as such.",
      },
      {
        id: "metrics-cost",
        title: "Cost per renewal",
        body: "Illustrative cost of LLM chat and voice. There is no discount budget.",
      },
    ],
  },
  "/admin": {
    vi: [
      {
        id: "admin-llm",
        title: "Nhà cung cấp AI",
        body: "Chọn nhà cung cấp cloud hoặc local và nhập key (chỉ lưu trong phiên demo). Không có key, agent trả lời theo từ khóa.",
      },
      {
        id: "admin-voice",
        title: "ElevenLabs",
        body: "Giọng nói tùy chọn cho cuộc gọi AI. Để trống thì dùng Web Speech miễn phí của trình duyệt.",
      },
      {
        id: "admin-rbac",
        title: "Ma trận quyền",
        body: "Bật/tắt quyền của từng persona, chỉ trong phiên demo này. Reset demo khôi phục mặc định.",
      },
    ],
    en: [
      {
        id: "admin-llm",
        title: "AI providers",
        body: "Pick a cloud or local provider and enter a key (stored in this demo session only). Without a key the agent answers by keywords.",
      },
      {
        id: "admin-voice",
        title: "ElevenLabs",
        body: "Optional voice for the AI call. Leave it empty to use the browser's free Web Speech.",
      },
      {
        id: "admin-rbac",
        title: "Permission matrix",
        body: "Toggle each persona's permissions, for this demo session only. Reset demo restores the defaults.",
      },
    ],
  },
  "/admin/workflow": {
    vi: [
      {
        id: "workflow-maps",
        title: "Ba bản đồ",
        body: "Quy trình nghiệp vụ (ai làm gì), Trạng thái hồ sơ (kèm số hồ sơ hiện tại ở mỗi trạng thái), Lược đồ dữ liệu (ai được xem trường nào).",
      },
      {
        id: "workflow-use",
        title: "Cách dùng",
        body: "Bấm một nút để xem chi tiết ở cột phải. Kéo để sắp xếp; F để vừa khung; \"Đặt lại bố cục\" để về mặc định.",
      },
    ],
    en: [
      {
        id: "workflow-maps",
        title: "Three maps",
        body: "Business process (who does what), Workflow states (with the live number of cases in each state), Data schema (who can see which field).",
      },
      {
        id: "workflow-use",
        title: "How to use",
        body: "Click a node for details in the right panel. Drag to rearrange; F to fit; \"Reset layout\" to go back.",
      },
    ],
  },
  "/forbidden": {
    vi: [
      {
        id: "forbidden-what",
        title: "Không có quyền",
        body: "Persona hiện tại thiếu quyền ghi ở trên. Đổi persona hoặc quay về trang chủ.",
      },
    ],
    en: [
      {
        id: "forbidden-what",
        title: "Not allowed",
        body: "The current persona lacks the permission shown above. Switch persona or go back home.",
      },
    ],
  },
};

export function pageStepsFor(pathname: string, locale: OnboardingLocale): OnboardingStep[] {
  const key = Object.keys(PAGE_TOURS)
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname === k || (k !== "/" && pathname.startsWith(`${k}/`)));
  return key ? [...PAGE_TOURS[key][locale]] : [];
}
