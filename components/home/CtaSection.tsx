"use client";

import { ArrowRightIcon, CalendarCheckIcon, CarFrontIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button.tsx";
import { Link } from "@/i18n/navigation";
import Reveal from "./Reveal";

export default function CtaSection() {
  const t = useTranslations();

  return (
    <section className="relative overflow-hidden bg-[#fffef8] px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,#0b2346_0%,#184f90_55%,#2aa4ce_100%)] px-6 py-8 text-white shadow-[0_35px_100px_-45px_rgba(7,26,54,0.85)] sm:px-8 lg:px-12 lg:py-12">
            <div className="absolute -left-12 top-8 h-32 w-32 rounded-full bg-[#f7bf00]/20 blur-3xl" />
            <div className="animate-float-soft absolute -right-12 bottom-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
              <div className="space-y-4">
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                  Aloha Car Rental
                </span>
                <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {t("landing.ctaSection.title")}
                </h2>
                <p className="max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
                  {t("landing.ctaSection.subtitle")}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-[#f7bf00] px-8 font-bold text-[#071a36] shadow-lg hover:bg-[#ffd447]"
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
                  className="rounded-full border-white/30 bg-white/8 px-8 font-bold text-white hover:bg-white/16 hover:text-white"
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
