import { getTranslations } from "next-intl/server";
import { TaxSettingsCard } from "@/components/admin/TaxSettingsCard";
import { getMinBookingDays, getTaxPercentage } from "@/lib/settings";
import { requireLicensedAdmin } from "@/app/[locale]/admin/_lib";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  await requireLicensedAdmin(locale);
  const [taxPercentage, minimumBookingDays] = await Promise.all([
    getTaxPercentage(),
    getMinBookingDays(),
  ]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <TaxSettingsCard
        locale={locale}
        initialTaxPercentage={taxPercentage}
        initialMinimumBookingDays={minimumBookingDays}
      />
    </div>
  );
}
