import Image from "next/image";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { Button } from "@/components/ui/button";
import { getAuth } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function HomePage() {
  const auth = await getAuth();
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const continueHref = !auth
    ? "/login"
    : auth.persona === "customer"
      ? "/office"
      : auth.persona === "telesales"
        ? "/agent"
        : auth.persona === "campaign_manager"
          ? "/ops"
          : auth.persona === "compliance"
            ? "/compliance"
            : auth.persona === "executive"
              ? "/metrics"
              : "/admin";

  const cards = [
    {
      img: "/brand/persona-driver.jpg",
      title: dict.home.personaCustomer,
      body: dict.home.personaCustomerBody,
    },
    {
      img: "/brand/persona-ops.jpg",
      title: dict.home.personaOps,
      body: dict.home.personaOpsBody,
    },
    {
      img: "/brand/persona-voice.jpg",
      title: dict.home.personaVoice,
      body: dict.home.personaVoiceBody,
    },
  ];

  return (
    <MarketingShell transparent>
      <section className="relative min-h-[100svh] overflow-hidden">
        <Image
          src="/brand/hero-night-toll.jpg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-tasco-deep/92 via-tasco-deep/72 to-tasco-navy/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-tasco-deep/80 via-transparent to-tasco-deep/30" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20">
          <p className="font-display text-sm font-semibold tracking-[0.35em] text-tasco-sky">
            TASCO
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl">
            {dict.home.headline}
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/80 sm:text-lg">
            {dict.home.sub}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={continueHref}>
              <Button size="lg" className="bg-white text-tasco-deep hover:bg-tasco-pale">
                {auth ? dict.home.continue : dict.home.enter}
              </Button>
            </Link>
            <Link href="/admin/workflow">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10"
              >
                {dict.home.workflow}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-background px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display text-2xl font-semibold text-tasco-deep sm:text-3xl">
            {dict.home.sectionTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {dict.home.sectionBody}
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {cards.map((card) => (
              <div key={card.title} className="overflow-hidden">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                  <Image
                    src={card.img}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 100vw, 33vw"
                  />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-tasco-deep">
                  {card.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{card.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/login">
              <Button size="lg">{dict.home.signInPersona}</Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
