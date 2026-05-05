import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { getMessages, setRequestLocale } from "next-intl/server";
import "@/app/globals.css";
import {NextIntlClientProvider} from 'next-intl';
import {routing} from '@/i18n/routing';
import { buildMetadata } from "@/lib/seo";
import { DEFAULT_PUBLIC_PROFILE } from "@/lib/deployment-profiles";
import { getPublicMetadataCopy } from "@/lib/public-metadata-profiles";
import { buildTenantCssVariables, getTenantConfig } from "@/lib/tenant";
import { Analytics } from '@vercel/analytics/next';
 
type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = await getTenantConfig();
  const metadataCopy = getPublicMetadataCopy(DEFAULT_PUBLIC_PROFILE, "root", locale, tenant.tenantName);
  return buildMetadata({
    locale,
    path: "/",
    title: metadataCopy.title,
    description: metadataCopy.description,
    tenant,
  });
}
 
export default async function RootLayout({children, params}: Props) {
  const {locale} = await params;
  const tenant = await getTenantConfig();
  const tenantThemeStyles = buildTenantCssVariables(tenant);

  // Validate that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased" style={tenantThemeStyles}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Toaster position="bottom-right" />
        <Analytics />
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}
