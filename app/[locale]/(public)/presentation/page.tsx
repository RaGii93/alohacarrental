import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SalesPresentation } from "@/components/home/SalesPresentation";
import { buildMetadata } from "@/lib/seo";
import { getTenantConfig } from "@/lib/tenant";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = await getTenantConfig();

  return buildMetadata({
    locale,
    path: "/presentation",
    title: `${tenant.tenantName} Presentation`,
    description: "Detailed sales presentation for executive rental operations review.",
    tenant,
  });
}

export default async function PresentationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ view?: string; key?: string }>;
}) {
  const { view, key } = await searchParams;
  const presentationKey = process.env.PRESENTATION_ACCESS_KEY?.trim();
  const hasValidView = view === "deck";
  const hasValidKey = presentationKey ? key === presentationKey : true;

  if (!hasValidView || !hasValidKey) {
    notFound();
  }

  const { locale } = await params;
  const tenant = await getTenantConfig();

  return (
    <SalesPresentation
      locale={locale}
      tenantName={tenant.tenantName}
      whatsappUrl={tenant.whatsappUrl}
      email={tenant.email}
    />
  );
}
