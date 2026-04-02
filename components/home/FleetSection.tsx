"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { CarFrontIcon, ChevronRightIcon, MapPinnedIcon, SparklesIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getBlobProxyUrl } from "@/lib/blob";
import Reveal from "./Reveal";

type FleetSectionProps = {
  categories: { id: string; name: string; seats: number; imageUrl: string | null; features: string[] }[];
};

const STORY_STOPS = ["Coastal drives", "Salt flats", "Slave huts"];

export default function FleetSection({ categories }: FleetSectionProps) {
  const t = useTranslations();
  const featuredCategories = categories.slice(0, 4);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [imageOpacity, setImageOpacity] = useState(0.42);

  useEffect(() => {
    let frame = 0;

    const updateParallax = () => {
      frame = 0;
      const node = sectionRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const progress = 1 - Math.min(Math.max(rect.bottom / (rect.height + viewportHeight), 0), 1);
      const offset = Math.max(Math.min((viewportHeight - rect.top) * 0.14, 92), -42);
      const opacity = Math.max(0.14, 0.5 - progress * 0.32);

      setParallaxOffset(offset);
      setImageOpacity(opacity);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="fleet"
      className="public-shell-bg relative overflow-hidden px-4 py-16 pb-24 sm:px-6 lg:px-8 lg:py-24"
    >
      <div
        className="absolute inset-0 scale-[1.08] will-change-transform"
        style={{ transform: `translate3d(0, ${parallaxOffset}px, 0) scale(1.08)`, opacity: imageOpacity }}
      >
        <Image
          src="/images/bonaire/slave-huts-bonaire.jpg"
          alt="Historic slave huts in Bonaire"
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,252,255,0.88),rgba(244,250,255,0.76),rgba(241,249,255,0.9))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(56,189,248,0.14),transparent_26%),radial-gradient(circle_at_85%_10%,rgba(255,145,28,0.12),transparent_24%),radial-gradient(circle_at_82%_86%,rgba(228,98,170,0.12),transparent_22%)]" />

      <div className="relative mx-auto max-w-7xl space-y-10">
        <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <Reveal className="space-y-6">
            <span className="public-eyebrow inline-flex w-fit rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
              Bonaire drives
            </span>
            <div className="space-y-4">
              <h2 className="public-postcard-title max-w-2xl text-3xl font-black sm:text-4xl lg:text-5xl">
                {t("landing.fleet.title")}
              </h2>
              <p className="public-postcard-copy max-w-2xl text-base sm:text-lg">
                {t("landing.fleet.description")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {STORY_STOPS.map((stop) => (
                <span
                  key={stop}
                  className="public-chip rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]"
                >
                  {stop}
                </span>
              ))}
            </div>

            <div className="public-photo-frame rounded-[2rem] p-5">
              <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                <div className="relative min-h-[18rem] overflow-hidden rounded-[1.7rem]">
                  <Image
                    src="/images/bonaire/slave-huts-bonaire.jpg"
                    alt="Historic slave huts in Bonaire"
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,16,36,0.04),rgba(9,16,36,0.42))]" />
                  <div className="public-photo-label absolute bottom-4 left-4 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]">
                    Slave huts
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative min-h-[10rem] overflow-hidden rounded-[1.5rem]">
                    <Image
                      src="/images/bonaire/playa-chikitu.jpg"
                      alt="Playa Chikitu in Bonaire"
                      fill
                      sizes="(max-width: 768px) 100vw, 22vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,16,36,0.02),rgba(9,16,36,0.38))]" />
                    <div className="public-photo-label absolute bottom-3 left-3 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]">
                      Playa Chikitu
                    </div>
                  </div>

                  <div className="relative min-h-[10rem] overflow-hidden rounded-[1.5rem]">
                    <Image
                      src="/images/bonaire/bonaire-aerial.jpg"
                      alt="Aerial view of Bonaire"
                      fill
                      sizes="(max-width: 768px) 100vw, 22vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(96,45,10,0.16),rgba(96,45,10,0.58))]" />
                    <div className="public-photo-label absolute bottom-3 left-3 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]">
                      Island rhythm
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal className="grid gap-4 sm:grid-cols-2">
            {featuredCategories.length ? (
              featuredCategories.map((category, index) => {
                const imageSrc = category.imageUrl
                  ? category.imageUrl.startsWith("/")
                    ? category.imageUrl
                    : getBlobProxyUrl(category.imageUrl) || category.imageUrl
                  : null;

                return (
                  <Card
                    key={category.id}
                    className="public-glass-card group overflow-hidden rounded-[1.85rem] p-0 transition-transform duration-300 hover:-translate-y-2"
                  >
                    <div className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(238,249,255,0.72))]">
                      <div className="absolute left-4 top-4 z-10 rounded-full bg-[rgba(255,255,255,0.88)] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[rgb(141,74,11)] shadow-[0_10px_24px_-20px_rgba(15,23,42,0.25)]">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="absolute -right-8 top-10 h-24 w-24 rounded-full bg-[rgba(255,145,28,0.14)] blur-3xl" />
                      {imageSrc ? (
                        <div className="relative h-52 w-full">
                          <img
                            src={imageSrc}
                            alt={category.name}
                            className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="flex h-52 items-center justify-center">
                          <CarFrontIcon className="h-12 w-12 text-[rgb(141,74,11)]" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 p-5">
                      <div className="space-y-2">
                        <h3 className="text-xl font-black tracking-tight text-[rgb(141,74,11)]">{category.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-[rgba(46,64,134,0.92)]">
                          <UsersIcon className="h-4 w-4 text-[rgb(228,98,170)]" />
                          <span>{t("landing.fleet.seats", { count: category.seats })}</span>
                        </div>
                        {category.features.length ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {category.features.slice(0, 2).map((feature) => (
                              <span
                                key={feature}
                                className="rounded-full bg-[rgba(255,247,237,0.95)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[rgb(141,74,11)]"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between rounded-[1.2rem] bg-[rgba(255,247,237,0.92)] px-4 py-3 text-sm font-semibold text-[rgb(141,74,11)]">
                        <div className="flex items-center gap-2">
                          <MapPinnedIcon className="h-4 w-4 text-[rgb(255,145,28)]" />
                          <span>{t("nav.fleetOverview")}</span>
                        </div>
                        <ChevronRightIcon className="h-4 w-4 text-[rgb(228,98,170)]" />
                      </div>

                      <Button asChild className="public-primary-button w-full rounded-full font-bold">
                        <Link href="/book">{t("landing.fleet.reserveNow")}</Link>
                      </Button>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="public-glass-card rounded-[1.75rem] p-8 text-center sm:col-span-2">
                <p className="text-base font-semibold text-[rgb(141,74,11)]">{t("fleetPage.emptyTitle")}</p>
              </Card>
            )}
          </Reveal>
        </div>

        {featuredCategories.length ? (
          <Reveal className="flex justify-center">
            <Button asChild size="lg" className="public-primary-button rounded-full px-10 text-base font-bold">
              <Link href="/fleet">
                {t("landing.fleet.seeMore")}
                <SparklesIcon className="h-4 w-4" />
              </Link>
            </Button>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
