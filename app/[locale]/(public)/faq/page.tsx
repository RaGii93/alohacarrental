import type { Metadata } from "next";
import { CircleHelp, Clock3, Mail, Phone, ShieldCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";
import { getTenantConfig } from "@/lib/tenant";
import { FaqBlock, FaqTextRun, getFaqEntries } from "@/lib/faq";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

function renderRuns(runs: FaqTextRun[]) {
  return runs.map((run, index) => {
    let content = <>{run.text}</>;
    if (run.bold) content = <strong>{content}</strong>;
    if (run.underline) content = <span className="underline decoration-1 underline-offset-2">{content}</span>;
    return <span key={`${run.text}-${index}`}>{content}</span>;
  });
}

function renderBlock(block: FaqBlock, key: string) {
  if (block.type === "list") {
    const ListTag = block.ordered ? "ol" : "ul";
    return (
      <ListTag
        key={key}
        className={`${block.ordered ? "list-decimal" : "list-disc"} space-y-2 pl-5 marker:text-[hsl(var(--primary))]`}
      >
        {block.items.map((item, index) => (
          <li key={`${key}-item-${index}`}>{renderRuns(item)}</li>
        ))}
      </ListTag>
    );
  }

  return (
    <p key={key}>
      {renderRuns(block.runs)}
    </p>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = await getTenantConfig();
  return buildMetadata({
    locale,
    path: "/faq",
    title: `FAQ | ${tenant.tenantName}`,
    tenant,
  });
}

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const faqT = await getTranslations("faqPage");
  const tenant = await getTenantConfig();
  const faqEntries = getFaqEntries(locale);
  const highlightedEntries = faqEntries.slice(0, 3);

  return (
    <section className="public-shell-bg relative overflow-hidden pt-24 sm:pt-28">
      <div className="absolute inset-x-0 top-0 h-80 bg-[linear-gradient(180deg,rgba(15,39,64,0.08),transparent)]" />
      <div className="absolute left-0 top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(19,120,152,0.12),transparent_68%)] blur-2xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.12),transparent_70%)] blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_360px] lg:items-start">
          <div className="space-y-8">
            <div className="overflow-hidden rounded-[2rem] border border-[rgba(15,39,64,0.08)] bg-white/88 p-8 shadow-[0_28px_90px_-56px_rgba(15,39,64,0.22)] ring-1 ring-white/70 backdrop-blur-xl sm:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(19,120,152,0.12)] bg-[rgba(19,120,152,0.08)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-[rgb(19,120,152)]">
                <CircleHelp className="size-4" />
                {t("nav.faq")}
              </div>
              <div className="mt-6 max-w-3xl space-y-4">
                <h1 className="text-4xl font-black tracking-[-0.04em] text-[hsl(var(--foreground))] sm:text-5xl">
                  {faqT("heroTitle")}
                </h1>
                <p className="max-w-2xl text-base leading-8 text-[hsl(var(--foreground)/0.72)] sm:text-lg">
                  {faqT("heroDescription")}
                </p>
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {highlightedEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.5rem] border border-[rgba(15,39,64,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,249,252,0.92))] p-5 shadow-[0_20px_44px_-34px_rgba(15,39,64,0.2)]"
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(19,120,152)]">
                      {faqT("popularTopic")}
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-[hsl(var(--foreground))]">
                      {entry.question}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-[rgba(15,39,64,0.08)] bg-white/90 p-5 shadow-[0_32px_90px_-58px_rgba(15,39,64,0.24)] ring-1 ring-white/70 backdrop-blur-xl sm:p-6">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.28em] text-[rgb(19,120,152)]">
                    {faqT("helpCenterEyebrow")}
                  </div>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[hsl(var(--foreground))]">
                    {faqT("helpCenterTitle")}
                  </h2>
                </div>
                <p className="max-w-xl text-sm leading-7 text-[hsl(var(--foreground)/0.7)]">
                  {faqT("helpCenterDescription")}
                </p>
              </div>

              <Accordion defaultValue={faqEntries[0]?.id ?? null} className="space-y-4">
                {faqEntries.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm leading-7 text-[hsl(var(--foreground)/0.72)] sm:text-[15px]">
                        {item.blocks.map((block, index) => renderBlock(block, `${item.id}-${index}`))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-[2rem] border border-[rgba(15,39,64,0.08)] bg-[linear-gradient(180deg,rgba(15,39,64,0.98),rgba(24,58,91,0.96))] p-7 text-white shadow-[0_36px_90px_-54px_rgba(15,39,64,0.5)]">
                <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-white/12 text-white shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
                  <ShieldCheck className="size-7" />
                </div>
                <h2 className="mt-5 text-2xl font-black tracking-[-0.03em] text-white">
                  {faqT("supportTitle")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/76">
                  {faqT("supportDescription", { tenantName: tenant.tenantName })}
                </p>

                <div className="mt-6 space-y-3">
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-md">
                    <div className="flex items-start gap-3">
                      <Mail className="mt-1 size-4 text-[rgb(94,234,212)]" />
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(125,211,252)]">
                          {t("common.email")}
                        </div>
                        <p className="mt-1 text-sm font-medium text-white">{tenant.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-md">
                    <div className="flex items-start gap-3">
                      <Phone className="mt-1 size-4 text-[rgb(94,234,212)]" />
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(125,211,252)]">
                          {t("common.phone")}
                        </div>
                        <p className="mt-1 text-sm font-medium text-white">{tenant.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-md">
                    <div className="flex items-start gap-3">
                      <Clock3 className="mt-1 size-4 text-[rgb(94,234,212)]" />
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(125,211,252)]">
                          {faqT("openingHoursLabel")}
                        </div>
                        <p className="mt-1 text-sm font-medium leading-7 text-white">
                          {faqT("openingHoursDays")}
                          <br />
                          {faqT("openingHoursTime")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  <Button asChild className="h-12 rounded-2xl bg-white text-[rgb(15,39,64)] text-sm font-semibold hover:bg-white/92">
                    <Link href={`/${locale}/book`}>{t("nav.booking")}</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 rounded-2xl border-white/18 bg-transparent text-sm font-semibold text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link href={`/${locale}/fleet`}>{t("nav.fleetOverview")}</Link>
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
