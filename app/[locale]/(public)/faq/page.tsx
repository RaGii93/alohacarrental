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
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.12),_transparent_52%),linear-gradient(180deg,_#f8fbff,_#eef5ff_55%,_#ffffff)]">
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,hsl(var(--primary)/0.08),transparent)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_360px] lg:items-start">
          <div className="space-y-8">
            <div className="overflow-hidden rounded-[2rem] border border-[hsl(var(--primary)/0.14)] bg-white/88 p-8 shadow-[0_30px_90px_-46px_hsl(var(--foreground)/0.22)] backdrop-blur-sm sm:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.12)] bg-[hsl(var(--primary)/0.08)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-[hsl(var(--primary))]">
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
                    className="rounded-[1.5rem] border border-[hsl(var(--primary)/0.12)] bg-[linear-gradient(180deg,hsl(var(--primary)/0.1),white)] p-5 shadow-[0_16px_40px_-28px_hsl(var(--primary)/0.26)]"
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--primary))]">
                      {faqT("popularTopic")}
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-[hsl(var(--foreground))]">
                      {entry.question}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-[hsl(var(--primary)/0.14)] bg-white/92 p-5 shadow-[0_30px_90px_-48px_hsl(var(--foreground)/0.22)] backdrop-blur-sm sm:p-6">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.28em] text-[hsl(var(--primary))]">
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

              <Accordion defaultValue={faqEntries[0]?.id ?? null}>
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
              <div className="overflow-hidden rounded-[2rem] border border-[hsl(var(--primary)/0.14)] bg-[linear-gradient(180deg,hsl(var(--primary)/0.1),white_22%,white)] p-7 shadow-[0_28px_72px_-44px_hsl(var(--foreground)/0.24)]">
                <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[0_18px_40px_-24px_hsl(var(--primary)/0.6)]">
                  <ShieldCheck className="size-7" />
                </div>
                <h2 className="mt-5 text-2xl font-black tracking-[-0.03em] text-[hsl(var(--foreground))]">
                  {faqT("supportTitle")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[hsl(var(--foreground)/0.72)]">
                  {faqT("supportDescription", { tenantName: tenant.tenantName })}
                </p>

                <div className="mt-6 space-y-3">
                  <div className="rounded-[1.4rem] border border-[hsl(var(--primary)/0.12)] bg-white px-4 py-4">
                    <div className="flex items-start gap-3">
                      <Mail className="mt-1 size-4 text-[hsl(var(--primary))]" />
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[hsl(var(--primary))]">
                          {t("common.email")}
                        </div>
                        <p className="mt-1 text-sm font-medium text-[hsl(var(--foreground))]">{tenant.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-[hsl(var(--primary)/0.12)] bg-white px-4 py-4">
                    <div className="flex items-start gap-3">
                      <Phone className="mt-1 size-4 text-[hsl(var(--primary))]" />
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[hsl(var(--primary))]">
                          {t("common.phone")}
                        </div>
                        <p className="mt-1 text-sm font-medium text-[hsl(var(--foreground))]">{tenant.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-[hsl(var(--primary)/0.12)] bg-white px-4 py-4">
                    <div className="flex items-start gap-3">
                      <Clock3 className="mt-1 size-4 text-[hsl(var(--primary))]" />
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[hsl(var(--primary))]">
                          {faqT("openingHoursLabel")}
                        </div>
                        <p className="mt-1 text-sm font-medium leading-7 text-[hsl(var(--foreground))]">
                          {faqT("openingHoursDays")}
                          <br />
                          {faqT("openingHoursTime")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  <Button asChild className="h-12 rounded-2xl text-sm font-semibold shadow-[0_18px_40px_-24px_hsl(var(--primary)/0.56)]">
                    <Link href={`/${locale}/book`}>{t("nav.booking")}</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 rounded-2xl border-[hsl(var(--primary)/0.16)] text-sm font-semibold text-[hsl(var(--foreground))]"
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
