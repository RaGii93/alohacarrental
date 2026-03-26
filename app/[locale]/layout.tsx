import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { getMessages } from "next-intl/server";
import "@/app/globals.css";
import {NextIntlClientProvider} from 'next-intl';
import {routing} from '@/i18n/routing';
import { buildMetadata } from "@/lib/seo";
import { buildTenantCssVariables, getTenantConfig } from "@/lib/tenant";
 
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
  return buildMetadata({
    locale,
    path: "/",
    title: tenant.tenantName,
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

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body style={tenantThemeStyles}>
        <div className="min-h-screen overflow-x-hidden">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Toaster position="bottom-right" />
        </div>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}
