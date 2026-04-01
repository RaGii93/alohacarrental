"use client";

import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { CarFrontIcon, ChevronRightIcon, GaugeIcon, ShieldCheckIcon, SparklesIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getBlobProxyUrl } from "@/lib/blob";
import Reveal from "./Reveal";

type FleetSectionProps = {
  categories: { id: string; name: string; seats: number; imageUrl: string | null; features: string[] }[];
};

const CARD_ACCENTS = [
  "from-[rgba(255,255,255,0.9)] via-[hsl(var(--accent)/0.2)] to-[hsl(var(--primary)/0.08)]",
  "from-[rgba(255,255,255,0.88)] via-[hsl(var(--primary)/0.16)] to-[hsl(var(--accent)/0.08)]",
  "from-[rgba(255,255,255,0.88)] via-[hsl(var(--accent)/0.18)] to-[rgba(255,255,255,0.92)]",
  "from-[rgba(255,255,255,0.9)] via-[hsl(var(--primary)/0.14)] to-[hsl(var(--accent)/0.12)]",
];

export default function FleetSection({ categories }: FleetSectionProps) {
  const t = useTranslations();
  const featuredCategories = categories.slice(0, 4);

  return (
    <section
      id="fleet"
      className="public-shell-bg relative overflow-hidden px-4 py-16 pb-24 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(19,120,152,0.12),transparent_42%),radial-gradient(circle_at_top_right,rgba(23,184,197,0.12),transparent_34%)]" />
      <div className="absolute inset-y-0 left-0 w-72 bg-[radial-gradient(circle_at_left,rgba(23,184,197,0.08),transparent_60%)]" />
      <div className="absolute inset-y-0 right-0 w-72 bg-[radial-gradient(circle_at_right,rgba(15,39,64,0.08),transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl">
        <Reveal className="mb-12 flex flex-col gap-6 lg:mb-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="public-eyebrow inline-flex w-fit rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
              Aloha Car Rental
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl lg:text-5xl">
              {t("landing.fleet.title")}
            </h2>
            <p className="max-w-xl text-base leading-7 text-[hsl(var(--muted-foreground))] sm:text-lg">
              {t("landing.whyChoose.subtitle")}
            </p>
          </div>
          <div className="public-chip flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold">
            <ShieldCheckIcon className="h-4 w-4 text-[rgb(19,120,152)]" />
            <span>{t("landing.hero.featureLine")}</span>
          </div>
        </Reveal>

        {featuredCategories.length ? (
          <div className="space-y-8">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {featuredCategories.map((category, index) => {
              const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
              const imageSrc = category.imageUrl
                ? category.imageUrl.startsWith("/")
                  ? category.imageUrl
                  : getBlobProxyUrl(category.imageUrl) || category.imageUrl
                : null;

              return (
                <Reveal key={category.id} delay={index * 90}>
                  <Card className="public-glass-card group overflow-hidden rounded-[1.9rem] p-0 transition-transform duration-300 hover:-translate-y-2">
                    <div className={`relative overflow-hidden bg-linear-to-br ${accent}`}>
                      <div className="absolute left-4 top-4 z-10 rounded-full border border-[rgba(15,39,64,0.08)] bg-white/92 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(15,39,64)] shadow-[0_12px_28px_-20px_rgba(15,23,42,0.18)] backdrop-blur-xl">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="absolute -right-10 top-10 h-28 w-28 rounded-full bg-[rgba(23,184,197,0.12)] blur-3xl" />
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-white/72 via-white/18 to-transparent" />
                      {imageSrc ? (
                        <div className="relative h-52 w-full">
                          <img
                            src={imageSrc}
                            alt={category.name}
                            className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="flex h-52 w-full items-center justify-center p-6">
                          <GaugeIcon className="h-12 w-12 text-[rgb(100,116,139)]" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-5 p-5">
                      <div className="space-y-2">
                        <h3 className="text-xl font-extrabold tracking-tight text-[hsl(var(--foreground))]">{category.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                          <UsersIcon className="h-4 w-4 text-[rgb(19,120,152)]" />
                          <span>{t("landing.fleet.seats", { count: category.seats })}</span>
                        </div>
                        {category.features.length ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {category.features.slice(0, 3).map((feature) => (
                              <span
                                key={feature}
                                className="public-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(19,120,152)]"
                              >
                                <SparklesIcon className="h-3.5 w-3.5" />
                                <span>{feature}</span>
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between rounded-[1.15rem] border border-[rgba(15,39,64,0.08)] bg-[rgba(248,250,252,0.92)] px-4 py-3 text-sm text-[rgb(15,39,64)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-xl">
                        <div className="flex items-center gap-2">
                          <CarFrontIcon className="h-4 w-4 text-[rgb(19,120,152)]" />
                          <span className="font-semibold">{t("nav.fleetOverview")}</span>
                        </div>
                        <ChevronRightIcon className="h-4 w-4 text-[rgb(19,120,152)]" />
                      </div>

                      <Button asChild className="public-primary-button w-full rounded-full font-bold">
                        <Link href="/book">{t("landing.fleet.reserveNow")}</Link>
                      </Button>
                    </div>
                  </Card>
                </Reveal>
              );
            })}
            </div>

            <Reveal className="flex justify-center">
              <Button
                asChild
                size="lg"
                className="h-13 rounded-full bg-[rgb(19,120,152)] px-10 text-base font-bold text-white shadow-[0_20px_44px_-24px_rgba(19,120,152,0.42)] hover:opacity-95"
              >
                <Link href="/fleet">
                  {t("landing.fleet.seeMore")}
                  <ChevronRightIcon className="h-4 w-4" />
                </Link>
              </Button>
            </Reveal>
          </div>
        ) : (
          <Card className="public-glass-card rounded-[1.75rem] p-8 text-center">
            <p className="text-base font-semibold text-[hsl(var(--foreground))]">{t("fleetPage.emptyTitle")}</p>
          </Card>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 translate-y-[1px]">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          preserveAspectRatio="none"
          className="block h-[60px] w-full"
        >
          <path
            d="M0,40 C360,5 720,55 1080,20 C1280,5 1440,30 1440,30 L1440,60 L0,60 Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
}
