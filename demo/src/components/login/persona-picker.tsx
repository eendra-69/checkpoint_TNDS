"use client";

import Image from "next/image";
import { useState } from "react";
import { signInWithForm } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import type { DemoCustomerId, PersonaId } from "@/lib/types";

export type CustomerOption = {
  key: DemoCustomerId;
  label: string;
  blurb: string;
  path?: string;
};

export type StaffOption = {
  id: PersonaId;
  label: string;
  description: string;
  img: string;
};

const NAME_MAX = 24;

/**
 * Sign-in is a shared-room demo, so the chosen display name is what other
 * users see on your avatar in the office, workshop and lounge. It travels in
 * a hidden field on every persona form so one typed name applies whichever
 * persona you pick.
 */
export function PersonaPicker({
  customers,
  staff,
  next,
  continueLabel,
  locale = "vi",
}: {
  customers: CustomerOption[];
  staff: StaffOption[];
  next?: string;
  continueLabel: string;
  locale?: "vi" | "en";
}) {
  const [displayName, setDisplayName] = useState("");

  // The first customer is the happy path and lands in the Virtual Office, so it
  // doubles as the one-click "enter the spaces" target.
  const quickEntry = customers[0];

  const copy =
    locale === "en"
      ? {
          nameLabel: "Your name in the virtual spaces",
          nameHelp: (n: string) =>
            n
              ? `You'll appear as "${n}" above your character in the Office, Workshop and Lounge.`
              : "Other people will see this above your character in the Office, Workshop and Lounge. Leave blank to use your persona name.",
          enter: "Enter the Virtual Office",
          orPick: "Or explore as another persona",
          customerTitle: "Customer journeys",
          staffTitle: "Staff consoles",
        }
      : {
          nameLabel: "Tên của bạn trong không gian ảo",
          nameHelp: (n: string) =>
            n
              ? `Bạn sẽ xuất hiện với tên “${n}” trên nhân vật ở Office, Xưởng và Phòng khách.`
              : "Người khác sẽ thấy tên này trên nhân vật của bạn ở Office, Xưởng và Phòng khách. Để trống để dùng tên persona.",
          enter: "Vào Virtual Office",
          orPick: "Hoặc thử persona khác",
          customerTitle: "Hành trình khách hàng",
          staffTitle: "Màn hình nhân viên",
        };

  const hidden = (
    <input type="hidden" name="displayName" value={displayName.trim()} />
  );

  return (
    <>
      {/* Typing a name should do something on its own — otherwise the field
          reads as a form with no submit. This signs you in as the happy-path
          customer straight into the Virtual Office. */}
      <form
        action={signInWithForm}
        className="mb-6 rounded-2xl border bg-card p-5 shadow-sm"
      >
        {hidden}
        <input type="hidden" name="persona" value="customer" />
        <input
          type="hidden"
          name="customerKey"
          value={quickEntry?.key ?? "minh"}
        />
        <input type="hidden" name="next" value={next || quickEntry?.path || ""} />

        <label
          htmlFor="displayName"
          className="font-display text-base font-semibold text-tasco-ink"
        >
          {copy.nameLabel}
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          {copy.nameHelp(displayName.trim())}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            id="displayName"
            name="displayNameText"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value.slice(0, NAME_MAX))}
            placeholder="e.g. Minh"
            autoComplete="nickname"
            className="w-full max-w-xs rounded-xl border border-border bg-background px-3 py-2.5 text-base text-tasco-ink placeholder:text-muted-foreground/70 focus:border-tasco-lime focus:outline-none focus:ring-2 focus:ring-tasco-lime/30"
          />
          <Button
            type="submit"
            size="lg"
            className="h-auto shrink-0 bg-tasco-leaf px-5 py-2.5 hover:bg-tasco-lime"
          >
            {copy.enter} →
          </Button>
        </div>
      </form>

      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {copy.orPick}
      </p>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="relative h-48 sm:h-56">
            <Image
              src="/brand/persona-driver.jpg"
              alt=""
              fill
              className="object-cover object-top"
              sizes="(max-width:1024px) 100vw, 55vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-tasco-ink/80 to-transparent" />
          </div>
          <div className="px-5 pt-4">
            <h2 className="font-display text-sm font-semibold text-tasco-ink">
              {copy.customerTitle}
            </h2>
          </div>
          <div className="space-y-2 p-5 pt-3">
            {customers.map((c) => (
              <form key={c.key} action={signInWithForm}>
                {hidden}
                <input type="hidden" name="persona" value="customer" />
                <input type="hidden" name="customerKey" value={c.key} />
                {/* An explicit ?next= wins; otherwise fall back to this
                    customer's own entry point (Lan goes straight to voice). */}
                <input type="hidden" name="next" value={next || c.path || ""} />
                <button
                  type="submit"
                  className="w-full rounded-2xl border border-border bg-tasco-mist/40 px-4 py-3 text-left transition hover:border-tasco-lime/50 hover:bg-tasco-mist"
                >
                  <div className="font-semibold text-tasco-ink">{c.label}</div>
                  <div className="text-xs text-muted-foreground">{c.blurb}</div>
                </button>
              </form>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-display text-sm font-semibold text-tasco-ink">
            {copy.staffTitle}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
          {staff.map((p) => (
            <form
              key={p.id}
              action={signInWithForm}
              className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:border-tasco-lime/40"
            >
              {hidden}
              <input type="hidden" name="persona" value={p.id} />
              <input type="hidden" name="next" value={next || ""} />
              <div className="relative h-28">
                <Image
                  src={p.img}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="280px"
                />
                <div className="absolute inset-0 bg-tasco-ink/45" />
              </div>
              <div className="p-4">
                <h2 className="font-display font-semibold text-tasco-ink">
                  {p.label}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                <Button type="submit" className="mt-3 w-full" size="sm">
                  {continueLabel}
                </Button>
              </div>
            </form>
          ))}
          </div>
        </div>
      </div>
    </>
  );
}
