import { getAuth } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import { canUseAssistant } from "@/lib/rbac";
import { WORKFLOW_NODES } from "@/lib/workflow/renewal";
import { workflowNodeText } from "@/lib/workflow/i18n";
import { DEMO_CUSTOMERS } from "@/lib/data/seed";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { describeAudit, describeHandover, describeReason } from "@/lib/i18n/generated";
import { topicFromText, type AssistantTopic } from "@/lib/assistant-topics";

function startAnswer(vi: boolean) {
  return vi
    ? "Bắt đầu với Quản lý chiến dịch → Chạy chiến dịch gia hạn → Đổi sang Anh Minh (khách hàng) và gia hạn trong chat → Đổi sang Chị Lan và yêu cầu gặp nhân viên → Mở Telesales → Xem Metrics. Admin có thể mở sơ đồ workflow cho giám khảo."
    : "Start as Campaign manager → Run renewal campaign → Switch to Anh Minh (customer) and renew in chat → Switch to Chị Lan and ask for a human → Open Telesales → Check Metrics. Admin can show the workflow map to judges.";
}

export async function POST(req: Request) {
  const { message, pathname, topic: chipTopic } = (await req.json()) as {
    message: string;
    pathname: string;
    topic?: AssistantTopic;
  };
  const vi = (await getLocale()) === "vi";

  const auth = await getAuth();
  if (!auth) {
    // Guests have no session: only the "where do I start" guide, never session data.
    const topic = chipTopic ?? topicFromText(message || "");
    if (pathname === "/" || topic === "start") {
      return Response.json({ text: startAnswer(vi) });
    }
    return Response.json({
      text: vi
        ? "Hãy đăng nhập với một persona để hỏi thêm — mỗi persona chỉ thấy dữ liệu được phép."
        : "Sign in as a persona to ask more — each persona only sees the data it is allowed to.",
    });
  }

  const session = await getOrCreateSession(auth.sessionId);
  if (!canUseAssistant(auth.persona, session.settings.permissionOverrides)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const minh = session.scores.find(
    (s) => s.customerId === DEMO_CUSTOMERS.minh.customer.id,
  );
  const queue = session.handovers.filter((h) => h.status !== "resolved");
  const reveals = session.audit.filter((a) => a.action === "pii.reveal").slice(0, 5);
  const f = session.funnel;

  const topic: AssistantTopic | undefined =
    pathname === "/" ? "start" : chipTopic ?? topicFromText(message || "");

  let text: string;
  switch (topic) {
    case "start":
      text = startAnswer(vi);
      break;
    case "minh":
      text = minh
        ? vi
          ? `Minh đạt ${minh.score} điểm (${getDictionary("vi").opsBody.propensity[minh.propensity]}) vì: ${minh.reasons.map((r) => describeReason(r, "vi")).join("; ")}.`
          : `Minh scores ${minh.score} (${minh.propensity}) because: ${minh.reasons.map((r) => describeReason(r, "en")).join("; ")}.`
        : vi
          ? "Minh là tài xế happy path, có hoạt động VETC và đã đồng ý nhận Zalo."
          : "Minh is the happy-path demo driver with VETC activity and Zalo consent.";
      break;
    case "consent":
      text = vi
        ? "Chiến dịch tự loại khách thiếu consent nhắn tin/gọi/sử dụng dữ liệu và hiển thị số lượng bị loại. Demo không có bước compliance duyệt riêng (là kiểm soát giai đoạn pilot trong deck)."
        : "Campaigns auto-exclude customers missing messaging/call/data-use consent and show exclusion counts. No separate compliance approval step in this demo (pilot-phase control in the deck).";
      break;
    case "queue":
      text =
        queue.length === 0
          ? vi
            ? "Hàng chờ trống. Chuyển tiếp từ chat (từ khoá: nhân viên) hoặc dùng cuộc gọi của Chị Lan."
            : "Queue is empty. Escalate from chat (keyword: nhân viên) or use Lan’s voice call."
          : vi
            ? `Bạn có ${queue.length} bàn giao. Đầu tiên: ${describeHandover(queue[0], "vi").summary}`
            : `You have ${queue.length} handover(s). Top: ${describeHandover(queue[0], "en").summary}`;
      break;
    case "renewal_link":
      text = vi
        ? "Trên thẻ bàn giao, bấm Gửi link gia hạn. Trạng thái chuyển sang link_sent; khách tự xác nhận và thanh toán trong chat. Telesales không thể tự cấp giấy chứng nhận."
        : "On a handover card, click Send renewal link. That sets state to link_sent; the customer completes confirm + pay in chat. Telesales cannot issue certificates directly.";
      break;
    case "reveal":
      text =
        reveals.length === 0
          ? vi
            ? "Chưa có lần hiện PII nào. Telesales phải nhập lý do để hiện số điện thoại/CCCD; lý do sẽ xuất hiện trong audit log."
            : "No PII reveals yet. Telesales must enter a reason to reveal phone/ID; it appears here in the audit log."
          : `${vi ? "Các lần hiện gần đây" : "Recent reveals"}: ${reveals.map((r) => `${describeAudit(r, vi ? "vi" : "en").detail} (${r.reason})`).join("; ")}`;
      break;
    case "uplift":
      text = vi
        ? "Pitch giả định tăng +8 điểm % tỷ lệ gia hạn trên mức cơ sở 28%, cùng ~4,5 phút tiết kiệm mỗi lượt gia hạn do bot xử lý. Chi phí thấp với model Flash/mini; Web Speech miễn phí."
        : "Pitch assumes +8pp renewal uplift on a 28% baseline, plus ~4.5 minutes saved per bot-handled renewal. Costs stay low with Flash/mini models; Web Speech is free.";
      break;
    case "local":
      text = process.env.VERCEL
        ? vi
          ? "Nhà cung cấp local (Ollama, LM Studio) hiển thị nhưng bị tắt trên Vercel. Chúng chạy được khi tự host — hữu ích cho thông điệp lưu trữ dữ liệu theo Nghị định 13."
          : "Local providers (Ollama, LM Studio) are visible but disabled on Vercel. They work when self-hosted — useful for Decree 13 data-residency messaging."
        : vi
          ? "Nhà cung cấp local đang bật trên máy chủ này. Trỏ base URL tới Ollama (11434) hoặc LM Studio (1234)."
          : "Local providers are enabled on this host. Point base URL at Ollama (11434) or LM Studio (1234).";
      break;
    case "workflow": {
      const node = WORKFLOW_NODES.find((n) => n.id === "no_response");
      text = node
        ? vi
          ? `Nếu không phản hồi: ${workflowNodeText(node, "vi").description}. Tiếp theo: ${node.transitions.map((t) => getDictionary("vi").caseStates[t.to]).join(", ")}.`
          : `If no response: ${node.description}. Next: ${node.transitions.map((t) => getDictionary("en").caseStates[t.to]).join(", ")}.`
        : vi
          ? "Nhánh không phản hồi dẫn tới cuộc gọi AI có consent, rồi bàn giao."
          : "No-response path leads to consent-based voice call, then handover.";
      break;
    }
    case "national_id":
      text = vi
        ? "CCCD đầy đủ: khách hàng (của mình), admin; telesales thấy dạng che cho tới khi Hiện kèm lý do; chiến dịch/lãnh đạo không thấy hoặc chỉ thấy tổng hợp."
        : "Full national ID: customer (own), admin; telesales sees masked until Reveal-with-reason; campaign/executive get none/aggregate.";
      break;
    default:
      text = vi
        ? `Bạn đang ở ${pathname} với vai trò ${auth.persona}. Funnel hiện tại — đã nhắc ${f.reminded}, tương tác ${f.engaged}, đã cấp ${f.issued}, bàn giao ${f.handedOver}. Hãy hỏi về điểm số, consent, hàng chờ, uplift hoặc workflow.`
        : `You're on ${pathname} as ${auth.persona}. Funnel so far — reminded ${f.reminded}, engaged ${f.engaged}, issued ${f.issued}, handed over ${f.handedOver}. Ask about scores, consent, queue, uplift, or workflow.`;
  }

  return Response.json({ text });
}
