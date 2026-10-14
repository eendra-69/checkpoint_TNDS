import type { DemoSession } from "../types";
import { formatDate, formatVnd } from "../utils";
import { getRegulatedPremium, COVERAGE_EXPLAIN } from "../pricing";
import { nanoid } from "nanoid";
import { appendAudit } from "../audit";
import { currentCertificate } from "../workflow/renewal";
import type { Channel, PersonaId } from "../types";

/** Deterministic renewal replies when no LLM key is configured. */
export async function demoRenewalReply(input: {
  session: DemoSession;
  customerId: string;
  userText: string;
  persona: PersonaId;
  channel: Channel;
  save: () => Promise<void>;
}): Promise<string> {
  const { session, customerId, userText, persona, channel, save } = input;
  const text = userText.toLowerCase();
  const customer = session.customers.find((c) => c.id === customerId)!;
  const vehicle = session.vehicles.find((v) => v.customerId === customerId)!;
  const policy = session.policies.find((p) => p.customerId === customerId)!;
  const premium = getRegulatedPremium(vehicle.vehicleType);
  const lang = customer.preferredLanguage === "en" ? "en" : "vi";

  if (session.caseStates[customerId] === "reminded" || session.caseStates[customerId] === "scored") {
    session.caseStates[customerId] = "engaged";
    session.funnel.engaged += 1;
  }

  if (
    text.includes("người") ||
    text.includes("human") ||
    text.includes("telesales") ||
    text.includes("nhân viên")
  ) {
    session.handovers.unshift({
      id: `ho_${nanoid(8)}`,
      customerId,
      fromChannel: channel,
      summary: `${customer.fullNameVi} asked for a human. Plate ${vehicle.plate}, expires ${formatDate(policy.expiresAt)}.`,
      reason: "Customer requested human",
      template: {
        kind: "requested_human",
        customerName: customer.fullNameVi,
        plate: vehicle.plate,
        expiresAt: policy.expiresAt,
      },
      status: "queued",
      createdAt: new Date().toISOString(),
    });
    session.caseStates[customerId] = "handed_over";
    session.funnel.handedOver += 1;
    appendAudit(session, {
      persona,
      customerId,
      action: "demo.escalate",
      detail: "Customer requested human",
    });
    await save();
    return lang === "en"
      ? `I've handed you to a telesales agent. They'll see: plate ${vehicle.plate}, expires ${formatDate(policy.expiresAt)}.`
      : `Em đã chuyển anh/chị sang nhân viên telesales. Họ sẽ thấy tóm tắt: biển ${vehicle.plate}, hết hạn ${formatDate(policy.expiresAt)}.`;
  }

  if (
    text.includes("thanh toán") ||
    text.includes("pay") ||
    text.includes("đồng ý") ||
    text.includes("momo") ||
    text.includes("vietqr")
  ) {
    // PRODUCT rule 3: an incomplete vehicle must be confirmed before issue.
    if (vehicle.incomplete) {
      return lang === "en"
        ? `Before payment, please confirm your vehicle: **${vehicle.make} ${vehicle.model}**, plate **${vehicle.plate}**. Type "confirm" if this is correct.`
        : `Trước khi thanh toán, anh/chị vui lòng xác nhận xe: **${vehicle.make} ${vehicle.model}**, biển **${vehicle.plate}**. Gõ "xác nhận" nếu thông tin đúng.`;
    }
    const existing = currentCertificate(session, customerId);
    if (existing) {
      return lang === "en"
        ? `This policy is already renewed until ${formatDate(existing.expiresAt)}.\n\nDigital certificate: **${existing.id}**\nVerify: /verify/${existing.id}`
        : `Hợp đồng đã được gia hạn đến ${formatDate(existing.expiresAt)}.\n\nGiấy chứng nhận điện tử: **${existing.id}**\nXác minh: /verify/${existing.id}`;
    }
    const checkoutId = `chk_${nanoid(6)}`;
    const certId = `CERT-${nanoid(10).toUpperCase()}`;
    const issuedAt = new Date().toISOString();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    // Paying without an explicit "confirm" step still confirms a complete vehicle.
    if (session.caseStates[customerId] !== "confirmed") session.funnel.confirmed += 1;
    session.certificates.push({
      id: certId,
      policyId: policy.id,
      customerId,
      vehicleId: vehicle.id,
      issuedAt,
      premiumVnd: premium,
      insurer: policy.insurer,
      plate: vehicle.plate,
      expiresAt: expiresAt.toISOString(),
    });
    policy.certificateId = certId;
    policy.expiresAt = expiresAt.toISOString();
    session.caseStates[customerId] = "issued";
    session.funnel.paid += 1;
    session.funnel.issued += 1;
    appendAudit(session, {
      persona,
      customerId,
      action: "demo.issue",
      detail: `Issued ${certId} via ${checkoutId}`,
      params: { cert: certId, checkout: checkoutId },
    });
    await save();
    return lang === "en"
      ? `Simulated payment received ${formatVnd(premium)} (regulated premium, no discount).\n\nDigital certificate: **${certId}**\nVerify: /verify/${certId}\n\n(Assumption: payment gateway + insurer issuance API — pilot)`
      : `Đã nhận thanh toán mô phỏng ${formatVnd(premium)} (phí quy định, không giảm giá).\n\nGiấy chứng nhận điện tử: **${certId}**\nXác minh: /verify/${certId}\n\n(Assumption: payment gateway + insurer issuance API — pilot)`;
  }

  if (
    text.includes("che") ||
    text.includes("cover") ||
    text.includes("bao gồm") ||
    text.includes("không bảo") ||
    text.includes("quyền lợi")
  ) {
    const c = COVERAGE_EXPLAIN[lang];
    return lang === "en"
      ? `${c.covered}\n\n${c.notCovered}\n\nRegulated premium for your vehicle: **${formatVnd(premium)}**/year.`
      : `${c.covered}\n\n${c.notCovered}\n\nPhí quy định cho xe của anh/chị: **${formatVnd(premium)}**/năm.`;
  }

  if (
    text.includes("xác nhận") ||
    text.includes("confirm") ||
    text.includes("gia hạn") ||
    text.includes("renew") ||
    text.includes("biển")
  ) {
    vehicle.incomplete = false;
    // Repeating "confirm" (or confirming after issue) must not move the case or recount it.
    const state = session.caseStates[customerId];
    if (state !== "confirmed" && state !== "issued" && state !== "paid") {
      session.caseStates[customerId] = "confirmed";
      session.funnel.confirmed += 1;
    }
    await save();
    return lang === "en"
      ? `Confirmed vehicle **${vehicle.make} ${vehicle.model}**, plate **${vehicle.plate}**.\nTNDS expires ${formatDate(policy.expiresAt)}.\nRegulated premium: **${formatVnd(premium)}**.\n\nReady to simulate payment via VietQR/MoMo? (type "pay")`
      : `Em xác nhận xe **${vehicle.make} ${vehicle.model}**, biển **${vehicle.plate}**.\nTNDS hết hạn ${formatDate(policy.expiresAt)}.\nPhí quy định: **${formatVnd(premium)}**.\n\nAnh/chị muốn thanh toán mô phỏng qua VietQR/MoMo không? (gõ "thanh toán")`;
  }

  return lang === "en"
    ? `Hi ${customer.fullNameVi} 👋\nThis is a TNDS renewal reminder (synthetic data).\nVehicle: ${vehicle.make} ${vehicle.model} · Plate **${vehicle.plate}** · Expires ${formatDate(policy.expiresAt)}.\n\nRegulated premium: **${formatVnd(premium)}** (no discount).\n\nYou can:\n• Type "confirm" to confirm the vehicle\n• Type "cover" for coverage details\n• Type "pay" to simulate payment\n• Type "human" for telesales`
    : `Xin chào ${customer.fullNameVi} 👋\nĐây là nhắc gia hạn TNDS (dữ liệu synthetic).\nXe: ${vehicle.make} ${vehicle.model} · Biển **${vehicle.plate}** · Hết hạn ${formatDate(policy.expiresAt)}.\n\nPhí quy định: **${formatVnd(premium)}** (không giảm giá).\n\nAnh/chị có thể:\n• Gõ "xác nhận" để xác nhận xe\n• Gõ "cover" để xem quyền lợi\n• Gõ "thanh toán" để mô phỏng thanh toán\n• Gõ "nhân viên" để gặp telesales`;
}
