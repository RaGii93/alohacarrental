"use client";

import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const FLEET = [
  {
    name: "Kia Picanto",
    seats: 4,
    image: "https://cdn.hercules.app/file_yFGdOeJG8q66unQbytbU986r",
  },
  {
    name: "Hyundai Accent",
    seats: 5,
    image: "https://cdn.hercules.app/file_3L50kvQsig85P67iOBZ04ENu",
  },
  {
    name: "SUV",
    seats: 5,
    image: "https://cdn.hercules.app/file_4ON3muL589Ud6JgkMZ2QLW46",
  },
  {
    name: "Pickup",
    seats: 5,
    image: "https://cdn.hercules.app/file_YOIJpVfPdraNk2yiOXDiK3JN",
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
              <img
                src={car.image}
                alt={car.name}
                className="h-40 w-full object-cover sm:h-48"
              />
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
