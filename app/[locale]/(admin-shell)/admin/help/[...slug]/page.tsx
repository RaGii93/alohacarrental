import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, BookText, Bot } from "lucide-react";
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
import { DocsSearch } from "@/components/docs/docs-search";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAllHelpDocSlugs, getHelpDocBySlug, getHelpUiCopy } from "@/lib/help-docs";

export function generateStaticParams() {
  return getAllHelpDocSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const tenant = await getTenantConfig();
  const doc = getHelpDocBySlug(locale, slug);

  if (!doc) {
    return buildMetadata({
      locale,
      path: "/admin/help",
      title: `Help | ${tenant.tenantName}`,
      noIndex: true,
      tenant,
    });
  }

  return buildMetadata({
    locale,
    path: doc.href,
    title: `${doc.title} | ${tenant.tenantName}`,
    description: doc.description,
    noIndex: true,
    tenant,
  });
}

export default async function AdminHelpDocPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale, slug } = await params;
  await requireAdminSection(locale, "help");
  const t = await getTranslations();
  const copy = getHelpUiCopy(locale);
  const doc = getHelpDocBySlug(locale, slug);

  if (!doc) {
    notFound();
  }

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={ADMIN_PAGE_KICKER}>{t("admin.dashboard.tabs.help")}</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[hsl(var(--foreground))]">
              {doc.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[hsl(var(--foreground)/0.72)]">
              {doc.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/admin/help" locale={locale}>
                <ArrowLeft className="size-4" />
                {copy.docBack}
              </Link>
            </Button>
            <Button asChild className="rounded-xl">
              <Link href="/admin/help/assistant" locale={locale}>
                <Bot className="size-4" />
                {copy.assistantCta}
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <article className="space-y-6">
            {doc.sections.map((section) => (
              <Card
                key={section.id}
                className="rounded-[1.8rem] border-[hsl(var(--border))] bg-white p-6 shadow-[0_22px_56px_-36px_hsl(215_28%_17%/0.14)]"
              >
                <div className="space-y-4">
                  <h2 id={section.id} className="text-xl font-black tracking-[-0.03em] text-[hsl(var(--foreground))]">
                    {section.heading}
                  </h2>
                  <p className="text-sm leading-7 text-[hsl(var(--foreground)/0.76)]">
                    {section.summary}
                  </p>
                  {section.bullets.length ? (
                    <ul className="space-y-2 pl-5 text-sm leading-7 text-[hsl(var(--foreground)/0.76)]">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </Card>
            ))}
          </article>

          <aside className="space-y-6 xl:sticky xl:top-24">
            <Card className="rounded-[1.8rem] border-[hsl(var(--border))] bg-white p-6 shadow-[0_22px_56px_-36px_hsl(215_28%_17%/0.14)]">
              <div className="flex items-center gap-3">
                <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
                  <BookText className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">{copy.docSectionsLabel}</h2>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {doc.sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.25)] px-4 py-3 text-sm font-medium text-[hsl(var(--foreground)/0.8)] hover:border-[hsl(var(--primary)/0.24)] hover:text-[hsl(var(--foreground))]"
                  >
                    {section.heading}
                  </a>
                ))}
              </div>
            </Card>

            <Card className="rounded-[1.8rem] border-[hsl(var(--border))] bg-white p-6 shadow-[0_22px_56px_-36px_hsl(215_28%_17%/0.14)]">
              <DocsSearch locale={locale} copy={copy} />
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
