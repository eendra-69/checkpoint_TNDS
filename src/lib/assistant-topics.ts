import type { Locale } from "@/lib/i18n/locale";

export type AssistantTopic =
  | "start"
  | "minh"
  | "consent"
  | "queue"
  | "renewal_link"
  | "reveal"
  | "uplift"
  | "local"
  | "workflow"
  | "national_id";

type Suggestion = { topic?: AssistantTopic; vi: string; en: string };

/** Page-scoped suggestion chips. Chips without a topic fall back to keyword matching. */
export const ASSISTANT_SUGGESTIONS: Record<string, Suggestion[]> = {
  "/": [
    { topic: "start", vi: "Nên thử gì trước?", en: "What should I try first?" },
    { topic: "start", vi: "Persona nào hợp cho Demo Day?", en: "Which persona is best for Demo Day?" },
    { topic: "start", vi: "Tóm tắt câu chuyện gia hạn", en: "Summarise the renewal story" },
  ],
  "/ops": [
    { topic: "minh", vi: "Vì sao Minh có điểm cao?", en: "Why is Minh scored high?" },
    { topic: "consent", vi: "Lọc consent hoạt động thế nào?", en: "How does consent filtering work?" },
    { topic: "consent", vi: "Chạy chiến dịch thì điều gì xảy ra?", en: "What happens when I run a campaign?" },
  ],
  "/agent": [
    { topic: "queue", vi: "Tóm tắt hàng chờ của tôi", en: "Summarise my queue" },
    { topic: "queue", vi: "Hồ sơ nào gấp nhất?", en: "Which case is most urgent?" },
    { topic: "renewal_link", vi: "Gửi link gia hạn thế nào?", en: "How do I send a renewal link?" },
  ],
  "/compliance": [
    { topic: "reveal", vi: "Các lần hiện PII gần đây", en: "Show recent PII reveals" },
    { vi: "Ai đã từ chối cuộc gọi?", en: "Who opted out of calls?" },
    { vi: "Những gì được audit?", en: "What is audited?" },
  ],
  "/metrics": [
    { topic: "uplift", vi: "Giải thích giả định uplift", en: "Explain the uplift assumption" },
    { topic: "uplift", vi: "Chi phí mỗi lượt gia hạn?", en: "What is cost per renewal?" },
    { vi: "Funnel được đếm thế nào?", en: "How is the funnel counted?" },
  ],
  "/admin": [
    { topic: "local", vi: "Dùng Ollama ở đây được không?", en: "Can I use Ollama here?" },
    { vi: "Ghi đè quyền hoạt động thế nào?", en: "How do permission overrides work?" },
    { vi: "API key được lưu ở đâu?", en: "Where do API keys live?" },
  ],
  "/admin/workflow": [
    { topic: "workflow", vi: "Nếu khách không phản hồi thì sao?", en: "What if a customer doesn't respond?" },
    { topic: "national_id", vi: "Ai được xem CCCD?", en: "Who can see national ID?" },
    { vi: "Giải thích trạng thái đã cấp", en: "Explain the issued state" },
  ],
};

export function suggestionsFor(pathname: string, locale: Locale) {
  // Longest prefix wins so /admin/workflow is not shadowed by /admin.
  const key = Object.keys(ASSISTANT_SUGGESTIONS)
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname === k || pathname.startsWith(`${k}/`));
  return (ASSISTANT_SUGGESTIONS[key || "/"] ?? ASSISTANT_SUGGESTIONS["/"]).map((s) => ({
    topic: s.topic,
    text: s[locale],
  }));
}

const KEYWORDS: [AssistantTopic, string[]][] = [
  ["start", ["try first", "demo day", "thử gì"]],
  ["minh", ["minh", "scored high", "điểm cao"]],
  ["consent", ["consent", "đồng ý"]],
  ["queue", ["queue", "urgent", "hàng chờ", "gấp"]],
  ["renewal_link", ["renewal link", "link gia hạn"]],
  ["reveal", ["reveal", "pii", "hiện"]],
  ["uplift", ["uplift", "cost", "chi phí"]],
  ["local", ["ollama", "local"]],
  ["workflow", ["respond", "doesn't", "workflow", "phản hồi"]],
  ["national_id", ["national id", "who can see", "cccd", "ai được xem"]],
];

export function topicFromText(text: string): AssistantTopic | undefined {
  const q = text.toLowerCase();
  return KEYWORDS.find(([, words]) => words.some((w) => q.includes(w)))?.[0];
}
