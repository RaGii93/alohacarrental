"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Bot, Facebook, Instagram, Linkedin, MessageCircle, Music2, Send, X } from "lucide-react";
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
      href: normalizeWhatsAppUrl(whatsappUrl, whatsapp) || "https://wa.me/5997000000",
      label: "WhatsApp",
      icon: MessageCircle,
      className: "bg-[#25D366] hover:bg-[#1ebe57]",
    },
    {
      key: "facebook",
      href: facebookUrl || "https://www.facebook.com/endlessedgetechnology",
      label: "Facebook",
      icon: Facebook,
      className: "bg-[#1877F2] hover:bg-[#1669d1]",
    },
    {
      key: "instagram",
      href: instagramUrl || "https://www.instagram.com/endlessedgetechnology",
      label: "Instagram",
      icon: Instagram,
      className: "bg-[#E4405F] hover:bg-[#d73656]",
    },
    {
      key: "linkedin",
      href: linkedinUrl || "https://www.linkedin.com/company/endless-edge-technology",
      label: "LinkedIn",
      icon: Linkedin,
      className: "bg-[#0A66C2] hover:bg-[#0958a7]",
    },
    {
      key: "tiktok",
      href: tiktokUrl || "https://www.tiktok.com/@endlessedgetechnology",
      label: "TikTok",
      icon: Music2,
      className: "bg-black hover:bg-zinc-800",
    },
  ];

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
