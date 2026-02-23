import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { getTenantConfig } from "@/lib/tenant";

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
    include: {
      vehicles: {
        where: { status: "ACTIVE" },
        select: { id: true, name: true, imageUrl: true, dailyRate: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const currency = (amountCents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amountCents / 100);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t("nav.fleetOverview")}</h1>
        <p className="text-muted-foreground mt-2">Browse active vehicle categories and available units.</p>
      </div>

      <div className="space-y-8">
        {categories.map((category) => (
          <div key={category.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{category.name}</h2>
              <p className="text-sm text-muted-foreground">{currency(category.dailyRate)} / day</p>
            </div>
            {category.description ? <p className="text-sm text-muted-foreground">{category.description}</p> : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.vehicles.map((vehicle) => (
                <article key={vehicle.id} className="rounded-lg border p-4">
                  <p className="font-medium">{vehicle.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{currency(vehicle.dailyRate)} / day</p>
                </article>
              ))}
              {category.vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active vehicles currently listed.</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
