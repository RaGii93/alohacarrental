import { ADMIN_PAGE_KICKER, ADMIN_PAGE_SHELL, ADMIN_PAGE_STACK, requireAdminSection } from "@/app/[locale]/admin/_lib";
import { listAutomationRules, seedDefaultAutomationRules } from "@/actions/automations";
import { AutomationsTable } from "@/components/admin/AutomationsTable";

export const metadata = { title: "Automation Engine" };

export default async function AdminAutomationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminSection(locale, "automations");

  const result = await listAutomationRules(locale);
  const rules = result.success ? (result.data ?? []) : [];

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
        {/* Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={ADMIN_PAGE_KICKER}>Automation Engine</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Automation Rules</h1>
            <p className="mt-1 text-sm text-slate-500">
              Automate customer communications and internal alerts triggered by booking lifecycle events.
            </p>
          </div>

          {rules.length === 0 && (
            <form
              action={async () => {
                "use server";
                await seedDefaultAutomationRules(locale);
              }}
            >
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-700 transition-colors"
              >
                Seed Default Rules
              </button>
            </form>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([
            { label: "Total Rules", value: rules.length },
            { label: "Active", value: rules.filter((r) => r.isActive).length },
            { label: "Inactive", value: rules.filter((r) => !r.isActive).length },
            {
              label: "Total Executions",
              value: rules.reduce((sum, r) => sum + (r._count?.executionLogs ?? 0), 0),
            },
          ] as Array<{ label: string; value: number }>).map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <AutomationsTable rules={rules as Parameters<typeof AutomationsTable>[0]["rules"]} locale={locale} />
      </div>
    </div>
  );
}
