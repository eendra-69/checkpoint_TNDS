import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { getOrCreateSession } from "@/lib/session";
import { consume } from "@/lib/rate-limit";
import { heartbeat, listPresence, leave } from "@/lib/presence";
import { publicName } from "@/lib/public-name";

const SceneSchema = z.enum(["office", "workshop", "lounge"]);

const BeatSchema = z.object({
  userId: z.string().min(8).max(64),
  scene: SceneSchema,
  x: z.number().finite(),
  z: z.number().finite(),
  facing: z.enum(["down", "left", "right", "up"]),
});


export async function GET(req: Request) {
  const auth = await getAuth();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const scene = SceneSchema.safeParse(
    new URL(req.url).searchParams.get("scene") ?? "office",
  );
  if (!scene.success) {
    return Response.json({ error: "Unknown scene" }, { status: 400 });
  }

  const users = await listPresence(scene.data);
  return Response.json({ users });
}

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await consume(`presence:${auth.sessionId}`, 120, 60);
  if (!limited.ok) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const parsed = BeatSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { userId, scene, x, z, facing } = parsed.data;

  const session = await getOrCreateSession(auth.sessionId);
  if (!hasPermission(auth.persona, "lounge:use", session.settings.permissionOverrides)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await heartbeat({
    userId,
    name: publicName(auth),
    persona: auth.persona,
    scene,
    x,
    z,
    facing,
  });

  // The room comes back with the heartbeat, so a client needs one request per
  // tick instead of a heartbeat plus a separate poll.
  const users = await listPresence(scene);
  return Response.json({ user, users });
}

export async function DELETE(req: Request) {
  const auth = await getAuth();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    userId?: string;
    scene?: string;
  } | null;
  const scene = SceneSchema.safeParse(body?.scene);
  if (scene.success && typeof body?.userId === "string") {
    await leave(scene.data, body.userId);
  }
  return Response.json({ ok: true });
}
