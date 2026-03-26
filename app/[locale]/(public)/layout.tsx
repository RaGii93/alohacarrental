import { Header } from "@/components/Header";
import { SocialFABs } from "@/components/SocialFABs";
import { getTenantConfig } from "@/lib/tenant";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getTenantConfig();

  return (
    <>
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
    </>
  );
}
