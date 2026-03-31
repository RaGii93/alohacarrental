"use client";

import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { CarFrontIcon, ChevronRightIcon, GaugeIcon, ShieldCheckIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getBlobProxyUrl } from "@/lib/blob";
import Reveal from "./Reveal";

type FleetSectionProps = {
  categories: { id: string; name: string; seats: number; imageUrl: string | null }[];
};

const CARD_ACCENTS = [
  "from-[hsl(var(--accent)/0.28)] via-white to-white",
  "from-[hsl(var(--primary)/0.08)] via-white to-white",
  "from-[hsl(var(--accent)/0.22)] via-white to-white",
  "from-[hsl(var(--primary)/0.06)] via-white to-white",
];

export default function FleetSection({ categories }: FleetSectionProps) {
  const t = useTranslations();

  return (
    <section
      id="fleet"
      className="relative overflow-hidden bg-[linear-gradient(180deg,#fbfbfd_0%,#ffffff_52%,#faf7fc_100%)] px-4 py-16 pb-24 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_42%),radial-gradient(circle_at_top_right,hsl(var(--accent)/0.18),transparent_34%)]" />

      <div className="relative mx-auto max-w-7xl">
        <Reveal className="mb-12 flex flex-col gap-6 lg:mb-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex w-fit rounded-full border border-[hsl(var(--border))] bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--accent-foreground))] shadow-sm backdrop-blur">
              Aloha Car Rental
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl lg:text-5xl">
              {t("landing.fleet.title")}
            </h2>
            <p className="max-w-xl text-base leading-7 text-[hsl(var(--muted-foreground))] sm:text-lg">
              {t("landing.whyChoose.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-[hsl(var(--border))] bg-white/70 px-5 py-3 text-sm font-semibold text-[hsl(var(--foreground))] shadow-sm backdrop-blur">
            <ShieldCheckIcon className="h-4 w-4 text-[hsl(var(--primary))]" />
            <span>{t("landing.hero.featureLine")}</span>
          </div>
        </Reveal>

        {categories.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map((category, index) => {
              const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
              const imageSrc = category.imageUrl
                ? category.imageUrl.startsWith("/")
                  ? category.imageUrl
                  : getBlobProxyUrl(category.imageUrl) || category.imageUrl
                : null;

              return (
                <Reveal key={category.id} delay={index * 90}>
                  <Card className="group overflow-hidden rounded-[1.75rem] border-[hsl(var(--border))] bg-white p-0 shadow-[0_22px_50px_-42px_hsl(var(--foreground)/0.14)] transition-transform duration-300 hover:-translate-y-2">
                    <div className={`relative overflow-hidden bg-linear-to-br ${accent}`}>
                      <div className="absolute left-4 top-4 z-10 rounded-full border border-white/70 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--accent-foreground))] shadow-sm backdrop-blur">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-white/70 to-transparent" />
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
                          <GaugeIcon className="h-12 w-12 text-[hsl(var(--muted-foreground))]" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-5 p-5">
                      <div className="space-y-2">
                        <h3 className="text-xl font-extrabold tracking-tight text-[hsl(var(--foreground))]">{category.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                          <UsersIcon className="h-4 w-4 text-[hsl(var(--primary))]" />
                          <span>{t("landing.fleet.seats", { count: category.seats })}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl bg-[hsl(var(--accent)/0.2)] px-4 py-3 text-sm text-[hsl(var(--foreground))]">
                        <div className="flex items-center gap-2">
                          <CarFrontIcon className="h-4 w-4 text-[hsl(var(--primary))]" />
                          <span className="font-semibold">{t("nav.fleetOverview")}</span>
                        </div>
                        <ChevronRightIcon className="h-4 w-4 text-[hsl(var(--primary))]" />
                      </div>

                      <Button asChild className="w-full rounded-full font-bold">
                        <Link href="/book">{t("landing.fleet.reserveNow")}</Link>
                      </Button>
                    </div>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <Card className="rounded-[1.75rem] border-[hsl(var(--border))] bg-white p-8 text-center shadow-[0_22px_50px_-42px_hsl(var(--foreground)/0.12)]">
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
