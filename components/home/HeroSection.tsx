"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { MapPinIcon } from "lucide-react";
import { toast } from "sonner";
import { formatDateForInput, parseKralendijkDate, parseKralendijkDateTime } from "@/lib/datetime";

const HERO_BG = "/home/hero-bg.png";
type HeroSectionProps = {
  locations: { id: string; name: string; address?: string | null }[];
};

export default function HeroSection({ locations }: HeroSectionProps) {
  const t = useTranslations();
  const router = useRouter();

  const defaults = useMemo(() => {
    const today = formatDateForInput(new Date());
    const todayDate = parseKralendijkDate(today) || new Date();
    const tomorrow = new Date(todayDate);
    tomorrow.setDate(todayDate.getDate() + 1);
    return {
      startDate: today,
      endDate: formatDateForInput(tomorrow),
      pickupLocationId: locations[0]?.id ?? "",
      dropoffLocationId: locations[0]?.id ?? "",
    };
  }, [locations]);

  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [pickupTime, setPickupTime] = useState("10:00");
  const [dropoffTime, setDropoffTime] = useState("10:00");
  const [pickupLocationId, setPickupLocationId] = useState(defaults.pickupLocationId);
  const [dropoffLocationId, setDropoffLocationId] = useState(defaults.dropoffLocationId);

  const goToBookingPage = () => {
    if (!startDate || !endDate || !pickupTime || !dropoffTime || !pickupLocationId || !dropoffLocationId) {
      toast.error(t("landing.hero.completeFields"));
      return;
    }

    const start = parseKralendijkDateTime(`${startDate}T${pickupTime}`);
    const end = parseKralendijkDateTime(`${endDate}T${dropoffTime}`);
    if (!start || !end) {
      toast.error(t("landing.hero.completeFields"));
      return;
    }
    if (!(start < end)) {
      toast.error(t("booking.errors.endBeforeStart"));
      return;
    }

    const params = new URLSearchParams({
      startDate,
      endDate,
      pickupTime,
      dropoffTime,
      pickupLocationId,
      dropoffLocationId,
    });

    router.push(`/book?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[700px] overflow-hidden pb-16">
      <div className="absolute inset-0">
        <Image
          src={HERO_BG}
          alt={t("landing.title")}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(96,45,10,0.78)_0%,rgba(96,45,10,0.54)_30%,rgba(228,98,170,0.24)_62%,rgba(255,210,63,0.08)_100%)]" />
        <div className="absolute inset-y-0 left-0 w-[58%] bg-[radial-gradient(circle_at_left_center,rgba(7,26,54,0.38),transparent_72%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pb-20 lg:pt-36">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-6 text-white">
            <h1 className="max-w-4xl text-5xl font-extrabold italic leading-[1.08] tracking-tight text-white drop-shadow-[0_14px_34px_rgba(0,0,0,0.45)] sm:text-6xl">
              {t("landing.hero.headline.line1")}{" "}
              <span className="text-[rgb(255,210,63)] drop-shadow-[0_14px_24px_rgba(0,0,0,0.34)]">
                Aloha
              </span> Car Rental
            </h1>
            <p className="text-[2rem] font-semibold text-[rgba(255,247,237,0.96)] drop-shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
              {t("landing.hero.featureLine")}
            </p>
            <p className="max-w-3xl text-2xl text-white/86 drop-shadow-[0_10px_24px_rgba(0,0,0,0.28)]">
              {t("landing.ctaSection.subtitle")}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="rounded-full bg-[linear-gradient(135deg,rgba(255,145,28,0.98),rgba(255,210,63,0.94))] px-8 font-bold text-[rgb(120,62,9)] shadow-[0_24px_44px_-24px_rgba(255,145,28,0.42)] hover:brightness-[1.03]"
                onClick={goToBookingPage}
              >
                {t("landing.hero.bookButton")}
              </Button>
              <Button
                size="lg"
                className="public-hero-secondary-button rounded-full px-8 font-bold"
                onClick={() =>
                  document
                    .getElementById("fleet")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                {t("landing.hero.viewFleetButton")}
              </Button>
            </div>
          </div>

          <div className="public-hero-panel rounded-2xl p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="public-widget-label text-sm font-semibold">{t("booking.startDate")}</Label>
                  <Input className="public-widget-field" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="public-widget-label text-sm font-semibold">{t("booking.endDate")}</Label>
                  <Input className="public-widget-field" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="public-widget-label text-sm font-semibold">{t("booking.pickupTime")}</Label>
                  <Input className="public-widget-field" type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="public-widget-label text-sm font-semibold">{t("booking.dropoffTime")}</Label>
                  <Input className="public-widget-field" type="time" value={dropoffTime} onChange={(e) => setDropoffTime(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="public-widget-label flex items-center gap-1.5 text-sm font-semibold">
                    <MapPinIcon className="h-3.5 w-3.5 text-[rgb(228,98,170)]" />
                    {t("booking.pickupLocation")}
                  </Label>
                  <Select value={pickupLocationId} onValueChange={setPickupLocationId}>
                    <SelectTrigger className="public-widget-field">
                      <SelectValue placeholder={t("booking.selectLocation")} />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="public-widget-label flex items-center gap-1.5 text-sm font-semibold">
                    <MapPinIcon className="h-3.5 w-3.5 text-[rgb(228,98,170)]" />
                    {t("booking.dropoffLocation")}
                  </Label>
                  <Select value={dropoffLocationId} onValueChange={setDropoffLocationId}>
                    <SelectTrigger className="public-widget-field">
                      <SelectValue placeholder={t("booking.selectLocation")} />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full rounded-full bg-[linear-gradient(135deg,rgba(255,145,28,0.98),rgba(255,210,63,0.94))] py-6 text-base font-bold text-[rgb(120,62,9)] shadow-[0_24px_44px_-24px_rgba(255,145,28,0.42)] hover:brightness-[1.03]"
                onClick={goToBookingPage}
              >
                {t("booking.searchAvailability")}
              </Button>
            </div>
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
            d="M0,20 C240,55 480,5 720,35 C960,65 1200,10 1440,25 L1440,60 L0,60 Z"
            fill="hsl(var(--accent) / 0.6)"
          />
        </svg>
      </div>
    </section>
  );
}
