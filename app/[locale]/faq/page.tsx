import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";
import { getTenantConfig } from "@/lib/tenant";
import { getFaqEntries } from "@/lib/faq";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = getTenantConfig();
  return buildMetadata({
    locale,
    path: "/faq",
    title: `FAQ | ${tenant.tenantName}`,
  });
}

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const tenant = getTenantConfig();
  const faqEntries = getFaqEntries(locale);

  return (
    <section className="mx-auto max-w-4xl space-y-6 px-4 pb-10 pt-32 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">{t("nav.faq")}</h1>
      <p className="text-muted-foreground">
        Frequently asked questions about booking, required documents, payments, and pickup.
      </p>

      <div className="space-y-4">
        {faqEntries.map((item) => (
          <article key={item.id} className="rounded-lg border p-4">
            <h2 className="font-semibold">{item.question}</h2>
            <p className="text-sm text-muted-foreground mt-1">{item.answer}</p>
          </article>
        ))}
        <article className="rounded-lg border p-4">
          <h2 className="font-semibold">Need support?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Contact {tenant.tenantName} at {tenant.email} or {tenant.phone}.
          </p>
        </article>
      </div>
    </section>
  );
}
