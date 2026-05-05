import { notFound } from "next/navigation";
import Link from "next/link";
import { ADMIN_PAGE_KICKER, ADMIN_PAGE_SHELL, ADMIN_PAGE_STACK, requireAdminSection } from "@/app/[locale]/admin/_lib";
import { getAutomationRule } from "@/actions/automations";
import { AutomationDetailClient } from "@/components/admin/AutomationDetailClient";

export const metadata = { title: "Automation Rule" };

export default async function AdminAutomationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await requireAdminSection(locale, "automations");

  const rule = await getAutomationRule(locale, id);
  if (!rule) notFound();

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href={`/${locale}/admin/automations`} className="hover:text-slate-900 transition-colors">
            Automation Rules
          </Link>
          <span>/</span>
          <span className="text-slate-900">{rule.name}</span>
        </div>

        {/* Header */}
        <div>
          <p className={ADMIN_PAGE_KICKER}>Automation Engine</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{rule.name}</h1>
          {rule.description && (
            <p className="mt-1 text-sm text-slate-500">{rule.description}</p>
          )}
        </div>

        <AutomationDetailClient rule={rule} locale={locale} />
      </div>
    </div>
  );
}
