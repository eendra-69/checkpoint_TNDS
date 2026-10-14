import Link from "next/link";
import { PERSONAS } from "@/lib/rbac";
import type { AuthCookie } from "@/lib/auth-token";
import { resetDemo, signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function PersonaPill({
  auth,
  labels,
}: {
  auth: AuthCookie;
  labels?: { reset: string; signOut: string; switch: string };
}) {
  const persona = PERSONAS[auth.persona];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/login"
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/20"
      >
        <span className="h-2 w-2 rounded-full bg-tasco-lime" />
        {persona.label}
        {auth.customerId ? ` · ${auth.customerId}` : ""}
        <span className="opacity-70">{labels?.switch ?? "Switch"}</span>
      </Link>
      <form action={resetDemo}>
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          className="text-white/80 hover:bg-white/10 hover:text-white"
        >
          {labels?.reset ?? "Reset demo"}
        </Button>
      </form>
      <form action={signOut}>
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          className="text-white/80 hover:bg-white/10 hover:text-white"
        >
          {labels?.signOut ?? "Sign out"}
        </Button>
      </form>
    </div>
  );
}
