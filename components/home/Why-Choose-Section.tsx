"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  HeadphonesIcon,
  MapPinnedIcon,
  ShieldCheckIcon,
  StarIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button.tsx";
import { Link } from "@/i18n/navigation";
import Reveal from "./Reveal";

export default function WhyChooseSection() {
  const t = useTranslations();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [imageOpacity, setImageOpacity] = useState(0.72);

  const features = [
    {
      icon: MapPinnedIcon,
      title: t("landing.whyChoose.features.selection.title"),
      description: t("landing.whyChoose.features.selection.description"),
    },
    {
      icon: ShieldCheckIcon,
      title: t("landing.whyChoose.features.security.title"),
      description: t("landing.whyChoose.features.security.description"),
    },
    {
      icon: HeadphonesIcon,
      title: t("landing.whyChoose.features.support.title"),
      description: t("landing.whyChoose.features.support.description"),
    },
    {
      icon: StarIcon,
      title: t("landing.whyChoose.features.rating.title"),
      description: t("landing.whyChoose.features.rating.description"),
    },
  ];

  useEffect(() => {
    let frame = 0;

    const updateParallax = () => {
      frame = 0;
      const node = sectionRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const progress = 1 - Math.min(Math.max(rect.bottom / (rect.height + viewportHeight), 0), 1);
      const offset = Math.max(Math.min((viewportHeight - rect.top) * 0.14, 90), -36);
      const opacity = Math.max(0.22, 0.8 - progress * 0.5);

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
    <section ref={sectionRef} className="public-shell-bg relative overflow-hidden px-4 py-16 pb-24 sm:px-6 lg:px-8 lg:py-24">
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
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,252,255,0.84),rgba(244,250,255,0.72),rgba(241,249,255,0.84))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_left_center,rgba(56,189,248,0.14),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(255,145,28,0.12),transparent_24%),radial-gradient(circle_at_76%_85%,rgba(228,98,170,0.12),transparent_24%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.02fr] lg:items-start">
          <Reveal className="space-y-6">
            <span className="public-eyebrow inline-flex rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
              Island details
            </span>
            <div className="space-y-4">
              <h2 className="public-postcard-title max-w-xl text-3xl font-black sm:text-4xl lg:text-5xl">
                {t("landing.whyChoose.title")}
              </h2>
              <p className="public-postcard-copy max-w-xl text-base sm:text-lg">
                {t("landing.whyChoose.subtitle")}
              </p>
            </div>

            <div className="public-photo-frame rounded-[2rem] p-5">
              <div className="rounded-[1.6rem] bg-white/72 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[rgb(228,98,170)]">Bonaire mood</p>
                <p className="mt-3 max-w-lg text-base leading-8 text-[rgba(46,64,134,0.92)]">
                  The southern slave huts now sit behind this whole section, so the story feels tied directly to Bonaire&apos;s landscape while the image glides away as you scroll.
                </p>
                <div className="mt-5 inline-flex rounded-full bg-[rgba(255,241,247,0.86)] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[rgb(141,74,11)]">
                  Scroll to see the image drift
                </div>
              </div>
            </div>

            <Button asChild size="lg" className="public-primary-button rounded-full px-8 font-bold">
              <Link href="/book">
                {t("landing.ctaSection.button")}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </Button>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2">
            {features.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 90}>
                <div className="public-glass-card group h-full rounded-[1.9rem] p-6 transition-transform duration-300 hover:-translate-y-1.5">
                  <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-[1.15rem] bg-[linear-gradient(135deg,rgba(255,145,28,0.18),rgba(228,98,170,0.18),rgba(255,210,63,0.16))] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_18px_36px_-24px_rgba(141,74,11,0.2)]">
                    <feature.icon className="h-7 w-7 text-[rgb(141,74,11)]" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight text-[rgb(141,74,11)]">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[rgba(46,64,134,0.92)] sm:text-base">
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            ))}

            <Reveal className="sm:col-span-2">
              <div className="public-photo-frame grid gap-4 rounded-[2rem] p-5 md:grid-cols-3">
                <div className="rounded-[1.45rem] bg-[linear-gradient(135deg,rgba(196,69,142,0.96),rgba(255,145,28,0.92))] p-5 text-white">
                  <div className="text-3xl font-black">24/7</div>
                  <div className="mt-2 text-sm leading-6 text-white/78">{t("landing.whyChoose.features.support.title")}</div>
                </div>
                <div className="rounded-[1.45rem] bg-[rgba(255,246,235,0.96)] p-5 text-[rgb(141,74,11)]">
                  <div className="text-3xl font-black">100%</div>
                  <div className="mt-2 text-sm leading-6 text-[rgba(46,64,134,0.92)]">{t("landing.whyChoose.features.security.title")}</div>
                </div>
                <div className="rounded-[1.45rem] bg-[rgba(255,239,247,0.94)] p-5 text-[rgb(141,74,11)]">
                  <div className="text-3xl font-black">4.9</div>
                  <div className="mt-2 text-sm leading-6 text-[rgba(46,64,134,0.92)]">{t("landing.whyChoose.features.rating.title")}</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
