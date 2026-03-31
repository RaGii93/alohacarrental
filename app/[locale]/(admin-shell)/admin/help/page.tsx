import type { Metadata } from "next";
import { BookOpenText, Bot, CircleHelp } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buildMetadata } from "@/lib/seo";
import { getTenantConfig } from "@/lib/tenant";
import {
  ADMIN_PAGE_KICKER,
  ADMIN_PAGE_SHELL,
  ADMIN_PAGE_STACK,
  requireAdminSection,
} from "@/app/[locale]/admin/_lib";
import { getFeaturedHelpDocs, getHelpSuggestions, getHelpUiCopy, getHelpDocById } from "@/lib/help-docs";
import { DocsSearch } from "@/components/docs/docs-search";
import { HelpAssistant } from "@/components/docs/help-assistant";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
    path: "/admin/help",
    title: `${copy.homeEyebrow} | ${tenant.tenantName}`,
    description: copy.homeDescription,
    noIndex: true,
    tenant,
  });
}

export default async function AdminHelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminSection(locale, "help");
  const t = await getTranslations();
  const copy = getHelpUiCopy(locale);
  const featuredDocs = getFeaturedHelpDocs(locale);
  const suggestions = getHelpSuggestions(locale);
  const navigationGuide = getHelpDocById(locale, "admin-sidebar-guide");
  const quickBooksGuide = getHelpDocById(locale, "quickbooks-setup");
  const zohoGuide = getHelpDocById(locale, "zoho-setup");

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
        <div className="overflow-hidden rounded-[2rem] border border-[hsl(var(--border))] bg-[linear-gradient(135deg,#ffffff,hsl(var(--accent)/0.24)_48%,#ffffff)] p-8 shadow-[0_28px_72px_-40px_hsl(var(--primary)/0.14)]">
          <p className={ADMIN_PAGE_KICKER}>{t("admin.dashboard.tabs.help")}</p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.14)] bg-[hsl(var(--primary)/0.08)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--primary))]">
                <CircleHelp className="size-4" />
                {copy.homeEyebrow}
              </div>
              <h1 className="text-4xl font-black tracking-[-0.04em] text-[hsl(var(--foreground))]">
                {copy.homeTitle}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[hsl(var(--foreground)/0.72)]">
                {copy.homeDescription}
              </p>
            </div>

            <Button asChild className="h-12 rounded-2xl px-5">
              <Link href="/admin/help/assistant" locale={locale}>
                <Bot className="size-4" />
                {copy.assistantCta}
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
          <Card className="rounded-[1.8rem] border-[hsl(var(--border))] bg-white p-6 shadow-[0_24px_56px_-34px_hsl(215_28%_17%/0.14)]">
            <DocsSearch locale={locale} copy={copy} />
          </Card>

          <HelpAssistant locale={locale} copy={copy} suggestions={suggestions} compact />
        </div>

        {navigationGuide ? (
          <Card className="rounded-[1.8rem] border-[hsl(var(--primary)/0.18)] bg-[linear-gradient(135deg,hsl(var(--primary)/0.08),white_42%,white)] p-6 shadow-[0_24px_56px_-34px_hsl(215_28%_17%/0.14)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--primary))]">
                  {t("admin.dashboard.tabs.help")}
                </p>
                <h2 className="text-2xl font-black tracking-[-0.03em] text-[hsl(var(--foreground))]">
                  {navigationGuide.title}
                </h2>
                <p className="text-sm leading-7 text-[hsl(var(--foreground)/0.72)]">
                  {navigationGuide.description}
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  {navigationGuide.sections.flatMap((section) => section.bullets).slice(0, 8).map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-[hsl(var(--border))] bg-white/90 px-4 py-3 text-sm leading-6 text-[hsl(var(--foreground)/0.76)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <Button asChild className="rounded-2xl px-5 lg:mt-1">
                <Link href={navigationGuide.href} locale={locale}>
                  {copy.openDoc}
                </Link>
              </Button>
            </div>
          </Card>
        ) : null}

        {quickBooksGuide || zohoGuide ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
                <BookOpenText className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-[-0.03em] text-[hsl(var(--foreground))]">Accounting Integrations</h2>
                <p className="text-sm text-[hsl(var(--foreground)/0.7)]">
                  Direct setup instructions, connection steps, token guidance, and troubleshooting for QuickBooks and Zoho.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[quickBooksGuide, zohoGuide].filter(Boolean).map((doc) => (
                <Card
                  key={doc!.id}
                  className="rounded-[1.6rem] border-[hsl(var(--primary)/0.18)] bg-[linear-gradient(135deg,hsl(var(--primary)/0.08),white_42%,white)] p-6 shadow-[0_18px_48px_-34px_hsl(215_28%_17%/0.14)]"
                >
                  <div className="space-y-3">
                    <div className="inline-flex rounded-full bg-[hsl(var(--primary)/0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--primary))]">
                      Integration Guide
                    </div>
                    <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">{doc!.title}</h3>
                    <p className="text-sm leading-7 text-[hsl(var(--foreground)/0.72)]">{doc!.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {doc!.sections.slice(0, 3).map((section) => (
                        <span
                          key={`${doc!.id}-${section.id}`}
                          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[hsl(var(--foreground)/0.72)] ring-1 ring-[hsl(var(--border))]"
                        >
                          {section.heading}
                        </span>
                      ))}
                    </div>
                    <Button asChild className="mt-2 rounded-xl">
                      <Link href={doc!.href} locale={locale}>
                        {copy.openDoc}
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
              <BookOpenText className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-[-0.03em] text-[hsl(var(--foreground))]">{copy.featuredTitle}</h2>
              <p className="text-sm text-[hsl(var(--foreground)/0.7)]">{copy.featuredDescription}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {featuredDocs.map((doc) => (
              <Card
                key={doc.id}
                className="rounded-[1.6rem] border-[hsl(var(--border))] bg-white p-6 shadow-[0_18px_48px_-34px_hsl(215_28%_17%/0.14)]"
              >
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">{doc.title}</h3>
                  <p className="text-sm leading-7 text-[hsl(var(--foreground)/0.72)]">{doc.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {doc.sections.slice(0, 2).map((section) => (
                      <span
                        key={`${doc.id}-${section.id}`}
                        className="rounded-full bg-[hsl(var(--secondary))] px-3 py-1 text-xs font-semibold text-[hsl(var(--foreground)/0.72)]"
                      >
                        {section.heading}
                      </span>
                    ))}
                  </div>
                  <Button asChild variant="outline" className="mt-2 rounded-xl">
                    <Link href={doc.href} locale={locale}>
                      {copy.openDoc}
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
