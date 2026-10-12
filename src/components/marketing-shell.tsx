import Link from "next/link";
import { getAuth } from "@/lib/auth";
import { PersonaPill } from "@/components/persona-pill";
import { DemoWatermark } from "@/components/demo-watermark";

export async function MarketingShell({
  children,
  transparent = false,
}: {
  children: React.ReactNode;
  transparent?: boolean;
}) {
  const auth = await getAuth();

  return (
    <div className="min-h-screen">
      <header
        className={
          transparent
            ? "absolute inset-x-0 top-0 z-20"
            : "hero-gradient text-white"
        }
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <Link href="/" className="flex items-center gap-3 text-white">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 font-display text-lg font-bold tracking-tight">
              T
            </div>
            <div>
              <div className="font-display text-base font-semibold tracking-[0.18em]">
                TASCO
              </div>
              <div className="text-[11px] text-white/70">BeyondPilot Demo</div>
            </div>
          </Link>
          {auth ? (
            <PersonaPill auth={auth} />
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-tasco-deep shadow-sm"
            >
              Sign in as…
            </Link>
          )}
        </div>
      </header>
      {children}
      <DemoWatermark />
    </div>
  );
}
