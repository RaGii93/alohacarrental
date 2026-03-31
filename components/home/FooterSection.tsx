"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Reveal from "./Reveal";

const LOGO_URL = "/home/logo.png";

export default function SiteFooter() {
  const t = useTranslations();
  const year = new Date().getFullYear();
  const footerLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/book", label: t("nav.booking") },
    { href: "/faq", label: t("nav.faq") },
    { href: "/fleet", label: t("nav.fleetOverview") },
  ];

  return (
    <footer
      className="relative -mt-px overflow-hidden bg-[linear-gradient(180deg,#0f172a_0%,#3b0764_100%)] px-4 py-12 text-white sm:px-6 lg:px-8"
      style={{ backgroundColor: "#0f172a" }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-white/12" />
      <div className="absolute left-[-5rem] top-10 h-40 w-40 rounded-full bg-[hsl(var(--primary)/0.24)] blur-3xl" />
      <div className="animate-float-soft absolute right-[-6rem] bottom-0 h-52 w-52 rounded-full bg-[hsl(var(--accent)/0.25)] blur-3xl" />

      <Reveal className="relative mx-auto max-w-7xl">
        <div className="grid gap-10 rounded-[2rem] border border-white/12 bg-white/8 px-6 py-8 shadow-[0_24px_80px_-56px_rgba(0,0,0,0.9)] backdrop-blur sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-5">
            <Image
              src={LOGO_URL}
              alt="Aloha Car Rental"
              width={220}
              height={64}
              className="h-16 w-auto"
            />
            <p className="max-w-md text-sm leading-7 text-white/82">
              Aloha Car Rental — Bonaire, Caribbean Netherlands
            </p>
            <div className="flex flex-wrap gap-3">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm font-medium text-white/88 transition-colors hover:bg-white/16 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-2 text-left lg:text-right">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/58">
              Aloha Car Rental
            </p>
            <p className="text-sm text-white/78">{t("landing.ctaSection.subtitle")}</p>
            <p className="pt-3 text-xs text-white/56">
              © {year} Aloha Car Rental. All rights reserved.
            </p>
          </div>
        </div>
      </Reveal>
    </footer>
  );
}
