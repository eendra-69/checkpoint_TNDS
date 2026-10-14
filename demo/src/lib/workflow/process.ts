export type ProcessStep = {
  id: string;
  lane: string;
  label: string;
  description: string;
  channel?: string;
  assumption?: string;
  next: string[];
};

export const PROCESS_LANES = [
  { id: "crm", label: "Campaign / CRM" },
  { id: "zalo", label: "Zalo OA / ZNS" },
  { id: "vetc", label: "VETC App" },
  { id: "voice", label: "AI Voice" },
  { id: "telesales", label: "Telesales" },
  { id: "payment", label: "Payment" },
  { id: "insurer", label: "Insurer issuance" },
  { id: "compliance", label: "Compliance" },
] as const;

export const PROCESS_STEPS: ProcessStep[] = [
  {
    id: "score",
    lane: "crm",
    label: "Score & prioritise",
    description: "Rule-based lead score with readable reasons",
    next: ["consent_filter"],
  },
  {
    id: "consent_filter",
    lane: "compliance",
    label: "Consent filter",
    description: "Exclude customers without messaging / call consent",
    next: ["zns", "vetc_banner", "voice_queue"],
  },
  {
    id: "zns",
    lane: "zalo",
    label: "Zalo ZNS reminder",
    description: "Template notification with plate and expiry",
    assumption: "Zalo Official Account + ZNS templates (pilot)",
    channel: "zalo",
    next: ["chat"],
  },
  {
    id: "vetc_banner",
    lane: "vetc",
    label: "VETC App banner",
    description: "In-app renewal prompt for active VETC users",
    assumption: "VETC App push / in-app slot (pilot)",
    channel: "vetc",
    next: ["chat"],
  },
  {
    id: "chat",
    lane: "zalo",
    label: "AI renewal chat",
    description: "Confirm plate, explain cover, show regulated premium",
    next: ["checkout", "handover"],
  },
  {
    id: "voice_queue",
    lane: "voice",
    label: "AI voice outreach",
    description: "Consent-based call for non-responders",
    assumption: "Voice gateway + Vietnamese TTS/STT (pilot)",
    channel: "voice",
    next: ["handover", "chat"],
  },
  {
    id: "handover",
    lane: "telesales",
    label: "Human handover",
    description: "Warm transfer with AI summary and outcome codes",
    next: ["send_link"],
  },
  {
    id: "send_link",
    lane: "telesales",
    label: "Send renewal link",
    description: "Customer completes confirm + pay themselves",
    next: ["chat"],
  },
  {
    id: "checkout",
    lane: "payment",
    label: "Mock VietQR / MoMo",
    description: "Simulate regulated premium payment",
    assumption: "Payment gateway integration (pilot)",
    next: ["issue"],
  },
  {
    id: "issue",
    lane: "insurer",
    label: "Issue digital certificate",
    description: "QR-verifiable TNDS certificate",
    assumption: "Insurer issuance API (pilot)",
    next: ["audit"],
  },
  {
    id: "audit",
    lane: "compliance",
    label: "Audit log",
    description: "Every AI action, reveal and outcome recorded",
    next: [],
  },
];