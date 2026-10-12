import type { CaseState, PersonaId } from "../types";
import type { Permission } from "../rbac";

export type WorkflowTransition = {
  to: CaseState;
  trigger: string;
  actor: "ai" | "customer" | "telesales" | "system";
  permission?: Permission;
};

export type WorkflowNode = {
  id: CaseState;
  label: string;
  description: string;
  transitions: WorkflowTransition[];
};

export const WORKFLOW_NODES: WorkflowNode[] = [
  {
    id: "scored",
    label: "Scored",
    description: "Lead scored with reasons and next-best action",
    transitions: [
      {
        to: "reminded",
        trigger: "Campaign sends Zalo ZNS / VETC banner",
        actor: "system",
        permission: "campaign:run",
      },
    ],
  },
  {
    id: "reminded",
    label: "Reminded",
    description: "Customer received a renewal reminder",
    transitions: [
      {
        to: "engaged",
        trigger: "Customer opens chat / taps banner",
        actor: "customer",
      },
      {
        to: "no_response",
        trigger: "No engagement within SLA",
        actor: "system",
      },
      { to: "opted_out", trigger: "Customer opts out", actor: "customer" },
    ],
  },
  {
    id: "engaged",
    label: "Engaged",
    description: "Conversation started with AI agent",
    transitions: [
      {
        to: "confirmed",
        trigger: "Plate / vehicle confirmed",
        actor: "ai",
      },
      {
        to: "handed_over",
        trigger: "Escalate to human",
        actor: "ai",
      },
    ],
  },
  {
    id: "confirmed",
    label: "Confirmed",
    description: "Policy and vehicle details confirmed",
    transitions: [
      { to: "paid", trigger: "Customer simulates payment", actor: "customer" },
      {
        to: "handed_over",
        trigger: "Customer asks for human help",
        actor: "customer",
      },
    ],
  },
  {
    id: "paid",
    label: "Paid",
    description: "Mock payment completed at regulated premium",
    transitions: [
      {
        to: "issued",
        trigger: "Issue digital certificate",
        actor: "system",
      },
    ],
  },
  {
    id: "issued",
    label: "Issued",
    description: "Digital TNDS certificate with QR verify link",
    transitions: [],
  },
  {
    id: "no_response",
    label: "No response",
    description: "Reminder ignored — voice outreach candidate",
    transitions: [
      {
        to: "voice_call",
        trigger: "Consent-based AI voice call",
        actor: "ai",
        permission: "voice:use",
      },
      { to: "expired", trigger: "Policy expires", actor: "system" },
    ],
  },
  {
    id: "voice_call",
    label: "Voice call",
    description: "AI voice bot in conversation",
    transitions: [
      {
        to: "confirmed",
        trigger: "Customer confirms on call",
        actor: "customer",
      },
      {
        to: "handed_over",
        trigger: "Transfer to telesales",
        actor: "ai",
      },
    ],
  },
  {
    id: "handed_over",
    label: "Handed over",
    description: "In telesales queue with AI summary",
    transitions: [
      {
        to: "link_sent",
        trigger: "Agent sends renewal link",
        actor: "telesales",
        permission: "renewal:send_link",
      },
      {
        to: "engaged",
        trigger: "Customer resumes chat",
        actor: "customer",
      },
    ],
  },
  {
    id: "link_sent",
    label: "Link sent",
    description: "Secure renewal link delivered to customer channel",
    transitions: [
      {
        to: "engaged",
        trigger: "Customer opens renewal link",
        actor: "customer",
      },
    ],
  },
  {
    id: "opted_out",
    label: "Opted out",
    description: "Customer withdrew messaging / call consent",
    transitions: [],
  },
  {
    id: "expired",
    label: "Expired",
    description: "Policy lapsed without renewal",
    transitions: [],
  },
];

export function canTransition(from: CaseState, to: CaseState): boolean {
  const node = WORKFLOW_NODES.find((n) => n.id === from);
  return Boolean(node?.transitions.some((t) => t.to === to));
}

export function transitionMeta(from: CaseState, to: CaseState) {
  return WORKFLOW_NODES.find((n) => n.id === from)?.transitions.find(
    (t) => t.to === to,
  );
}

export const PERSONA_LANES: { id: string; label: string; personas: PersonaId[] }[] =
  [
    { id: "scoring", label: "Scoring engine", personas: ["campaign_manager"] },
    { id: "channels", label: "Zalo / VETC", personas: ["customer"] },
    { id: "voice", label: "Voice bot", personas: ["customer"] },
    { id: "telesales", label: "Telesales", personas: ["telesales"] },
    { id: "issuance", label: "Issuance", personas: ["admin"] },
    { id: "compliance", label: "Compliance", personas: ["compliance"] },
  ];