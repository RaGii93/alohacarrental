"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
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
import { MapPinIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";

const HERO_BG = "https://cdn.hercules.app/file_6LNZzPgCogqgsMeQg2XTyr0A";

type HeroSectionProps = {
  locations: { id: string; name: string; address?: string | null }[];
};

function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function HeroSection({ locations }: HeroSectionProps) {
  const t = useTranslations();
  const router = useRouter();

  const defaults = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return {
      startDate: toIsoDate(today),
      endDate: toIsoDate(tomorrow),
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
  const [driverAge, setDriverAge] = useState("26-35");

  const goToBookingPage = () => {
    if (!startDate || !endDate || !pickupTime || !dropoffTime || !pickupLocationId || !dropoffLocationId) {
      toast.error(t("landing.hero.completeFields"));
      return;
    }

    const start = new Date(`${startDate}T${pickupTime}`);
    const end = new Date(`${endDate}T${dropoffTime}`);
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
      driverAge,
    });

    router.push(`/book?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[620px] overflow-hidden pb-16">
      <div className="absolute inset-0">
        <img
          src={HERO_BG}
          alt={t("landing.title")}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071a36]/85 via-[#071a36]/55 to-[#071a36]/20" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-6 text-white">
            <h1 className="text-5xl font-extrabold italic leading-[1.08] tracking-tight sm:text-6xl">
              <span className="block">{t("landing.hero.headline.line1")}</span>
              <span className="block">
                {t("landing.hero.headline.line2Prefix")}{" "}
                <span className="text-[#f7bf00]">{t("landing.hero.headline.line2Highlight")}</span>
              </span>
              <span className="block">{t("landing.hero.headline.line3")}</span>
            </h1>
            <p className="text-[2rem] font-semibold text-white/90">{t("landing.hero.featureLine")}</p>
            <p className="max-w-xl text-2xl text-white/75">{t("landing.hero.description")}</p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="rounded-full px-8 font-bold shadow-lg"
                onClick={goToBookingPage}
              >
                {t("landing.hero.bookButton")}
              </Button>
              <Button
                size="lg"
                className="rounded-full border-2 border-white/40 bg-white/15 px-8 font-bold text-white shadow-lg backdrop-blur-sm hover:bg-white/25"
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

          <div className="rounded-2xl bg-white/95 p-6 shadow-2xl backdrop-blur-sm">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-foreground">{t("booking.startDate")}</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-foreground">{t("booking.endDate")}</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-foreground">{t("booking.pickupTime")}</Label>
                  <Input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-foreground">{t("booking.dropoffTime")}</Label>
                  <Input type="time" value={dropoffTime} onChange={(e) => setDropoffTime(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <MapPinIcon className="h-3.5 w-3.5 text-primary" />
                    {t("booking.pickupLocation")}
                  </Label>
                  <Select value={pickupLocationId} onValueChange={setPickupLocationId}>
                    <SelectTrigger>
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
                  <Label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <MapPinIcon className="h-3.5 w-3.5 text-primary" />
                    {t("booking.dropoffLocation")}
                  </Label>
                  <Select value={dropoffLocationId} onValueChange={setDropoffLocationId}>
                    <SelectTrigger>
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

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <UserIcon className="h-3.5 w-3.5 text-primary" />
                    {t("landing.hero.driverAge")}
                  </Label>
                  <Select value={driverAge} onValueChange={setDriverAge}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("landing.hero.agePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="21-25">21 - 25</SelectItem>
                      <SelectItem value="26-35">26 - 35</SelectItem>
                      <SelectItem value="36-50">36 - 50</SelectItem>
                      <SelectItem value="51-plus">51+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full rounded-full py-6 text-base font-bold shadow-lg"
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
            fill="#e0f4ff"
          />
        </svg>
      </div>
    </section>
  );
}
