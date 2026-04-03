"use client";

import Image from "next/image";
import { ArrowRightIcon, CalendarCheckIcon, CarFrontIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button.tsx";
import { Link } from "@/i18n/navigation";
import Reveal from "./Reveal";

export default function CtaSection() {
  const t = useTranslations();

  return (
    <section className="public-shell-bg relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(228,98,170,0.1),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,210,63,0.16),transparent_26%),radial-gradient(circle_at_20%_100%,rgba(255,145,28,0.12),transparent_28%)]" />
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="public-photo-frame relative overflow-hidden rounded-[2.2rem] p-4">
            <div className="relative overflow-hidden rounded-[1.9rem]">
              <div className="absolute inset-0">
                <Image
                  src="/images/Salt Company2.jpeg"
                  alt="Salt company shoreline in Bonaire"
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(96,45,10,0.82)_0%,rgba(154,52,120,0.58)_38%,rgba(255,145,28,0.22)_100%)]" />
              </div>

              <div className="relative grid gap-8 px-6 py-8 text-white sm:px-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:px-12 lg:py-12">
                <div className="space-y-4">
                  <span className="inline-flex rounded-full border border-white/18 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/88 backdrop-blur-xl">
                    Aloha Car Rental
                  </span>
                  <h2 className="max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">
                    {t("landing.ctaSection.title")}
                  </h2>
                  <p className="max-w-2xl text-base leading-8 text-white/82 sm:text-lg">
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
                    className="rounded-full border-white/28 bg-white/12 px-8 font-bold text-white shadow-[0_16px_34px_-28px_rgba(15,23,42,0.34)] hover:bg-white/18 hover:text-white"
                  >
                    <Link href="/fleet">
                      <CarFrontIcon className="h-4 w-4" />
                      {t("nav.fleetOverview")}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
