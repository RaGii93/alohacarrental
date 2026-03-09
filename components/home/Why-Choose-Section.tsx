"use client";

import {
  ShieldCheckIcon,
  ZapIcon,
  DollarSignIcon,
  HeadphonesIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function WhyChooseSection() {
  const t = useTranslations();

  const features = [
    {
      icon: ShieldCheckIcon,
      title: t("landing.whyChoose.features.selection.title"),
      description: t("landing.whyChoose.features.selection.description"),
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: ZapIcon,
      title: t("landing.whyChoose.features.security.title"),
      description: t("landing.whyChoose.features.security.description"),
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      icon: DollarSignIcon,
      title: t("landing.whyChoose.features.support.title"),
      description: t("landing.whyChoose.features.support.description"),
      bgColor: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      icon: HeadphonesIcon,
      title: t("landing.whyChoose.features.rating.title"),
      description: t("landing.whyChoose.features.rating.description"),
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
  ];

  return (
    <section className="relative bg-[#fffef8] px-4 py-16 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-12 text-center text-3xl font-extrabold italic sm:text-4xl">
          {t("landing.whyChoose.title")}
        </h2>

        <div className="grid gap-8 sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-start gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${feature.bgColor}`}
              >
                <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold">{feature.title}</h3>
                <p className="mt-1 text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
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
            fill="#e0f4ff"
          />
        </svg>
      </div>
    </section>
  );
}
