import { nanoid } from "nanoid";
import type { AuditEvent, DemoSession, PersonaId } from "./types";

export function appendAudit(
  session: DemoSession,
  input: {
    persona: PersonaId;
    action: string;
    /** English fallback; `params` drive the localized text (see `describeAudit`). */
    detail: string;
    params?: Record<string, string | number>;
    customerId?: string;
    reason?: string;
  },
): AuditEvent {
  const event: AuditEvent = {
    id: `audit_${nanoid(8)}`,
    at: new Date().toISOString(),
    persona: input.persona,
    action: input.action,
    detail: input.detail,
    params: input.params,
    customerId: input.customerId,
    reason: input.reason,
  };
  session.audit.unshift(event);
  if (session.audit.length > 500) session.audit.length = 500;
  return event;
}