import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, Settings2, Users } from "lucide-react";
import { db } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { getTenantConfig } from "@/lib/tenant";
import { getBlobProxyUrl } from "@/lib/blob";
import { getCategoryFeatureNames } from "@/lib/vehicle-features";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = await getTenantConfig();
  return buildMetadata({
    locale,
    path: "/fleet",
    title: `Fleet Overview | ${tenant.tenantName}`,
    tenant,
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
      hasCarPlay: true,
      hasBackupCamera: true,
      features: { include: { feature: true }, orderBy: { feature: { sortOrder: "asc" } } },
    },
    orderBy: { sortOrder: "asc" },
  });

  const currency = (amountCents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amountCents / 100);

  return (
    <section className="public-shell-bg relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pb-20 lg:pt-36">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,39,64,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(23,184,197,0.1),transparent_24%)]" />
      <div className="relative mx-auto w-full max-w-[1500px]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[rgb(19,120,152)]">{t("nav.fleetOverview")}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-[hsl(var(--foreground))] sm:text-5xl">
            {t("nav.fleetOverview")}
          </h1>
          <p className="mt-4 text-lg leading-8 text-[hsl(var(--muted-foreground))]">Browse active vehicle categories and available units.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <article
              key={category.id}
              className="public-glass-card group flex h-full flex-col overflow-hidden rounded-[2rem] transition duration-300 hover:-translate-y-1 hover:shadow-[0_40px_80px_-40px_rgba(15,39,64,0.18)]"
            >
              <div className="relative flex h-56 items-center justify-center overflow-hidden bg-[linear-gradient(180deg,rgba(240,249,255,0.92),rgba(255,255,255,0.86))] p-6">
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl.startsWith("/") ? category.imageUrl : getBlobProxyUrl(category.imageUrl) || category.imageUrl}
                    alt={category.name}
                    className="h-full w-full object-contain p-2 transition duration-500 group-hover:scale-105"
                  />
                ) : null}
              </div>

              <div className="flex flex-1 flex-col space-y-4 px-6 pb-7 pt-5 text-center">
                <div>
                  <div className="flex items-start justify-between gap-3 text-left">
                    <h2 className="text-2xl font-black leading-tight text-[hsl(var(--foreground))]">{category.name}</h2>
                    <p className="shrink-0 text-base font-semibold text-[rgb(19,120,152)]">
                      {currency(category.dailyRate)}
                      <span className="text-[hsl(var(--muted-foreground))]"> / day</span>
                    </p>
                  </div>
                  {category.description ? (
                    <p className="mt-3 line-clamp-2 min-h-12 text-left text-sm leading-6 text-[hsl(var(--muted-foreground))]">{category.description}</p>
                  ) : (
                    <div className="min-h-12" />
                  )}
                </div>

                <ul className="mt-auto flex flex-wrap justify-center gap-2 pt-2 text-sm">
                  <li className="public-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold uppercase tracking-[0.08em] text-[rgb(19,120,152)] backdrop-blur-sm">
                    <Users className="h-4 w-4" />
                    <span>{category.seats} seats</span>
                  </li>
                  <li className="public-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold uppercase tracking-[0.08em] text-[rgb(19,120,152)] backdrop-blur-sm">
                    <Settings2 className="h-4 w-4" />
                    <span>{category.transmission === "MANUAL" ? "Manual" : "Automatic"}</span>
                  </li>
                  {getCategoryFeatureNames(category).map((feature) => (
                    <li key={feature} className="public-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold uppercase tracking-[0.08em] text-[rgb(19,120,152)] backdrop-blur-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
