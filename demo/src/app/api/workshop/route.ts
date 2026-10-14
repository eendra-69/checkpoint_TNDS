import { z } from "zod";
import { streamText } from "ai";
import { getAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { getOrCreateSession } from "@/lib/session";
import { checkChatRateLimit } from "@/lib/rate-limit";
import { getModel } from "@/lib/llm/resolve";
import { getDemoCustomerId } from "@/lib/data/seed";
import { formatVnd } from "@/lib/utils";
import { getRegulatedPremium } from "@/lib/pricing";
import type { DemoSession } from "@/lib/types";

export const maxDuration = 60;

const AskSchema = z.object({
  question: z.string().trim().min(1).max(500),
});

const SYSTEM = `You are a friendly senior mechanic at a Tasco partner workshop, helping a customer with their vehicle and their compulsory motor insurance (TNDS).

Rules:
- Answer in the customer's language: Vietnamese if the question is Vietnamese, English otherwise.
- Be concise and practical. 3-6 short sentences.
- Cover what TNDS does and does NOT insure (third-party liability only; not own damage, not wear and tear, not pre-existing defects).
- Never invent discounts — the premium is regulated by vehicle seat count.
- Never promise a specific claim payout amount.
- If a question suggests a safety-critical fault (brakes, tyres, steering), advise stopping driving and getting it inspected.
- Synthetic demo data: say so if the user asks for something that needs real records.`;

/**
 * The LLM path answers in the language of the *question*; the demo path has to
 * agree, otherwise an English question to a Vietnamese-profile customer comes
 * back in Vietnamese and looks broken.
 *
 * Detection is marker-scored rather than fallback-only: Vietnamese-exclusive
 * characters are a strong signal, and otherwise we compare English vs
 * Vietnamese function-word hits. Ties fall back to the customer's preference.
 */
const VI_WORDS =
  /\b(tôi|anh|chị|xe|bảo hiểm|bao hiểm|bao nhiêu|không|giá|phí|quyền lợi|cảm ơn|hỏi|được|thế nào|như nào|nhờ|vui lòng|gì|đây|đó)\b/giu;
const EN_WORDS =
  /\b(how|what|why|when|where|which|can|could|do|does|is|are|was|the|my|me|about|please|tell|explain|file|filing|cover|premium|insurance|car|help|thanks|need|want)\b/giu;

function detectLang(question: string, fallback: "vi" | "en"): "vi" | "en" {
  // Characters that only occur in Vietnamese settle it immediately.
  if (/[ăâđêôơưĂÂĐÊÔƠƯ]|[̀-ͯ]/u.test(question)) return "vi";

  const vi = (question.match(VI_WORDS) ?? []).length;
  const en = (question.match(EN_WORDS) ?? []).length;
  if (en > vi) return "en";
  if (vi > en) return "vi";
  return fallback;
}

/** Canned answers so the workshop still works with no LLM key configured. */
function demoAnswer(
  session: DemoSession,
  customerId: string,
  question: string,
  lang: "vi" | "en",
) {
  const vehicle = session.vehicles.find((v) => v.customerId === customerId);
  const policy = session.policies.find((p) => p.customerId === customerId);
  if (!vehicle || !policy) {
    return lang === "en"
      ? "I could not find that vehicle on your record."
      : "Em không tìm thấy xe này trên hồ sơ của anh/chị.";
  }

  const premium = getRegulatedPremium(vehicle.vehicleType);
  const q = question.toLowerCase();
  const car = `${vehicle.make} ${vehicle.model} (${vehicle.year}), biển ${vehicle.plate}`;

  const pick = (...keys: string[]) => keys.some((k) => q.includes(k));

  if (pick("bảo hiểm", "cover", "insure", "bao hiem", "bảo hiểm", "tnds")) {
    return lang === "en"
      ? `TNDS covers third-party liability: if your ${car} injures someone else or damages their property, Tasco covers you up to the regulated limit. It does NOT cover repairs to your own car, mechanical wear, or pre-existing damage.\n\nYour regulated premium is ${formatVnd(premium)}/year — set by seat count, so it cannot be discounted.`
      : `TNDS bảo hiểm trách nhiệm dân sự: nếu xe ${car} gây thiệt hại cho người khác, Tasco bồi thường cho anh/chị. TNDS KHÔNG bảo hiểm sửa xe của chính mình, hao mòn cơ khí, hay hư hỏng có sẵn.\n\nPhí quy định của anh/chị là ${formatVnd(premium)}/năm — ấn định theo số chỗ ngồi, không giảm giá được.`;
  }

  if (pick("claim", "bồi thường", "boi thuong", "khiếu nại")) {
    return lang === "en"
      ? `File a claim right here at the Claims desk in this workshop.\n\n1. Describe what happened and add up to 3 photos.\n2. The claim moves to "under review" and an adjuster picks it up.\n3. If it involves injury or another vehicle, a human adjuster calls you.\n\nTip: photos of the whole car, the damaged panel, and the other vehicle's plate speed things up.`
      : `Anh/chị khai báo ngay tại bàn Bồi thường trong xưởng này.\n\n1. Mô tả sự cố và tải lên tối đa 3 ảnh.\n2. Hồ sơ chuyển sang "đang xem xét" và giám định viên tiếp nhận.\n3. Nếu có thương tích hoặc liên quan xe khác, giám định viên sẽ gọi cho anh/chị.\n\nMẹo: chụp toàn cảnh xe, vùng hư hỏng và biển xe bên kia sẽ giúp xử lý nhanh hơn.`;
  }

  if (pick("phí", "premium", "giá", "bao nhiêu", "cost")) {
    return lang === "en"
      ? `Your ${vehicle.year} ${vehicle.make} ${vehicle.model} falls in the "${vehicle.vehicleType.replace(/_/g, " ")}" bracket, so the regulated premium is ${formatVnd(premium)} per year. It is set by law — no discount, no negotiation.\n\nYour current policy expires ${policy.expiresAt.slice(0, 10)}.`
      : `Xe ${vehicle.year} ${vehicle.make} ${vehicle.model} của anh/chị thuộc nhóm "${vehicle.vehicleType.replace(/_/g, " ")}", nên phí quy định là ${formatVnd(premium)}/năm. Mức này do Nghị định 03 quy định — không giảm, không thương lượng.\n\nHợp đồng hiện tại hết hạn ngày ${policy.expiresAt.slice(0, 10)}.`;
  }

  if (pick("brake", "phanh", "lốp", "tyre", "tire", "steering", "lái")) {
    return lang === "en"
      ? `Brakes, tyres and steering are safety-critical — if any of them feel wrong, stop driving and get them inspected before anything else.\n\nNote that TNDS does not cover your own mechanical repairs, so this is an out-of-pocket cost. The Inspection pad in this workshop gives you a free synthetic walk-around.`
      : `Phanh, lốp và lái là các hệ thống an toàn — nếu thấy bất thường, anh/chị nên dừng xe kiểm tra ngay.\n\nLưu ý TNDS không bồi thường sửa chữa cơ khí của chính xe, nên chi phí này do anh/chị tự trả. Khu Kiểm tra trong xưởng sẽ cho anh/chị kiểm tra tổng quan miễn phí (dữ liệu mô phỏng).`;
  }

  return lang === "en"
    ? `Your car on record: ${car}.\nTNDS expires ${policy.expiresAt.slice(0, 10)}, regulated premium ${formatVnd(premium)}.\n\nI can explain coverage, walk you through filing a claim, or flag a safety issue. What would you like to know?`
    : `Xe của anh/chị trên hồ sơ: ${car}.\nTNDS hết hạn ${policy.expiresAt.slice(0, 10)}, phí quy định ${formatVnd(premium)}.\n\nEm có thể giải thích quyền lợi bảo hiểm, hướng dẫn khai báo bồi thường, hoặc chỉ ra lỗi an toàn. Anh/chị muốn hỏi gì ạ?`;
}

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const session = await getOrCreateSession(auth.sessionId);
  if (!hasPermission(auth.persona, "workshop:use", session.settings.permissionOverrides)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const limited = await checkChatRateLimit(`workshop:${auth.sessionId}`);
  if (!limited.ok) {
    return Response.json(
      { error: "Too many questions. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  const parsed = AskSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Question must be 1–500 characters" }, { status: 400 });
  }

  // A customer may only ask about their own car; staff may ask about anyone.
  const customerId =
    auth.persona === "customer"
      ? getDemoCustomerId(auth.customerId || "minh")
      : getDemoCustomerId("minh");

  const customer = session.customers.find((c) => c.id === customerId);
  const vehicle = session.vehicles.find((v) => v.customerId === customerId);
  if (!customer || !vehicle) {
    return Response.json({ error: "Customer not found" }, { status: 404 });
  }

  const hasKey =
    Boolean(process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY) ||
    Boolean(process.env.ANTHROPIC_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY) ||
    Object.values(session.settings.providerKeys ?? {}).some(Boolean);

  if (!hasKey) {
    const lang = detectLang(
      parsed.data.question,
      customer.preferredLanguage === "en" ? "en" : "vi",
    );
    return Response.json({
      demo: true,
      text: demoAnswer(session, customerId, parsed.data.question, lang),
    });
  }

  const result = streamText({
    model: await getModel(session, "chat"),
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `My vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.year}), plate ${vehicle.plate}.\nMy question: ${parsed.data.question}`,
      },
    ],
    // Advisory only — the workshop chat must not be able to mutate case state.
    tools: {},
  });

  return result.toTextStreamResponse();
}
