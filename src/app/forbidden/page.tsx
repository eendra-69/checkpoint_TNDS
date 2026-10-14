import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getAuth } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{ need?: string }>;
}) {
  const { need } = await searchParams;
  const auth = await getAuth();
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const label = auth ? dict.personas[auth.persona].label : locale === "vi" ? "vai trò của bạn" : "your role";

  return (
    <AppShell title={dict.forbidden.title}>
      <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">
          {need
            ? locale === "vi"
              ? `Cần quyền: ${need}`
              : `Permission required: ${need}`
            : dict.forbidden.body}
        </p>
        <p className="mt-3 text-lg font-semibold text-tasco-deep">
          {locale === "vi" ? `Không khả dụng cho ${label}` : `Not available for ${label}`}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login">
            <Button>{dict.chrome.signIn}</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">{dict.forbidden.back}</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
