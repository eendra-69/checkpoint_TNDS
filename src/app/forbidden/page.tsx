import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getAuth } from "@/lib/auth";
import { PERSONAS } from "@/lib/rbac";

export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{ need?: string }>;
}) {
  const { need } = await searchParams;
  const auth = await getAuth();
  const label = auth ? PERSONAS[auth.persona].label : "your role";

  return (
    <AppShell title="Not available for this persona">
      <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">
          {need
            ? `Permission required: ${need}`
            : "You don’t have access to this page."}
        </p>
        <p className="mt-3 text-lg font-semibold text-tasco-deep">
          Not available for {label}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Switch persona to continue exploring the demo.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login">
            <Button>Switch persona</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Home</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}