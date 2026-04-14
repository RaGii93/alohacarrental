"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { SVGProps } from "react";
import { Bot, Instagram, Linkedin, Music2, Send, X } from "lucide-react";
import { getFaqAssistantCopy, getFaqEntries } from "@/lib/faq";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SocialFABsProps = {
  whatsapp?: string;
  whatsappUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  tiktokUrl?: string;
};

const normalizeWhatsAppUrl = (url: string | undefined, fallbackPhone?: string) => {
  if (url && url.trim().length > 0) return url.trim();
  const digits = (fallbackPhone || "").replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : "";
};

function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M19.05 4.91A9.82 9.82 0 0 0 12.03 2C6.6 2 2.18 6.42 2.18 11.85c0 1.74.46 3.45 1.32 4.95L2 22l5.36-1.41a9.84 9.84 0 0 0 4.67 1.19h.01c5.43 0 9.85-4.42 9.85-9.85 0-2.63-1.02-5.1-2.84-6.99Zm-7.02 15.2h-.01a8.13 8.13 0 0 1-4.14-1.13l-.3-.18-3.18.84.85-3.1-.2-.32a8.15 8.15 0 0 1-1.25-4.36c0-4.49 3.65-8.14 8.14-8.14 2.17 0 4.2.84 5.73 2.38a8.06 8.06 0 0 1 2.39 5.77c0 4.49-3.65 8.14-8.13 8.14Zm4.46-6.09c-.24-.12-1.44-.71-1.67-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.29.18-.53.06-.24-.12-1.02-.38-1.95-1.2-.72-.64-1.21-1.42-1.35-1.66-.14-.24-.02-.37.1-.49.11-.11.24-.29.37-.43.12-.14.16-.24.24-.39.08-.16.04-.3-.02-.43-.06-.12-.55-1.32-.76-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.43.06-.65.3-.22.24-.85.83-.85 2.03s.87 2.36.99 2.53c.12.16 1.71 2.62 4.15 3.67.58.25 1.03.4 1.39.51.58.18 1.1.15 1.51.09.46-.07 1.44-.59 1.64-1.16.2-.57.2-1.05.14-1.15-.06-.1-.22-.16-.47-.28Z"
      />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M13.64 21v-8.2h2.75l.41-3.2h-3.16V7.56c0-.93.26-1.56 1.59-1.56H16.9V3.14c-.29-.04-1.27-.12-2.41-.12-2.39 0-4.03 1.46-4.03 4.14v2.31H7.75v3.2h2.71V21h3.18Z"
      />
    </svg>
  );
}

const faqEntryToPlainText = (blocks: ReturnType<typeof getFaqEntries>[number]["blocks"]) =>
  blocks
    .map((block) =>
      block.type === "paragraph"
        ? block.runs.map((run) => run.text).join("")
        : block.items.map((item) => item.map((run) => run.text).join("")).join(" ")
    )
    .join(" ");

export function SocialFABs({
  whatsapp,
  whatsappUrl,
  facebookUrl,
  instagramUrl,
  linkedinUrl,
  tiktokUrl,
}: SocialFABsProps) {
  const pathname = usePathname();
  if (pathname?.includes("/admin")) return null;
  const currentLocale = useMemo(() => {
    const first = pathname?.split("/").filter(Boolean)?.[0];
    return first === "nl" || first === "es" ? first : "en";
  }, [pathname]);
  const faqEntries = useMemo(() => getFaqEntries(currentLocale), [currentLocale]);
  const assistantCopy = useMemo(() => getFaqAssistantCopy(currentLocale), [currentLocale]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<Array<{ role: "bot" | "user"; text: string }>>([
    {
      role: "bot",
      text: assistantCopy.welcome,
    },
  ]);

  useEffect(() => {
    setChat([{ role: "bot", text: assistantCopy.welcome }]);
    setMessage("");
  }, [assistantCopy.welcome]);

  const links = [
    {
      key: "whatsapp",
      href: normalizeWhatsAppUrl(whatsappUrl, whatsapp),
      label: "WhatsApp",
      icon: WhatsAppIcon,
      className: "bg-[#25D366] hover:bg-[#1ebe57]",
    },
    {
      key: "facebook",
      href: facebookUrl?.trim() || "",
      label: "Facebook",
      icon: FacebookIcon,
      className: "bg-[#1877F2] hover:bg-[#1669d1]",
    },
    {
      key: "instagram",
      href: instagramUrl?.trim() || "",
      label: "Instagram",
      icon: Instagram,
      className: "bg-[#E4405F] hover:bg-[#d73656]",
    },
    {
      key: "linkedin",
      href: linkedinUrl?.trim() || "",
      label: "LinkedIn",
      icon: Linkedin,
      className: "bg-[#0A66C2] hover:bg-[#0958a7]",
    },
    {
      key: "tiktok",
      href: tiktokUrl?.trim() || "",
      label: "TikTok",
      icon: Music2,
      className: "bg-black hover:bg-zinc-800",
    },
  ].filter((link) => link.href);

  if (links.length === 0) return null;
  const whatsappHref = links.find((item) => item.key === "whatsapp")?.href || "";
  const localePrefix = useMemo(() => {
    const parts = pathname?.split("/").filter(Boolean) || [];
    return parts.length > 0 ? `/${parts[0]}` : "";
  }, [pathname]);

  const askAssistant = () => {
    const question = message.trim();
    if (!question) return;

    const lower = question.toLowerCase();
    const found = faqEntries.find((entry) => entry.keywords.some((kw) => lower.includes(kw)));
    const reply = found
      ? `${faqEntryToPlainText(found.blocks)} ${assistantCopy.readMore}`
      : assistantCopy.notFound;

    setChat((prev) => [...prev, { role: "user", text: question }, { role: "bot", text: reply }]);
    setMessage("");
  };

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end sm:right-6">
      {open ? (
        <div
          className="mb-3 flex h-[34rem] w-[24rem] max-h-[78vh] max-w-[92vw] flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl"
          style={{ width: "24rem", maxWidth: "92vw", maxHeight: "78vh" }}
        >
          <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2 font-semibold">
              <Bot className="h-5 w-5 text-fuchsia-600" />
              {assistantCopy.title}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="shrink-0 px-4 pt-3">
            <div className="flex flex-wrap gap-2">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.key}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-white ${link.className}`}
                    aria-label={link.label}
                    title={link.label}
                  >
                    <Icon className="h-7 w-7" />
                  </Link>
                );
              })}
              <Link
                href={`${localePrefix}/faq`}
                className="inline-flex h-12 items-center rounded-full border px-4 text-sm font-medium hover:bg-slate-50"
              >
                FAQ
              </Link>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <div className="space-y-3">
              {chat.map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                    item.role === "user"
                      ? "ml-auto bg-fuchsia-600 text-white"
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  {item.text}
                  {item.role === "bot" && item.text.includes("WhatsApp") && whatsappHref ? (
                    <div className="mt-2">
                      <Link
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-fuchsia-700 underline"
                      >
                        {assistantCopy.openWhatsapp}
                      </Link>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 border-t p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                askAssistant();
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={assistantCopy.askPlaceholder}
              />
              <Button type="submit" size="icon" className="h-10 w-10 bg-fuchsia-600 hover:bg-fuchsia-700">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open help assistant"
        className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-fuchsia-600 text-white shadow-xl transition hover:bg-fuchsia-700"
      >
        <Bot className="h-8 w-8" />
      </button>
    </div>
  );
}
