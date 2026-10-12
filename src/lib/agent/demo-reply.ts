import type { DemoSession } from "../types";
import { formatVnd } from "../utils";
import { getRegulatedPremium, COVERAGE_EXPLAIN } from "../pricing";
import { nanoid } from "nanoid";
import { appendAudit } from "../audit";
import type { PersonaId } from "../types";

/** Deterministic renewal replies when no LLM key is configured. */
export async function demoRenewalReply(input: {
  session: DemoSession;
  customerId: string;
  userText: string;
  persona: PersonaId;
  save: () => Promise<void>;
}): Promise<string> {
  const { session, customerId, userText, persona, save } = input;
  const text = userText.toLowerCase();
  const customer = session.customers.find((c) => c.id === customerId)!;
  const vehicle = session.vehicles.find((v) => v.customerId === customerId)!;
  const policy = session.policies.find((p) => p.customerId === customerId)!;
  const premium = getRegulatedPremium(vehicle.vehicleType);

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
      fromChannel: "zalo",
      summary: `${customer.fullNameVi} asked for a human. Plate ${vehicle.plate}, expires ${policy.expiresAt.slice(0, 10)}.`,
      reason: "Customer requested human",
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
    return `Em đã chuyển anh/chị sang nhân viên telesales. Họ sẽ thấy tóm tắt: biển ${vehicle.plate}, hết hạn ${policy.expiresAt.slice(0, 10)}.`;
  }

  if (text.includes("thanh toán") || text.includes("pay") || text.includes("đồng ý") || text.includes("momo") || text.includes("vietqr")) {
    const checkoutId = `chk_${nanoid(6)}`;
    const certId = `CERT-${nanoid(10).toUpperCase()}`;
    const issuedAt = new Date().toISOString();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    vehicle.incomplete = false;
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
    session.funnel.confirmed += 1;
    session.funnel.paid += 1;
    session.funnel.issued += 1;
    appendAudit(session, {
      persona,
      customerId,
      action: "demo.issue",
      detail: `Issued ${certId} via ${checkoutId}`,
    });
    await save();
    return `Đã nhận thanh toán mô phỏng ${formatVnd(premium)} (phí quy định, không giảm giá).\n\nGiấy chứng nhận điện tử: **${certId}**\nXác minh: /verify/${certId}\n\n(Assumption: payment gateway + insurer issuance API — pilot)`;
  }

  if (text.includes("che") || text.includes("cover") || text.includes("bao gồm") || text.includes("không bảo")) {
    const c = COVERAGE_EXPLAIN.vi;
    return `${c.covered}\n\n${c.notCovered}\n\nPhí quy định cho xe của anh/chị: **${formatVnd(premium)}**/năm.`;
  }

  if (vehicle.incomplete || text.includes("xác nhận") || text.includes("biển")) {
    vehicle.incomplete = false;
    session.caseStates[customerId] = "confirmed";
    session.funnel.confirmed += 1;
    await save();
    return `Em xác nhận xe **${vehicle.make} ${vehicle.model}**, biển **${vehicle.plate}**.\nTNDS hết hạn ${policy.expiresAt.slice(0, 10)}.\nPhí quy định: **${formatVnd(premium)}**.\n\nAnh/chị muốn thanh toán mô phỏng qua VietQR/MoMo không? (gõ "thanh toán")`;
  }

  return `Xin chào ${customer.fullNameVi} 👋\nĐây là nhắc gia hạn TNDS (dữ liệu synthetic).\nXe: ${vehicle.make} ${vehicle.model} · Biển **${vehicle.plate}** · Hết hạn ${policy.expiresAt.slice(0, 10)}.\n\nPhí quy định: **${formatVnd(premium)}** (không giảm giá).\n\nAnh/chị có thể:\n• Gõ "xác nhận" để xác nhận xe\n• Gõ "cover" để xem quyền lợi\n• Gõ "thanh toán" để mô phỏng thanh toán\n• Gõ "nhân viên" để gặp telesales`;
}