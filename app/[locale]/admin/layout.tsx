import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getTenantConfig } from "@/lib/tenant";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = getTenantConfig();
  return buildMetadata({
    locale,
    path: "/admin",
    title: `Admin | ${tenant.tenantName}`,
    noIndex: true,
  });
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
