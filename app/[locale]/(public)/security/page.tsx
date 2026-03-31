import type { Metadata } from "next";
import {
  Archive,
  Database,
  FileCheck2,
  HardDriveDownload,
  KeyRound,
  LockKeyhole,
  RefreshCcw,
  Scale,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";
import { getTenantConfig } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = await getTenantConfig();
  const t = await getTranslations("securityPage");

  return buildMetadata({
    locale,
    path: "/security",
    title: `${t("metaTitle")} | ${tenant.tenantName}`,
    description: t("metaDescription"),
    tenant,
  });
}

export default async function SecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("securityPage");

  const pillars = [
    {
      icon: ShieldCheck,
      title: t("pillars.access.title"),
      description: t("pillars.access.description"),
    },
    {
      icon: FileCheck2,
      title: t("pillars.uploads.title"),
      description: t("pillars.uploads.description"),
    },
    {
      icon: Archive,
      title: t("pillars.retention.title"),
      description: t("pillars.retention.description"),
    },
    {
      icon: SearchCheck,
      title: t("pillars.audit.title"),
      description: t("pillars.audit.description"),
    },
  ];

  const controls = [
    {
      icon: KeyRound,
      title: t("controls.identity.title"),
      body: t("controls.identity.body"),
    },
    {
      icon: LockKeyhole,
      title: t("controls.sessions.title"),
      body: t("controls.sessions.body"),
    },
    {
      icon: FileCheck2,
      title: t("controls.uploads.title"),
      body: t("controls.uploads.body"),
    },
    {
      icon: Database,
      title: t("controls.storage.title"),
      body: t("controls.storage.body"),
    },
    {
      icon: Archive,
      title: t("controls.retention.title"),
      body: t("controls.retention.body"),
    },
    {
      icon: Scale,
      title: t("controls.audit.title"),
      body: t("controls.audit.body"),
    },
  ];

  const operations = [
    {
      icon: HardDriveDownload,
      title: t("operations.backup.title"),
      body: t("operations.backup.body"),
    },
    {
      icon: RefreshCcw,
      title: t("operations.recovery.title"),
      body: t("operations.recovery.body"),
    },
  ];

  return (
    <section className="public-shell-bg relative overflow-hidden pt-24 sm:pt-28">
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(15,39,64,0.08),transparent)]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_360px] lg:items-start">
          <div className="space-y-8">
            <div className="public-glass-card-strong overflow-hidden rounded-[2rem] p-8 sm:p-10">
              <div className="public-eyebrow inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em]">
                <ShieldCheck className="size-4" />
                {t("eyebrow")}
              </div>
              <div className="mt-6 max-w-3xl space-y-4">
                <h1 className="text-4xl font-black tracking-[-0.04em] text-[hsl(var(--foreground))] sm:text-5xl">
                  {t("title")}
                </h1>
                <p className="max-w-2xl text-base leading-8 text-[hsl(var(--muted-foreground))] sm:text-lg">
                  {t("intro")}
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {pillars.map((item) => (
                  <div
                    key={item.title}
                    className="public-glass-card rounded-[1.5rem] p-5"
                  >
                    <div className="public-accent-icon flex h-11 w-11 items-center justify-center rounded-2xl">
                      <item.icon className="size-5" />
                    </div>
                    <p className="mt-4 text-base font-bold text-[hsl(var(--foreground))]">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-[hsl(var(--muted-foreground))]">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="public-glass-card overflow-hidden rounded-[2rem] p-6 sm:p-7">
              <div className="mb-6">
                  <div className="text-sm font-semibold uppercase tracking-[0.28em] text-[rgb(19,120,152)]">
                  {t("controlsEyebrow")}
                </div>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[hsl(var(--foreground))]">
                  {t("controlsTitle")}
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {controls.map((item) => (
                  <div
                    key={item.title}
                    className="public-glass-card rounded-[1.5rem] p-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="public-accent-icon flex h-10 w-10 items-center justify-center rounded-2xl">
                        <item.icon className="size-4.5" />
                      </div>
                      <h3 className="text-base font-bold text-[hsl(var(--foreground))]">{item.title}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[hsl(var(--muted-foreground))]">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="public-glass-card overflow-hidden rounded-[2rem] p-6 sm:p-7">
              <div className="mb-6">
                  <div className="text-sm font-semibold uppercase tracking-[0.28em] text-[rgb(19,120,152)]">
                  {t("operationsEyebrow")}
                </div>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[hsl(var(--foreground))]">
                  {t("operationsTitle")}
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {operations.map((item) => (
                  <div
                    key={item.title}
                    className="public-glass-card rounded-[1.5rem] p-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="public-accent-icon flex h-10 w-10 items-center justify-center rounded-2xl">
                        <item.icon className="size-4.5" />
                      </div>
                      <h3 className="text-base font-bold text-[hsl(var(--foreground))]">{item.title}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[hsl(var(--muted-foreground))]">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="space-y-6">
              <div className="public-glass-card-strong overflow-hidden rounded-[2rem] p-7">
                <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgb(15,39,64),rgb(19,120,152))] text-white shadow-[0_18px_40px_-24px_rgba(15,39,64,0.34)]">
                  <ShieldCheck className="size-7" />
                </div>
                <h2 className="mt-5 text-2xl font-black tracking-[-0.03em] text-[hsl(var(--foreground))]">
                  {t("sidebar.title")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[hsl(var(--muted-foreground))]">
                  {t("sidebar.description")}
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    t("sidebar.points.one"),
                    t("sidebar.points.two"),
                    t("sidebar.points.three"),
                    t("sidebar.points.four"),
                  ].map((point) => (
                    <div
                      key={point}
                      className="public-glass-card rounded-[1.4rem] px-4 py-4 text-sm leading-7 text-[rgb(15,39,64)]"
                    >
                      {point}
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-3">
                  <Button asChild className="public-primary-button h-12 rounded-2xl text-sm font-semibold">
                    <Link href={`/${locale}/security`}>{t("sidebar.primaryCta")}</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="public-outline-button h-12 rounded-2xl text-sm font-semibold"
                  >
                    <Link href={`/${locale}/book`}>{t("sidebar.secondaryCta")}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
