import type { CaseState } from "../types";
import type { Locale } from "../i18n/locale";
import { getDictionary } from "../i18n/dictionaries";
import type { WorkflowNode } from "./renewal";
import type { ProcessStep } from "./process";
import type { SchemaEntity } from "../data/schema";

/*
 * Vietnamese text for the static workflow / process / schema data. The source files
 * stay in English (they double as developer docs); the canvas renders through these.
 * Missing keys fall back to the English source.
 */

const NODE_DESCRIPTIONS_VI: Record<CaseState, string> = {
  scored: "Lead đã được chấm điểm kèm lý do và hành động tiếp theo",
  reminded: "Khách đã nhận tin nhắc gia hạn",
  engaged: "Đã bắt đầu trò chuyện với agent AI",
  confirmed: "Thông tin hợp đồng và xe đã được xác nhận",
  paid: "Đã thanh toán mô phỏng theo phí quy định",
  issued: "Giấy chứng nhận TNDS điện tử kèm link xác minh QR",
  no_response: "Bỏ qua tin nhắc — ứng viên cho cuộc gọi AI",
  voice_call: "Đang nói chuyện với bot giọng nói AI",
  handed_over: "Trong hàng chờ telesales kèm tóm tắt AI",
  link_sent: "Link gia hạn bảo mật đã gửi tới kênh của khách",
  opted_out: "Khách đã rút consent nhận tin / cuộc gọi",
  expired: "Hợp đồng hết hạn mà chưa gia hạn",
};

const TRIGGERS_VI: Record<string, string> = {
  "scored>reminded": "Chiến dịch gửi Zalo ZNS / banner VETC",
  "reminded>engaged": "Khách mở chat / chạm banner",
  "reminded>no_response": "Không tương tác trong SLA",
  "reminded>opted_out": "Khách từ chối",
  "engaged>confirmed": "Đã xác nhận biển số / xe",
  "engaged>handed_over": "Chuyển cho nhân viên",
  "confirmed>paid": "Khách thanh toán mô phỏng",
  "confirmed>handed_over": "Khách cần nhân viên hỗ trợ",
  "paid>issued": "Cấp giấy chứng nhận điện tử",
  "no_response>voice_call": "Cuộc gọi AI có consent",
  "no_response>expired": "Hợp đồng hết hạn",
  "voice_call>confirmed": "Khách xác nhận qua cuộc gọi",
  "voice_call>handed_over": "Chuyển sang telesales",
  "handed_over>link_sent": "Nhân viên gửi link gia hạn",
  "handed_over>engaged": "Khách quay lại chat",
  "link_sent>engaged": "Khách mở link gia hạn",
};

export function workflowNodeText(node: WorkflowNode, locale: Locale) {
  if (locale === "en") return { label: node.label, description: node.description };
  return {
    label: getDictionary("vi").caseStates[node.id] ?? node.label,
    description: NODE_DESCRIPTIONS_VI[node.id] ?? node.description,
  };
}

export function transitionText(from: CaseState, to: CaseState, trigger: string, locale: Locale) {
  return locale === "vi" ? (TRIGGERS_VI[`${from}>${to}`] ?? trigger) : trigger;
}

const LANES_VI: Record<string, string> = {
  crm: "Chiến dịch / CRM",
  voice: "Giọng nói AI",
  payment: "Thanh toán",
  insurer: "Hãng bảo hiểm cấp giấy",
};

const STEPS_VI: Record<string, { label: string; description: string; assumption?: string }> = {
  score: { label: "Chấm điểm & ưu tiên", description: "Điểm lead theo quy tắc, lý do dễ đọc" },
  consent_filter: { label: "Lọc consent", description: "Loại khách chưa đồng ý nhận tin / cuộc gọi" },
  zns: {
    label: "Nhắc qua Zalo ZNS",
    description: "Thông báo theo mẫu kèm biển số và ngày hết hạn",
    assumption: "Zalo Official Account + mẫu ZNS (pilot)",
  },
  vetc_banner: {
    label: "Banner ứng dụng VETC",
    description: "Lời nhắc gia hạn trong ứng dụng cho người dùng VETC tích cực",
    assumption: "Push / vị trí trong ứng dụng VETC (pilot)",
  },
  chat: { label: "Chat gia hạn AI", description: "Xác nhận biển số, giải thích quyền lợi, hiện phí quy định" },
  voice_queue: {
    label: "Gọi AI",
    description: "Cuộc gọi có consent cho khách không phản hồi",
    assumption: "Cổng thoại + TTS/STT tiếng Việt (pilot)",
  },
  handover: { label: "Bàn giao cho người", description: "Chuyển ấm kèm tóm tắt AI và mã kết quả" },
  send_link: { label: "Gửi link gia hạn", description: "Khách tự xác nhận và thanh toán" },
  checkout: {
    label: "VietQR / MoMo mô phỏng",
    description: "Mô phỏng thanh toán phí quy định",
    assumption: "Tích hợp cổng thanh toán (pilot)",
  },
  issue: {
    label: "Cấp giấy chứng nhận điện tử",
    description: "Giấy TNDS xác minh bằng QR",
    assumption: "API cấp giấy của hãng bảo hiểm (pilot)",
  },
  audit: { label: "Audit log", description: "Ghi lại mọi hành động AI, lần hiện dữ liệu và kết quả" },
};

export function laneText(id: string, label: string, locale: Locale) {
  return locale === "vi" ? (LANES_VI[id] ?? label) : label;
}

export function processStepText(step: ProcessStep, locale: Locale) {
  const vi = locale === "vi" ? STEPS_VI[step.id] : undefined;
  return {
    label: vi?.label ?? step.label,
    description: vi?.description ?? step.description,
    assumption: step.assumption ? (vi?.assumption ?? step.assumption) : undefined,
  };
}

const ENTITY_DESCRIPTIONS_VI: Record<string, string> = {
  Customer: "Chủ xe / người được bảo hiểm",
  Vehicle: "Xe đã đăng ký (dùng được VETC)",
  Policy: "Bảo hiểm TNDS bắt buộc",
  Consent: "Quyền theo kênh và dữ liệu",
  LeadScore: "Điểm theo quy tắc minh bạch",
  Campaign: "Lượt nhắc đã lọc consent",
  Conversation: "Bản ghi chat hoặc cuộc gọi",
  Handover: "Chuyển ấm sang telesales",
  Payment: "Thanh toán VietQR / MoMo mô phỏng",
  Certificate: "TNDS điện tử kèm xác minh QR",
  AuditEvent: "Nhật ký hành động chỉ ghi thêm",
};

const RELATIONS_VI: Record<string, string> = {
  owns: "sở hữu",
  holds: "đứng tên",
  grants: "cấp",
  "insured by": "được bảo hiểm bởi",
  issues: "phát hành",
  "scored as": "được chấm điểm",
  targets: "nhắm tới",
  opens: "mở",
  "may create": "có thể tạo",
  unlocks: "mở khóa",
};

export function schemaEntityDescription(entity: SchemaEntity, locale: Locale) {
  return locale === "vi" ? (ENTITY_DESCRIPTIONS_VI[entity.id] ?? entity.description) : entity.description;
}

export function relationText(label: string, locale: Locale) {
  return locale === "vi" ? (RELATIONS_VI[label] ?? label) : label;
}
