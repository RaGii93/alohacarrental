import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { getTenantConfig } from "@/lib/tenant";
import { getBlobProxyUrl } from "@/lib/blob";

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
    },
    orderBy: { sortOrder: "asc" },
  });

  const currency = (amountCents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amountCents / 100);

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 pb-10 pt-32 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold">{t("nav.fleetOverview")}</h1>
        <p className="text-muted-foreground mt-2">Browse active vehicle categories and available units.</p>
      </div>

      <div className="space-y-8">
        {categories.map((category) => (
          <div key={category.id} className="space-y-3 rounded-xl border p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{category.name}</h2>
              <p className="text-sm text-muted-foreground">{currency(category.dailyRate)} / day</p>
            </div>
            {category.imageUrl ? (
              <img
                src={category.imageUrl.startsWith("/") ? category.imageUrl : getBlobProxyUrl(category.imageUrl) || category.imageUrl}
                alt={category.name}
                className="h-44 w-full rounded-lg border object-cover"
              />
            ) : null}
            {category.description ? <p className="text-sm text-muted-foreground">{category.description}</p> : null}
            <ul className="flex flex-wrap gap-2 text-sm">
              <li className="rounded-full border px-3 py-1 bg-slate-50">{category.seats} seater</li>
              <li className="rounded-full border px-3 py-1 bg-slate-50">
                {category.transmission === "MANUAL" ? "Manual" : "Automatic"}
              </li>
              <li className="rounded-full border px-3 py-1 bg-slate-50">
                {category.hasAC ? "A/C available" : "No A/C"}
              </li>
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
