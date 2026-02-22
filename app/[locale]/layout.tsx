import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { getMessages } from "next-intl/server";
import { Header } from "@/components/Header";
import "@/app/globals.css";
import {NextIntlClientProvider} from 'next-intl';
import {routing} from '@/i18n/routing';
 
type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};
 
export default async function RootLayout({children, params}: Props) {
  const {locale} = await params;

  // Validate that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="min-h-screen">{children}</main>
        </NextIntlClientProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}