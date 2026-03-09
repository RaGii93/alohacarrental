import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { getMessages } from "next-intl/server";
import { Header } from "@/components/Header";
import { SocialFABs } from "@/components/SocialFABs";
import "@/app/globals.css";
import {NextIntlClientProvider} from 'next-intl';
import {routing} from '@/i18n/routing';
import { buildMetadata } from "@/lib/seo";
import { getTenantConfig } from "@/lib/tenant";
import { Poppins } from "next/font/google";
 
type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = getTenantConfig();
  return buildMetadata({
    locale,
    path: "/",
    title: tenant.tenantName,
  });
}
 
export default async function RootLayout({children, params}: Props) {
  const {locale} = await params;
  const tenant = getTenantConfig();

  // Validate that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={poppins.variable}>
        <div className="min-h-screen overflow-x-hidden">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <SocialFABs
            whatsapp={tenant.whatsapp}
            whatsappUrl={tenant.whatsappUrl}
            facebookUrl={tenant.facebookUrl}
            instagramUrl={tenant.instagramUrl}
            linkedinUrl={tenant.linkedinUrl}
            tiktokUrl={tenant.tiktokUrl}
          />
          <main className="min-h-screen">{children}</main>
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
