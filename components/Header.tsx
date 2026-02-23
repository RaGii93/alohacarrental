"use client";

import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link } from "@/i18n/navigation";

export function Header() {
  const t = useTranslations();

  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap gap-3 justify-between items-center">
        <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
          EdgeRent Lite
        </Link>
        <nav className="flex items-center gap-2 text-sm font-medium">
          <Link href="/" className="rounded-md px-3 py-2 hover:bg-slate-100 transition-colors">
            {t("nav.home")}
          </Link>
          <Link href="/book" className="rounded-md px-3 py-2 hover:bg-slate-100 transition-colors">
            {t("nav.booking")}
          </Link>
          <Link href="/faq" className="rounded-md px-3 py-2 hover:bg-slate-100 transition-colors">
            {t("nav.faq")}
          </Link>
          <Link href="/fleet" className="rounded-md px-3 py-2 hover:bg-slate-100 transition-colors">
            {t("nav.fleetOverview")}
          </Link>
        </nav>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
