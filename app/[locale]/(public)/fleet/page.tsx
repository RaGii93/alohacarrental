import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, Settings2, Users } from "lucide-react";
import { db } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { DEFAULT_PUBLIC_PROFILE } from "@/lib/deployment-profiles";
import { getPublicMetadataCopy } from "@/lib/public-metadata-profiles";
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
  const metadataCopy = getPublicMetadataCopy(DEFAULT_PUBLIC_PROFILE, "fleet", locale, tenant.tenantName);
  return buildMetadata({
    locale,
    path: "/fleet",
    title: metadataCopy.title,
    description: metadataCopy.description,
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
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),rgba(255,244,230,0.94))] px-4 pt-28 pb-16 sm:px-6 lg:px-8 lg:pb-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,145,44,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,145,44,0.12),transparent_24%)]" />
      <div className="relative mx-auto w-full max-w-[1500px]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#FF912C]">{t("nav.fleetOverview")}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-[#E67F1F] sm:text-5xl">
            {t("nav.fleetOverview")}
          </h1>
          <p className="mt-4 text-lg leading-8 text-[#a8a29e]">Browse active vehicle categories and available units.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <article
              key={category.id}
              className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-[#efe7df] bg-white shadow-[0_25px_65px_-35px_rgba(255,145,44,0.45)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_40px_80px_-40px_rgba(255,145,44,0.65)]"
            >
              <div className="relative flex h-56 items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#fffbf7,#fff4e6)] p-6">
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
                    <h2 className="text-2xl font-black leading-tight text-[#E67F1F]">{category.name}</h2>
                    <p className="shrink-0 text-base font-semibold text-[#FF912C]">
                      {currency(category.dailyRate)}
                      <span className="text-[#a8a29e]"> / day</span>
                    </p>
                  </div>
                  {category.description ? (
                    <p className="mt-3 line-clamp-2 min-h-12 text-left text-sm leading-6 text-[#78716c]">{category.description}</p>
                  ) : (
                    <div className="min-h-12" />
                  )}
                </div>

                <ul className="mt-auto flex flex-wrap justify-center gap-2 pt-2 text-sm">
                  <li className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4E6] px-3 py-1.5 font-bold uppercase tracking-[0.08em] text-[#FF912C]">
                    <Users className="h-4 w-4" />
                    <span>{category.seats} seats</span>
                  </li>
                  <li className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4E6] px-3 py-1.5 font-bold uppercase tracking-[0.08em] text-[#FF912C]">
                    <Settings2 className="h-4 w-4" />
                    <span>{category.transmission === "MANUAL" ? "Manual" : "Automatic"}</span>
                  </li>
                  {getCategoryFeatureNames(category).map((feature) => (
                    <li key={feature} className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4E6] px-3 py-1.5 font-bold uppercase tracking-[0.08em] text-[#FF912C]">
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
