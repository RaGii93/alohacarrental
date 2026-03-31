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
import { MapPinIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";

const HERO_BG = "/home/hero-bg.png";
const HERO_LOGO = "/home/logo.png";

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
        <div className="absolute inset-0 bg-gradient-to-r from-[#071a36]/85 via-[#071a36]/55 to-[#071a36]/20" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pb-20 lg:pt-36">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-6 text-white">
            <h1 className="text-5xl font-extrabold italic leading-[1.08] tracking-tight sm:text-6xl">
              <span className="block">Discover Bonaire</span>
              <span className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="inline-flex rounded-[1.5rem] bg-white/14 px-4 py-3 backdrop-blur-sm">
                  <Image
                    src={HERO_LOGO}
                    alt="Aloha Car Rental"
                    width={280}
                    height={72}
                    className="h-10 w-auto sm:h-12"
                  />
                </span>
                <span>with</span>
              </span>
              <span className="mt-3 block text-[#f7bf00]">Car Rental</span>
            </h1>
            <p className="text-[2rem] font-semibold text-white/90">
              Reliable • Affordable • Island Ready Vehicles
            </p>
            <p className="max-w-3xl text-2xl text-white/75">
              Explore Bonaire&apos;s pink beaches, flamingos and donkey sanctuary, and stunning salt flats at your own pace.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="rounded-full px-8 font-bold shadow-lg"
                onClick={goToBookingPage}
              >
                Book Your Car
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
                View Our Fleet
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
