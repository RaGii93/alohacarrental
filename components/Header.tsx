"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ArrowRight, CalendarCheck, CarFront, CircleHelp, House, Menu, Sparkles } from "lucide-react";
import Image from "next/image";

export function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  if (pathname?.includes("/admin")) return null;
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
  const navItems = [
    { href: "/", label: t("nav.home"), icon: House },
    { href: "/book", label: t("nav.booking"), icon: CalendarCheck },
    { href: "/faq", label: t("nav.faq"), icon: CircleHelp },
    { href: "/fleet", label: t("nav.fleetOverview"), icon: CarFront },
  ];
  const darkChrome = isHome && !scrolled;

  const navLinkClass = (href: string) =>
    cn(
      "group relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300",
      darkChrome
        ? "text-white/82 hover:bg-white/12 hover:text-white"
        : "text-[#35506d] hover:bg-[#eef7ff] hover:text-[#071a36]",
      isActive(href) &&
        (darkChrome
          ? "bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
          : "bg-[#071a36] text-white shadow-[0_18px_40px_-24px_rgba(7,26,54,0.8)]"),
    );

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-0 pt-0">
      <div
        className={cn(
          "relative overflow-hidden border-b transition-all duration-500",
          darkChrome
            ? "border-white/12 bg-[#071a36]/42 text-white shadow-[0_16px_50px_-30px_rgba(7,26,54,0.85)] backdrop-blur-2xl"
            : "border-[#d7e6f3] bg-white/88 text-[#071a36] shadow-[0_16px_40px_-30px_rgba(7,26,54,0.35)] backdrop-blur-2xl",
        )}
      >
        <div className="mx-auto max-w-[1600px]">
          <div
            className={cn(
              "pointer-events-none absolute inset-0",
              darkChrome
                ? "bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04)_40%,rgba(42,164,206,0.18)_100%)]"
                : "bg-[linear-gradient(135deg,rgba(11,35,70,0.04),rgba(255,255,255,0.65)_38%,rgba(42,164,206,0.08)_100%)]",
            )}
          />
          <div className="animate-float-soft pointer-events-none absolute -left-12 top-2 h-24 w-24 rounded-full bg-[#f7bf00]/15 blur-3xl" />
          <div className="pointer-events-none absolute right-[-2rem] top-[-1rem] h-28 w-28 rounded-full bg-[#2aa4ce]/18 blur-3xl" />
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-px",
              darkChrome ? "bg-white/18" : "bg-[#d7e6f3]",
            )}
          />

          <div className="relative mx-auto flex min-h-[84px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-10">
            <Link href="/" className="group flex items-center gap-3 transition-transform duration-300 hover:translate-x-0.5">
              <div
                className={cn(
                  "relative flex h-16 w-16 items-center justify-center rounded-2xl backdrop-blur-xl",
                  darkChrome ? "bg-white/8" : "bg-white/55",
                )}
              >
                <Image
                  src="/home/logo.png"
                  alt="Aloha Car Rental"
                  width={56}
                  height={56}
                  className="relative h-14 w-14 object-contain"
                  priority
                />
              </div>
              <div className="min-w-0">
                <div className={cn("text-base font-black uppercase tracking-[0.24em]", darkChrome ? "text-white" : "text-[#071a36]")}>
                  Aloha
                </div>
                <div className={cn("flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.28em]", darkChrome ? "text-white/62" : "text-[#4c6781]")}>
                  <Sparkles className="h-3 w-3" />
                  Car Rental
                </div>
              </div>
            </Link>

            <nav
              className={cn(
                "hidden flex-1 items-center justify-center md:flex",
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-2",
                  darkChrome
                    ? "border-white/18 bg-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    : "border-[#d7e6f3] bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]",
                )}
              >
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
                    <Icon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
                    {item.label}
                  </Link>
                );
              })}
              </div>
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <LanguageSwitcher
                triggerClassName={cn(
                  "w-[168px] rounded-full shadow-none",
                  darkChrome
                    ? "border-white/18 bg-white/10 text-white [&_svg]:text-white/72"
                    : "border-[#d7e6f3] bg-white/78 text-[#071a36] [&_svg]:text-[#4c6781]",
                )}
                contentClassName="rounded-2xl border-[#d7e6f3] bg-white/96 backdrop-blur-xl"
              />
              <Button
                asChild
                className={cn(
                  "rounded-full px-6 font-bold shadow-[0_20px_45px_-28px_rgba(7,26,54,0.8)]",
                  darkChrome
                    ? "bg-[#f7bf00] text-[#071a36] hover:bg-[#ffd447]"
                    : "bg-[#071a36] text-white hover:bg-[#0d2d59]",
                )}
              >
                <Link href="/book">
                  {t("landing.ctaSection.button")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors md:hidden",
                    darkChrome
                      ? "border-white/16 bg-white/10 text-white hover:bg-white/14"
                      : "border-[#d7e6f3] bg-white/78 text-[#071a36] hover:bg-[#eef7ff]",
                  )}
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[88vw] border-white/10 bg-[linear-gradient(180deg,#071a36_0%,#103a6a_100%)] p-0 text-white sm:max-w-sm"
              >
                <div className="flex h-full flex-col">
                  <SheetHeader className="border-b border-white/10 px-6 py-6 text-left">
                    <SheetTitle className="text-white">Aloha Car Rental</SheetTitle>
                    <SheetDescription className="text-white/64">
                      {t("landing.hero.featureLine")}
                    </SheetDescription>
                  </SheetHeader>

                  <div className="flex-1 space-y-3 px-6 py-6">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <SheetClose asChild key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors",
                              isActive(item.href)
                                ? "border-white/18 bg-white/12 text-white"
                                : "border-white/10 bg-white/6 text-white/82 hover:bg-white/10",
                            )}
                          >
                            <span className="flex items-center gap-3">
                              <Icon className="h-4 w-4" />
                              {item.label}
                            </span>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </div>

                  <div className="space-y-4 border-t border-white/10 px-6 py-6">
                    <LanguageSwitcher
                      triggerClassName="w-full border-white/14 bg-white/10 text-white shadow-none [&_svg]:text-white/72"
                      contentClassName="rounded-2xl border-[#d7e6f3] bg-white/96 backdrop-blur-xl"
                    />
                    <SheetClose asChild>
                      <Button asChild className="w-full rounded-full bg-[#f7bf00] font-bold text-[#071a36] hover:bg-[#ffd447]">
                        <Link href="/book">
                          {t("landing.ctaSection.button")}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
