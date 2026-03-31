"use client";

import { ArrowRightIcon, CalendarCheckIcon, CarFrontIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button.tsx";
import { Link } from "@/i18n/navigation";
import Reveal from "./Reveal";

export default function CtaSection() {
  const t = useTranslations();

  return (
    <section className="public-shell-bg relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,39,64,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(23,184,197,0.14),transparent_26%),radial-gradient(circle_at_20%_100%,rgba(194,178,128,0.12),transparent_28%)]" />
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="public-glass-card-strong relative overflow-hidden rounded-[2rem] px-6 py-8 text-[hsl(var(--foreground))] sm:px-8 lg:px-12 lg:py-12">
            <div className="absolute -left-12 top-8 h-32 w-32 rounded-full bg-[rgba(23,184,197,0.18)] blur-3xl" />
            <div className="absolute left-1/3 top-1/2 h-28 w-28 rounded-full bg-[rgba(194,178,128,0.12)] blur-3xl" />
            <div className="animate-float-soft absolute -right-12 bottom-0 h-40 w-40 rounded-full bg-[rgba(15,39,64,0.12)] blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
              <div className="space-y-4">
                <span className="public-eyebrow inline-flex rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
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
                  className="public-primary-button rounded-full px-8 font-bold"
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
                  className="public-outline-button rounded-full px-8 font-bold"
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
