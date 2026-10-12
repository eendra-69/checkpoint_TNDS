import type { PersonaId } from "../types";

export type SchemaField = {
  name: string;
  type: string;
  description: string;
  fullAccess: PersonaId[];
};

export type SchemaEntity = {
  id: string;
  label: string;
  description: string;
  fields: SchemaField[];
  relations: { to: string; label: string }[];
};

export const SCHEMA_ENTITIES: SchemaEntity[] = [
  {
    id: "Customer",
    label: "Customer",
    description: "Vehicle owner / policy holder",
    fields: [
      {
        name: "fullName",
        type: "string",
        description: "Display name",
        fullAccess: ["customer", "telesales", "admin"],
      },
      {
        name: "phone",
        type: "string",
        description: "Mobile number",
        fullAccess: ["customer", "admin"],
      },
      {
        name: "nationalId",
        type: "string",
        description: "CCCD / CMND",
        fullAccess: ["customer", "admin"],
      },
      {
        name: "consent",
        type: "ConsentFlags",
        description: "Messaging, calls, data use",
        fullAccess: ["compliance", "campaign_manager", "admin"],
      },
    ],
    relations: [
      { to: "Vehicle", label: "owns" },
      { to: "Policy", label: "holds" },
      { to: "Consent", label: "grants" },
    ],
  },
  {
    id: "Vehicle",
    label: "Vehicle",
    description: "Registered car (VETC-capable)",
    fields: [
      {
        name: "plate",
        type: "string",
        description: "Licence plate",
        fullAccess: ["customer", "telesales", "campaign_manager", "admin"],
      },
      {
        name: "vehicleType",
        type: "enum",
        description: "Seat band for regulated premium",
        fullAccess: ["customer", "telesales", "admin"],
      },
      {
        name: "incomplete",
        type: "boolean",
        description: "Needs confirmation before issuance",
        fullAccess: ["telesales", "campaign_manager", "admin"],
      },
    ],
    relations: [{ to: "Policy", label: "insured by" }],
  },
  {
    id: "Policy",
    label: "Policy",
    description: "TNDS compulsory motor liability",
    fields: [
      {
        name: "expiresAt",
        type: "datetime",
        description: "Renewal trigger",
        fullAccess: ["customer", "telesales", "campaign_manager", "admin"],
      },
      {
        name: "premiumVnd",
        type: "number",
        description: "Regulated premium (no discount)",
        fullAccess: ["customer", "telesales", "executive", "admin"],
      },
    ],
    relations: [
      { to: "Certificate", label: "issues" },
      { to: "LeadScore", label: "scored as" },
    ],
  },
  {
    id: "Consent",
    label: "Consent",
    description: "Channel and data permissions",
    fields: [
      {
        name: "messaging",
        type: "boolean",
        description: "Zalo / SMS",
        fullAccess: ["compliance", "admin"],
      },
      {
        name: "calls",
        type: "boolean",
        description: "Voice outreach",
        fullAccess: ["compliance", "admin"],
      },
    ],
    relations: [],
  },
  {
    id: "LeadScore",
    label: "LeadScore",
    description: "Transparent rule-based score",
    fields: [
      {
        name: "score",
        type: "number",
        description: "0–100",
        fullAccess: ["campaign_manager", "executive", "admin"],
      },
      {
        name: "reasons",
        type: "string[]",
        description: "Human-readable drivers",
        fullAccess: ["campaign_manager", "admin"],
      },
    ],
    relations: [{ to: "Campaign", label: "targets" }],
  },
  {
    id: "Campaign",
    label: "Campaign",
    description: "Consent-filtered outreach run",
    fields: [
      {
        name: "excluded",
        type: "number",
        description: "Skipped for missing consent",
        fullAccess: ["campaign_manager", "compliance", "admin"],
      },
    ],
    relations: [{ to: "Conversation", label: "opens" }],
  },
  {
    id: "Conversation",
    label: "Conversation",
    description: "Chat or voice transcript",
    fields: [
      {
        name: "channel",
        type: "enum",
        description: "zalo | vetc | voice",
        fullAccess: ["telesales", "compliance", "admin"],
      },
    ],
    relations: [{ to: "Handover", label: "may create" }],
  },
  {
    id: "Handover",
    label: "Handover",
    description: "Warm transfer to telesales",
    fields: [
      {
        name: "summary",
        type: "string",
        description: "AI-written context",
        fullAccess: ["telesales", "admin"],
      },
    ],
    relations: [],
  },
  {
    id: "Payment",
    label: "Payment",
    description: "Mock VietQR / MoMo checkout",
    fields: [
      {
        name: "amountVnd",
        type: "number",
        description: "Regulated premium only",
        fullAccess: ["customer", "executive", "admin"],
      },
    ],
    relations: [{ to: "Certificate", label: "unlocks" }],
  },
  {
    id: "Certificate",
    label: "Certificate",
    description: "Digital TNDS with QR verify",
    fields: [
      {
        name: "id",
        type: "string",
        description: "Public verify id",
        fullAccess: ["customer", "telesales", "admin"],
      },
    ],
    relations: [],
  },
  {
    id: "AuditEvent",
    label: "AuditEvent",
    description: "Append-only action log",
    fields: [
      {
        name: "action",
        type: "string",
        description: "What happened",
        fullAccess: ["compliance", "admin"],
      },
      {
        name: "reason",
        type: "string",
        description: "Why (e.g. PII reveal)",
        fullAccess: ["compliance", "admin"],
      },
    ],
    relations: [],
  },
];