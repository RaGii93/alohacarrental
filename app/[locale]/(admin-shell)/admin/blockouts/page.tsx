import { BlockoutsClient } from "@/components/admin/BlockoutsClient";
import { db } from "@/lib/db";
import { ensureVehicleBlockoutsTable, listVehicleBlockouts } from "@/lib/vehicle-blockouts";
import { getTranslations } from "next-intl/server";
import { ADMIN_PAGE_KICKER, ADMIN_PAGE_META_TEXT, ADMIN_PAGE_SHELL, ADMIN_PAGE_STACK, requireAdminSection } from "@/app/[locale]/admin/_lib";

export default async function AdminBlockoutsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  await requireAdminSection(locale, "blockouts");
  await ensureVehicleBlockoutsTable();

  const [vehicles, rows] = await Promise.all([
    db.vehicle.findMany({
      where: { status: { not: "INACTIVE" } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    listVehicleBlockouts(),
  ]);

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
      <div>
        <p className={ADMIN_PAGE_KICKER}>{t.has("admin.dashboard.tabs.blockouts" as any) ? t("admin.dashboard.tabs.blockouts" as any) : t("admin.blockouts.title")}</p>
        <p className={`mt-2 ${ADMIN_PAGE_META_TEXT}`}>
          {t("admin.blockouts.description")}
        </p>
      </div>
      <BlockoutsClient locale={locale} vehicles={vehicles} rows={rows as any} />
      </div>
    </div>
  );
}
