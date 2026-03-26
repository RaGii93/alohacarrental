import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";
import { getTenantConfig } from "@/lib/tenant";
import {
  ADMIN_PAGE_KICKER,
  ADMIN_PAGE_SHELL,
  ADMIN_PAGE_STACK,
  requireAdminSection,
} from "@/app/[locale]/admin/_lib";
import { getHelpSuggestions, getHelpUiCopy } from "@/lib/help-docs";
import { HelpAssistant } from "@/components/docs/help-assistant";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = await getTenantConfig();
  const copy = getHelpUiCopy(locale);

  return buildMetadata({
    locale,
    path: "/admin/help/assistant",
    title: `${copy.assistantPageTitle} | ${tenant.tenantName}`,
    description: copy.assistantPageDescription,
    noIndex: true,
    tenant,
  });
}

export default async function AdminHelpAssistantPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminSection(locale, "help");
  const t = await getTranslations();
  const copy = getHelpUiCopy(locale);
  const suggestions = getHelpSuggestions(locale);

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
        <div>
          <p className={ADMIN_PAGE_KICKER}>{t("admin.dashboard.tabs.help")}</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[hsl(var(--foreground))]">
            {copy.assistantPageTitle}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[hsl(var(--foreground)/0.72)]">
            {copy.assistantPageDescription}
          </p>
        </div>

        <HelpAssistant locale={locale} copy={copy} suggestions={suggestions} />
      </div>
    </div>
  );
}
