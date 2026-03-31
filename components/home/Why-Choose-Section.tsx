"use client";

import {
  ArrowRightIcon,
  ShieldCheckIcon,
  ZapIcon,
  DollarSignIcon,
  HeadphonesIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button.tsx";
import { Link } from "@/i18n/navigation";
import Reveal from "./Reveal";

export default function WhyChooseSection() {
  const t = useTranslations();

  const features = [
    {
      icon: ShieldCheckIcon,
      title: t("landing.whyChoose.features.selection.title"),
      description: t("landing.whyChoose.features.selection.description"),
      bgColor: "bg-[linear-gradient(135deg,hsl(var(--accent)/0.42),rgba(255,255,255,0.72))]",
      iconColor: "text-[hsl(var(--primary))]",
    },
    {
      icon: ZapIcon,
      title: t("landing.whyChoose.features.security.title"),
      description: t("landing.whyChoose.features.security.description"),
      bgColor: "bg-[linear-gradient(135deg,hsl(var(--primary)/0.22),rgba(255,255,255,0.72))]",
      iconColor: "text-[hsl(var(--accent-foreground))]",
    },
    {
      icon: DollarSignIcon,
      title: t("landing.whyChoose.features.support.title"),
      description: t("landing.whyChoose.features.support.description"),
      bgColor: "bg-[linear-gradient(135deg,hsl(192_90%_75%/0.22),hsl(var(--accent)/0.28))]",
      iconColor: "text-[hsl(var(--primary))]",
    },
    {
      icon: HeadphonesIcon,
      title: t("landing.whyChoose.features.rating.title"),
      description: t("landing.whyChoose.features.rating.description"),
      bgColor: "bg-[linear-gradient(135deg,hsl(var(--primary)/0.22),rgba(255,255,255,0.72))]",
      iconColor: "text-[hsl(var(--accent-foreground))]",
    },
  ];

  return (
    <section className="public-shell-bg relative overflow-hidden px-4 py-16 pb-24 sm:px-6 lg:px-8 lg:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_left_center,rgba(23,184,197,0.1),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(15,39,64,0.08),transparent_28%),radial-gradient(circle_at_75%_85%,rgba(194,178,128,0.1),transparent_24%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <Reveal className="space-y-6">
            <span className="public-eyebrow inline-flex rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
              Aloha Car Rental
            </span>
            <div className="space-y-4">
              <h2 className="max-w-xl text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl lg:text-5xl">
                {t("landing.whyChoose.title")}
              </h2>
              <p className="max-w-xl text-base leading-7 text-[hsl(var(--muted-foreground))] sm:text-lg">
                {t("landing.whyChoose.subtitle")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="public-glass-card rounded-[1.5rem] p-5">
                <div className="text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))]">24/7</div>
                <div className="mt-1 text-sm font-medium text-[hsl(var(--muted-foreground))]">
                  {t("landing.whyChoose.features.support.title")}
                </div>
              </div>
              <div className="public-glass-card rounded-[1.5rem] p-5">
                <div className="text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))]">100%</div>
                <div className="mt-1 text-sm font-medium text-[hsl(var(--muted-foreground))]">
                  {t("landing.whyChoose.features.security.title")}
                </div>
              </div>
              <div className="public-glass-card rounded-[1.5rem] p-5">
                <div className="text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))]">4.9</div>
                <div className="mt-1 text-sm font-medium text-[hsl(var(--muted-foreground))]">
                  {t("landing.whyChoose.features.rating.title")}
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
                <div className="public-glass-card group h-full rounded-[1.75rem] p-6 transition-transform duration-300 hover:-translate-y-1.5">
                  <div
                    className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bgColor} shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_16px_34px_-22px_hsl(var(--primary)/0.24)]`}
                  >
                    <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[hsl(var(--muted-foreground))] sm:text-base">
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 translate-y-[1px]">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          preserveAspectRatio="none"
          className="block h-[60px] w-full"
        >
          <path
            d="M0,30 C480,60 960,0 1440,40 L1440,60 L0,60 Z"
            fill="rgba(226,232,240,0.9)"
          />
        </svg>
      </div>
    </section>
  );
}
