import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { getOrCreateSession } from "@/lib/session";
import { consume } from "@/lib/rate-limit";
import { listMessages, postMessage } from "@/lib/lounge";
import { publicName } from "@/lib/public-name";

const MessageSchema = z.object({
  text: z.string().trim().min(1).max(500),
  userId: z.string().min(8).max(64),
});

async function authorize(permission: Parameters<typeof hasPermission>[1]) {
  const auth = await getAuth();
  if (!auth) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };

  const session = await getOrCreateSession(auth.sessionId);
  if (!hasPermission(auth.persona, permission, session.settings.permissionOverrides)) {
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { auth };
}

export async function GET() {
  const gate = await authorize("lounge:use");
  if (gate.error) return gate.error;

  const messages = await listMessages();
  return Response.json({ messages });
}

export async function POST(req: Request) {
  const gate = await authorize("social:chat");
  if (gate.error) return gate.error;
  const auth = gate.auth!;

  // One message every 2s keeps the demo from being used as a spam cannon.
  const limited = await consume(`lounge:${auth.sessionId}`, 30, 60);
  if (!limited.ok) {
    return Response.json(
      { error: "Slow down a little." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  const parsed = MessageSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Message must be 1–500 characters" }, { status: 400 });
  }

  const { message, moderated } = await postMessage({
    text: parsed.data.text,
    name: publicName(auth),
    persona: auth.persona,
  });

  return Response.json({ message: { ...message, userId: parsed.data.userId }, moderated });
}
