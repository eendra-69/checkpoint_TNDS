import type {
  AuditEvent,
  Claim,
  ClaimStatus,
  Handover,
  LeadScore,
  OutcomeCode,
  PersonaId,
  ScoreReason,
  SendWindow,
  NextActionCode,
  TriageCode,
} from "../types";
import { formatDate } from "../utils";
import { getDictionary } from "./dictionaries";
import type { Locale } from "./locale";
import { format } from "./t";

/*
 * Text for data created at runtime (scores, handovers, audit, triage). The session
 * stores codes + params; these helpers render them in the viewer's language, so a
 * telesales agent in EN and a judge in VI each read their own language.
 */

const REASONS: Record<ScoreReason["code"], Record<Locale, string>> = {
  expired: { vi: "Đã hết hạn {days} ngày — cần gia hạn ngay", en: "Expired {days} day(s) ago — renew now" },
  expires_urgent: { vi: "Hết hạn trong {days} ngày — cần nhắc gấp", en: "Expires in {days} day(s) — urgent window" },
  expires_ideal: { vi: "Hết hạn trong {days} ngày — thời điểm nhắc lý tưởng", en: "Expires in {days} days — ideal reminder window" },
  expires_early: { vi: "Hết hạn trong {days} ngày — chăm sóc sớm", en: "Expires in {days} days — early nurture" },
  previously_renewed: { vi: "Đã từng gia hạn với Tasco", en: "Previously renewed with us" },
  vetc_active: { vi: "Dùng VETC thường xuyên ({trips} lượt / 90 ngày)", en: "Active VETC user ({trips} trips / 90d)" },
  vetc_moderate: { vi: "Dùng VETC vừa phải ({trips} lượt)", en: "Moderate VETC activity ({trips} trips)" },
  zalo_consent: { vi: "Đã đồng ý nhận tin Zalo", en: "Zalo messaging consent on file" },
  call_consent_only: { vi: "Chỉ đồng ý nhận cuộc gọi — phù hợp gọi AI", en: "Call consent only — voice channel candidate" },
  profile_complete: { vi: "Hồ sơ khách và xe đầy đủ", en: "Complete customer / vehicle profile" },
  profile_incomplete: { vi: "Thiếu dữ liệu — cần xác nhận trước khi cấp", en: "Incomplete data — needs confirmation before issuance" },
};

export function describeReason(reason: ScoreReason | string, locale: Locale): string {
  if (typeof reason === "string") return reason;
  if (reason.code === "expires_urgent" && reason.days === 0) {
    return locale === "vi" ? "Hết hạn hôm nay — cần nhắc gấp" : "Expires today — urgent window";
  }
  const vars: Record<string, number> =
    "days" in reason ? { days: reason.days } : "trips" in reason ? { trips: reason.trips } : {};
  return format(REASONS[reason.code][locale], vars);
}

const NEXT_ACTIONS: Record<NextActionCode, Record<Locale, string>> = {
  zalo_confirm: { vi: "Zalo: xác nhận thông tin xe rồi gia hạn", en: "Zalo: confirm vehicle details then renew" },
  zalo_reminder: { vi: "Nhắc gia hạn qua Zalo ZNS", en: "Zalo ZNS renewal reminder" },
  voice_outreach: { vi: "Gọi AI (đã có consent)", en: "Consent-based AI voice outreach" },
  vetc_banner: { vi: "Banner gia hạn trong ứng dụng VETC", en: "VETC App renewal banner" },
};

const SEND_WINDOWS: Record<SendWindow, Record<Locale, string>> = {
  morning: { vi: "09:00–11:00 (giờ VN)", en: "09:00–11:00 ICT" },
  evening: { vi: "18:00–20:00 (giờ VN)", en: "18:00–20:00 ICT" },
  voice_morning: { vi: "09:30–11:30 (giờ VN)", en: "09:30–11:30 ICT" },
  next_app_open: { vi: "lần mở ứng dụng tới", en: "next app open" },
};

export function describeNextAction(nba: LeadScore["nextBestAction"], locale: Locale) {
  return {
    label: nba.action ? NEXT_ACTIONS[nba.action][locale] : nba.label,
    when: nba.window ? SEND_WINDOWS[nba.window][locale] : nba.sendAtHint,
  };
}

const TRIAGE: Record<TriageCode, Record<Locale, string>> = {
  glass: {
    vi: "AI phân loại (demo): có thể hư kính/cửa sổ — ảnh đủ rõ.",
    en: "AI triage (demo): possible glass/window damage — photo clarity OK.",
  },
  bumper: {
    vi: "AI phân loại (demo): nghi va chạm cản — nên kiểm tra gầm xe.",
    en: "AI triage (demo): bumper impact suspected — recommend underbody check.",
  },
  exterior: {
    vi: "AI phân loại (demo): hư hại bên ngoài — chờ giám định viên xem xét.",
    en: "AI triage (demo): exterior damage noted — queued for human adjuster review.",
  },
};

export function describeTriage(claim: Claim, locale: Locale): string | undefined {
  return claim.triageCode ? TRIAGE[claim.triageCode][locale] : claim.triageNote;
}

export function describeHandover(ho: Handover, locale: Locale) {
  if (!ho.template) return { summary: ho.summary, reason: ho.reason };
  const { customerName, plate, expiresAt } = ho.template;
  const expires = formatDate(expiresAt);
  return locale === "vi"
    ? {
        summary: `${customerName} yêu cầu gặp nhân viên. Biển ${plate}, hết hạn ${expires}.`,
        reason: "Khách yêu cầu gặp nhân viên",
      }
    : {
        summary: `${customerName} asked for a human. Plate ${plate}, expires ${expires}.`,
        reason: "Customer requested human",
      };
}

type AuditTemplate = {
  label: Record<Locale, string>;
  /** Localized detail from params; omit to show the stored detail (e.g. chat text, LLM reasons). */
  detail?: (p: Record<string, string | number>, locale: Locale) => string | undefined;
};

const yesNo = (v: string | number, locale: Locale) =>
  String(v) === "true" ? (locale === "vi" ? "bật" : "on") : locale === "vi" ? "tắt" : "off";

const AUDIT: Record<string, AuditTemplate> = {
  "session.seeded": {
    label: { vi: "Khởi tạo phiên", en: "Session seeded" },
    detail: (p, l) => (p.n === undefined ? undefined : l === "vi" ? `Tạo ${p.n} chủ xe tổng hợp` : `Seeded ${p.n} synthetic car owners`),
  },
  "auth.signin": {
    label: { vi: "Đăng nhập", en: "Sign-in" },
    detail: (p, l) => {
      if (!p.persona) return undefined;
      const who = getDictionary(l).personas[p.persona as PersonaId]?.label ?? String(p.persona);
      return p.customer ? `${who} (${p.customer})` : who;
    },
  },
  "campaign.run": {
    label: { vi: "Chạy chiến dịch", en: "Campaign run" },
    detail: (p, l) =>
      p.targeted === undefined
        ? undefined
        : l === "vi"
          ? `Nhắm tới ${p.targeted}, loại trừ ${p.excluded}`
          : `Targeted ${p.targeted}, excluded ${p.excluded}`,
  },
  "chat.message": { label: { vi: "Tin nhắn chat", en: "Chat message" } },
  "demo.escalate": {
    label: { vi: "Chuyển sang nhân viên", en: "Handover to human" },
    detail: (_p, l) => (l === "vi" ? "Khách yêu cầu gặp nhân viên" : "Customer requested human"),
  },
  "demo.issue": {
    label: { vi: "Cấp giấy chứng nhận", en: "Certificate issued" },
    detail: (p, l) => (p.cert === undefined ? undefined : l === "vi" ? `Đã cấp ${p.cert} qua ${p.checkout}` : `Issued ${p.cert} via ${p.checkout}`),
  },
  "claim.submitted": {
    label: { vi: "Gửi hồ sơ bồi thường", en: "Claim submitted" },
    detail: (p, l) => (p.claim === undefined ? undefined : l === "vi" ? `${p.claim} — ${p.photos} ảnh` : `${p.claim} — ${p.photos} photo(s)`),
  },
  "claim.status": {
    label: { vi: "Cập nhật bồi thường", en: "Claim status" },
    detail: (p, l) =>
      p.claim === undefined
        ? undefined
        : `${p.claim} → ${getDictionary(l).claimStates[p.status as ClaimStatus] ?? p.status}`,
  },
  "pii.reveal": {
    label: { vi: "Hiện dữ liệu cá nhân", en: "PII reveal" },
    detail: (p, l) => {
      if (!p.field) return undefined;
      const t = getDictionary(l).agentBody;
      return p.field === "phone" ? t.phone : t.nationalId;
    },
  },
  "outcome.log": {
    label: { vi: "Ghi kết quả", en: "Outcome logged" },
    detail: (p, l) => (p.code === undefined ? undefined : getDictionary(l).agentBody.outcomes[p.code as OutcomeCode]),
  },
  "renewal.link_sent": {
    label: { vi: "Gửi link gia hạn", en: "Renewal link sent" },
    detail: (_p, l) => (l === "vi" ? "Link gia hạn bảo mật đã gửi tới kênh của khách" : "Secure renewal link sent to the customer's channel"),
  },
  "tool.lookupPolicy": {
    label: { vi: "AI: tra cứu hợp đồng", en: "AI: policy lookup" },
    detail: (p, l) => (p.plate === undefined ? undefined : l === "vi" ? `Biển ${p.plate}` : `Plate ${p.plate}`),
  },
  "tool.confirmVehicle": {
    label: { vi: "AI: xác nhận xe", en: "AI: vehicle confirmed" },
    detail: (p, l) => (p.plate === undefined ? undefined : l === "vi" ? `Đã xác nhận ${p.plate}` : `Confirmed ${p.plate}`),
  },
  "tool.createCheckout": {
    label: { vi: "AI: tạo thanh toán", en: "AI: checkout created" },
    detail: (p) => (p.checkout === undefined ? undefined : `${p.checkout} — ${p.amount}`),
  },
  "tool.issueCertificate": {
    label: { vi: "AI: cấp giấy chứng nhận", en: "AI: certificate issued" },
    detail: (p, l) => (p.cert === undefined ? undefined : l === "vi" ? `Đã cấp ${p.cert} sau ${p.checkout}` : `Issued ${p.cert} after ${p.checkout}`),
  },
  "tool.escalateToHuman": { label: { vi: "AI: chuyển nhân viên", en: "AI: handover to human" } },
  "settings.llm": {
    label: { vi: "Cài đặt AI", en: "AI settings" },
    detail: (p, l) => (p.provider === undefined ? undefined : l === "vi" ? `Nhà cung cấp ${p.provider} / ${p.model}` : `Provider ${p.provider} / ${p.model}`),
  },
  "settings.permissions": {
    label: { vi: "Ma trận quyền", en: "Permission matrix" },
    detail: (_p, l) => (l === "vi" ? "Cập nhật ma trận quyền cho phiên demo này" : "Updated permission matrix for this demo session"),
  },
  "settings.permission_toggle": {
    label: { vi: "Đổi quyền", en: "Permission toggled" },
    detail: (p, l) => {
      if (!p.persona) return undefined;
      const who = getDictionary(l).personas[p.persona as PersonaId]?.label ?? String(p.persona);
      return `${who}: ${p.permission} = ${yesNo(p.enabled, l)}`;
    },
  },
};

/** Localized label + detail for an audit event; unknown actions or old events show what was stored. */
export function describeAudit(event: AuditEvent, locale: Locale) {
  const t = AUDIT[event.action];
  return {
    label: t?.label[locale] ?? event.action,
    detail: (t?.detail && t.detail(event.params ?? {}, locale)) || event.detail,
  };
}
