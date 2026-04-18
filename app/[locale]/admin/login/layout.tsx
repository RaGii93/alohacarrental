import type { Metadata } from "next";
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
    path: "/admin/login",
    title: `Admin Login | ${tenant.tenantName}`,
    noIndex: true,
    tenant,
  });
}

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
