"use client";

import { ArrowRightIcon, CalendarCheckIcon, CarFrontIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button.tsx";
import { Link } from "@/i18n/navigation";
import Reveal from "./Reveal";

export default function CtaSection() {
  const t = useTranslations();

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fbfdff_0%,#fff9fc_52%,#f8fbff_100%)] px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.1),transparent_30%),radial-gradient(circle_at_bottom_right,hsl(var(--accent)/0.18),transparent_26%),radial-gradient(circle_at_20%_100%,hsl(192_90%_72%/0.14),transparent_28%)]" />
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-[linear-gradient(135deg,rgba(255,255,255,0.76)_0%,hsl(var(--accent)/0.24)_34%,rgba(255,255,255,0.82)_68%,hsl(192_90%_75%/0.12)_100%)] px-6 py-8 text-[hsl(var(--foreground))] shadow-[0_35px_100px_-45px_hsl(var(--foreground)/0.16)] ring-1 ring-white/60 backdrop-blur-xl sm:px-8 lg:px-12 lg:py-12">
            <div className="absolute -left-12 top-8 h-32 w-32 rounded-full bg-[hsl(var(--accent)/0.28)] blur-3xl" />
            <div className="absolute left-1/3 top-1/2 h-28 w-28 rounded-full bg-[hsl(192_90%_72%/0.14)] blur-3xl" />
            <div className="animate-float-soft absolute -right-12 bottom-0 h-40 w-40 rounded-full bg-[hsl(var(--primary)/0.14)] blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
              <div className="space-y-4">
                <span className="inline-flex rounded-full border border-white/60 bg-white/66 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--primary))] ring-1 ring-white/60 backdrop-blur-xl">
                  Aloha Car Rental
                </span>
                <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
                  {t("landing.ctaSection.title")}
                </h2>
                <p className="max-w-2xl text-base leading-7 text-[hsl(var(--muted-foreground))] sm:text-lg">
                  {t("landing.ctaSection.subtitle")}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-[hsl(var(--primary))] px-8 font-bold text-[hsl(var(--primary-foreground))] shadow-lg hover:bg-[hsl(var(--primary)/0.9)]"
                >
                  <Link href="/book">
                    <CalendarCheckIcon className="h-4 w-4" />
                    {t("landing.ctaSection.button")}
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.74),hsl(192_90%_75%/0.14))] px-8 font-bold text-[hsl(var(--foreground))] ring-1 ring-white/60 backdrop-blur-xl hover:bg-white hover:text-[hsl(var(--foreground))]"
                >
                  <Link href="/fleet">
                    <CarFrontIcon className="h-4 w-4" />
                    {t("nav.fleetOverview")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
