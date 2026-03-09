import { toast } from "sonner";
import Image from "next/image";

const LOGO_URL = "/home/logo.png";

const FOOTER_LINKS = [
  { label: "About Us" },
  { label: "Contact" },
  { label: "Terms" },
  { label: "Privacy" },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="-mt-px bg-[#071a36] px-4 py-12 text-white sm:px-6 lg:px-8"
      style={{ backgroundColor: "#071a36" }}
    >
      <div className="mx-auto max-w-7xl space-y-6 text-center">
        <Image
          src={LOGO_URL}
          alt="Aloha Car Rental"
          width={220}
          height={64}
          className="mx-auto h-16 w-auto"
        />
        <p className="text-sm text-white/70">
          Aloha Car Rental — Bonaire, Caribbean Netherlands
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-white/60">
          {FOOTER_LINKS.map((link) => (
            <button
              key={link.label}
              className="transition-colors hover:text-white"
              onClick={() => toast.info(`${link.label} page coming soon!`)}
            >
              {link.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-white/40">
          © {year} Aloha Car Rental. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
