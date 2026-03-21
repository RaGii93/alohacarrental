import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Gauge, Layers3, ShieldCheck, Snowflake, Users } from "lucide-react";
import { db } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { getTenantConfig } from "@/lib/tenant";
import { getBlobProxyUrl } from "@/lib/blob";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = getTenantConfig();
  return buildMetadata({
    locale,
    path: "/fleet",
    title: `Fleet Overview | ${tenant.tenantName}`,
    description: `Browse ${tenant.tenantName}'s island-ready rental categories with transparent daily pricing, seating details, and live fleet visibility.`,
  });
}

export default async function FleetOverviewPage() {
  const t = await getTranslations();
  const categories = await db.vehicleCategory.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      dailyRate: true,
      seats: true,
      transmission: true,
      hasAC: true,
      vehicles: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const currency = (amountCents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amountCents / 100);

  const startingRate = categories.length ? Math.min(...categories.map((category) => category.dailyRate)) : 0;

  const highlightStats = [
    { label: t("fleetPage.stats.startingRate"), value: startingRate ? currency(startingRate) : "-" },
    { label: t("fleetPage.stats.pricing"), value: t("fleetPage.stats.pricingValue") },
    { label: t("fleetPage.stats.booking"), value: t("fleetPage.stats.bookingValue") },
    { label: t("fleetPage.stats.support"), value: t("fleetPage.stats.supportValue") },
  ];

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#eef8ff_0%,#f8fcff_42%,#fffdf6_100%)] pb-20 pt-28 sm:pt-32">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,rgba(42,164,206,0.18),transparent_38%),radial-gradient(circle_at_top_right,rgba(247,191,0,0.18),transparent_34%)]" />
      <div className="absolute left-[-4rem] top-40 h-40 w-40 rounded-full bg-[#2aa4ce]/12 blur-3xl" />
      <div className="animate-float-soft absolute right-[-5rem] top-28 h-56 w-56 rounded-full bg-[#f7bf00]/12 blur-3xl" />

      <div className="relative mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr] lg:items-stretch">
          <div className="rounded-[2rem] border border-[#dcebf8] bg-white/82 p-7 text-[#071a36] shadow-[0_30px_80px_-45px_rgba(7,26,54,0.28)] backdrop-blur-2xl sm:p-9">
            <div className="inline-flex rounded-full border border-[#dcebf8] bg-[#f5fbff] px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#4c6781]">
              {t("fleetPage.badge")}
            </div>
            <div className="mt-5 max-w-3xl space-y-4">
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{t("fleetPage.title")}</h1>
              <p className="max-w-2xl text-lg leading-8 text-[#4c6781]">{t("fleetPage.description")}</p>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dcebf8] bg-[#f5fbff] px-4 py-2 text-sm font-semibold text-[#0b2346]">
                <ShieldCheck className="h-4 w-4 text-[#f7bf00]" />
                <span>{t("fleetPage.highlights.pricing")}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dcebf8] bg-[#f5fbff] px-4 py-2 text-sm font-semibold text-[#0b2346]">
                <Layers3 className="h-4 w-4 text-[#7ed2ff]" />
                <span>{t("fleetPage.highlights.visibility")}</span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="rounded-full bg-[#f7bf00] px-7 font-bold text-[#071a36] hover:bg-[#ffd447]">
                <Link href="/book">
                  {t("fleetPage.primaryCta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-[#dcebf8] bg-white px-7 font-bold text-[#071a36] hover:bg-[#f5fbff]"
              >
                <a href="#fleet-categories">{t("fleetPage.secondaryCta")}</a>
              </Button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#dcebf8] bg-white/72 p-6 shadow-[0_30px_60px_-45px_rgba(7,26,54,0.55)] backdrop-blur-2xl sm:p-7">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5f7a94]">{t("fleetPage.summary.eyebrow")}</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#071a36]">{t("fleetPage.summary.title")}</h2>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {highlightStats.map((item) => (
                <div key={item.label} className="rounded-[1.5rem] border border-white/80 bg-white/75 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                  <div className="text-2xl font-black tracking-tight text-[#071a36]">{item.value}</div>
                  <div className="mt-1 text-sm text-[#4c6781]">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-[1.4rem] border border-[#dcebf8] bg-[#f7fbff] px-4 py-4">
                <p className="text-sm font-semibold text-[#071a36]">{t("fleetPage.summary.pricingTitle")}</p>
                <p className="mt-1 text-sm leading-6 text-[#4c6781]">{t("fleetPage.summary.pricingBody")}</p>
              </div>
              <div className="rounded-[1.4rem] border border-[#dcebf8] bg-[#fffaf0] px-4 py-4">
                <p className="text-sm font-semibold text-[#071a36]">{t("fleetPage.summary.availabilityTitle")}</p>
                <p className="mt-1 text-sm leading-6 text-[#4c6781]">{t("fleetPage.summary.availabilityBody")}</p>
              </div>
            </div>
          </div>
        </div>

        <div id="fleet-categories" className="grid gap-6 lg:grid-cols-2">
          {categories.length ? (
            categories.map((category, index) => {
              return (
                <article
                  key={category.id}
                  className="group overflow-hidden rounded-[2rem] border border-white/70 bg-white/78 shadow-[0_28px_60px_-45px_rgba(7,26,54,0.6)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1.5"
                >
                  <div className="relative overflow-hidden border-b border-[#dcebf8] bg-[linear-gradient(135deg,#f7fbff_0%,#edf7ff_55%,#fff8e8_100%)] p-5">
                    <div className="absolute right-5 top-5 rounded-full border border-white/80 bg-white/88 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#4c6781] shadow-sm backdrop-blur">
                      0{index + 1}
                    </div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5f7a94]">{t("fleetPage.card.categoryLabel")}</p>
                        <h2 className="mt-2 text-3xl font-black tracking-tight text-[#071a36]">{category.name}</h2>
                      </div>
                      <div className="rounded-[1.25rem] bg-[#071a36] px-4 py-3 text-right text-white shadow-[0_18px_35px_-24px_rgba(7,26,54,0.8)]">
                        <div className="text-2xl font-black">{currency(category.dailyRate)}</div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/68">{t("fleetPage.card.perDay")}</div>
                      </div>
                    </div>

                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl.startsWith("/") ? category.imageUrl : getBlobProxyUrl(category.imageUrl) || category.imageUrl}
                        alt={category.name}
                        className="mt-5 h-56 w-full rounded-[1.5rem] border border-white/70 object-cover shadow-[0_24px_50px_-35px_rgba(7,26,54,0.45)]"
                      />
                    ) : (
                      <div className="mt-5 flex h-56 items-center justify-center rounded-[1.5rem] border border-dashed border-[#bfd5ea] bg-white/55">
                        <Gauge className="h-10 w-10 text-[#7fa1bf]" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-5 p-5 sm:p-6">
                    <p className="text-sm leading-7 text-[#4c6781]">
                      {category.description || t("fleetPage.card.defaultDescription")}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#dcebf8] bg-[#f5fbff] px-3 py-2 text-sm font-semibold text-[#0b2346]">
                        <Users className="h-4 w-4 text-[#2aa4ce]" />
                        <span>{t("fleetPage.card.seats", { count: category.seats })}</span>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#dcebf8] bg-[#f5fbff] px-3 py-2 text-sm font-semibold text-[#0b2346]">
                        <Layers3 className="h-4 w-4 text-[#f7bf00]" />
                        <span>
                          {category.transmission === "MANUAL"
                            ? t("fleetPage.card.manual")
                            : t("fleetPage.card.automatic")}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#dcebf8] bg-[#f5fbff] px-3 py-2 text-sm font-semibold text-[#0b2346]">
                        <Snowflake className="h-4 w-4 text-[#2aa4ce]" />
                        <span>{category.hasAC ? t("fleetPage.card.ac") : t("fleetPage.card.noAc")}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-[1.5rem] border border-[#dcebf8] bg-white/82 px-4 py-4">
                      <div>
                        <div className="text-sm font-semibold text-[#071a36]">{t("fleetPage.card.pricingTitle")}</div>
                        <div className="mt-1 text-sm text-[#4c6781]">{t("fleetPage.card.pricingNote")}</div>
                      </div>
                      <Button asChild className="rounded-full px-5 font-bold">
                        <Link href="/book">{t("fleetPage.card.bookNow")}</Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[2rem] border border-white/70 bg-white/82 p-8 text-center shadow-[0_28px_60px_-45px_rgba(7,26,54,0.45)] backdrop-blur-xl lg:col-span-2">
              <h2 className="text-2xl font-black tracking-tight text-[#071a36]">{t("fleetPage.emptyTitle")}</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#4c6781]">{t("fleetPage.emptyBody")}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
