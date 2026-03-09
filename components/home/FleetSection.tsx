"use client";

import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import Image from "next/image";

const FLEET = [
  {
    name: "Kia Picanto",
    seats: 4,
    image: "/home/fleet-kia-picanto.png",
  },
  {
    name: "Hyundai Accent",
    seats: 5,
    image: "/home/fleet-hyundai-accent.png",
  },
  {
    name: "SUV",
    seats: 5,
    image: "/home/fleet-suv.png",
  },
  {
    name: "Pickup",
    seats: 5,
    image: "/home/fleet-pickup.png",
  },
];

export default function FleetSection() {
  const t = useTranslations();

  return (
    <section
      id="fleet"
      className="relative bg-linear-to-b from-[#e0f4ff] to-[#f0f9ff] px-4 py-16 pb-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-12 text-center text-3xl font-extrabold italic sm:text-4xl">
          {t("landing.fleet.title")}
        </h2>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {FLEET.map((car) => (
            <Card
              key={car.name}
              className="overflow-hidden border-0 p-0 shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-40 w-full sm:h-48">
                <Image
                  src={car.image}
                  alt={car.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="space-y-2 p-4 text-center">
                <h3 className="text-lg font-bold">{car.name}</h3>
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <UsersIcon className="h-4 w-4" />
                  <span>{t("landing.fleet.seats", { count: car.seats })}</span>
                </div>
                <Button
                  className="w-full rounded-full font-bold"
                  onClick={() => toast.info(t("landing.fleet.comingSoon"))}
                >
                  {t("landing.fleet.reserveNow")}
                </Button>
              </div>
            </Card>
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
            d="M0,40 C360,5 720,55 1080,20 C1280,5 1440,30 1440,30 L1440,60 L0,60 Z"
            fill="#fffef8"
          />
        </svg>
      </div>
    </section>
  );
}
