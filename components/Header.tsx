"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link, usePathname } from "@/i18n/navigation";
import { CalendarCheck, CarFront, CircleHelp, House } from "lucide-react";
import Image from "next/image";

export function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = pathname === "/";
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navLinkClass = (href: string) =>
    `rounded-md px-3 py-2 transition-colors inline-flex items-center gap-1.5 ${
      isActive(href)
        ? "bg-primary text-primary-foreground"
        : "hover:bg-slate-100"
    }`;

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors ${
        isHome
          ? "border-transparent bg-transparent"
          : scrolled
            ? "bg-white"
            : "bg-white/95 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Image
            src="/home/logo.png"
            alt="Aloha Car Rental"
            width={164}
            height={48}
            className="h-10 w-auto"
            priority
          />
        </Link>
        <nav className="flex items-center gap-2 text-sm font-medium">
          <Link href="/" className={navLinkClass("/")}>
            <House className="h-4 w-4" />
            {t("nav.home")}
          </Link>
          <Link href="/book" className={navLinkClass("/book")}>
            <CalendarCheck className="h-4 w-4" />
            {t("nav.booking")}
          </Link>
          <Link href="/faq" className={navLinkClass("/faq")}>
            <CircleHelp className="h-4 w-4" />
            {t("nav.faq")}
          </Link>
          <Link href="/fleet" className={navLinkClass("/fleet")}>
            <CarFront className="h-4 w-4" />
            {t("nav.fleetOverview")}
          </Link>
        </nav>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
