import { redirect } from "next/navigation";
import { getLocalizedTermsPdfUrl } from "@/lib/terms-locale";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(getLocalizedTermsPdfUrl(locale));
}
