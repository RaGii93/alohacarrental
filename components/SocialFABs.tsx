"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Bot, Facebook, Instagram, Linkedin, MessageCircle, Music2, Send, X } from "lucide-react";
import { faqBlocksToPlainText, getFaqAssistantCopy, getFaqEntries, normalizeFaqSearchText } from "@/lib/faq";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link as IntlLink } from "@/i18n/navigation";

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

export function SocialFABs({
  whatsapp,
  whatsappUrl,
  facebookUrl,
  instagramUrl,
  linkedinUrl,
  tiktokUrl,
}: SocialFABsProps) {
  const pathname = usePathname();
  const locale = useLocale();
  if (pathname?.includes("/admin")) return null;
  const currentLocale = locale || "en";
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
      icon: MessageCircle,
      className: "bg-[#25D366] hover:bg-[#1ebe57]",
    },
    {
      key: "facebook",
      href: facebookUrl || "",
      label: "Facebook",
      icon: Facebook,
      className: "bg-[#1877F2] hover:bg-[#1669d1]",
    },
    {
      key: "instagram",
      href: instagramUrl || "",
      label: "Instagram",
      icon: Instagram,
      className: "bg-[#E4405F] hover:bg-[#d73656]",
    },
    {
      key: "linkedin",
      href: linkedinUrl || "",
      label: "LinkedIn",
      icon: Linkedin,
      className: "bg-[#0A66C2] hover:bg-[#0958a7]",
    },
    {
      key: "tiktok",
      href: tiktokUrl || "",
      label: "TikTok",
      icon: Music2,
      className: "bg-black hover:bg-zinc-800",
    },
  ].filter((link) => Boolean(link.href));

  if (links.length === 0) return null;
  const whatsappHref = links.find((item) => item.key === "whatsapp")?.href || "";
  const askAssistant = () => {
    const question = message.trim();
    if (!question) return;

    const normalizedQuestion = normalizeFaqSearchText(question);
    const found = faqEntries.find((entry) => {
      const haystack = normalizeFaqSearchText(
        [entry.question, ...entry.keywords, faqBlocksToPlainText(entry.blocks)].join(" ")
      );
      return (
        entry.keywords.some((kw) => normalizedQuestion.includes(normalizeFaqSearchText(kw))) ||
        haystack.includes(normalizedQuestion)
      );
    });
    const reply = found
      ? `${faqBlocksToPlainText(found.blocks)} ${assistantCopy.readMore}`
      : assistantCopy.notFound;

    setChat((prev) => [...prev, { role: "user", text: question }, { role: "bot", text: reply }]);
    setMessage("");
  };

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end sm:right-6">
      {open ? (
        <div
          className="mb-3 flex h-[34rem] w-[24rem] max-h-[78vh] max-w-[92vw] flex-col overflow-hidden rounded-[1.75rem] border border-[#efe7df] bg-white/96 shadow-[0_30px_80px_-35px_rgba(15,23,42,0.35)] backdrop-blur-sm"
          style={{ width: "24rem", maxWidth: "92vw", maxHeight: "78vh" }}
        >
          <div className="flex shrink-0 items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 font-semibold">
              <Bot className="h-5 w-5 text-[#FF912C]" />
              {assistantCopy.title}
            </div>
            <button title="mix"
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
                  <NextLink
                    key={link.key}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-white ${link.className}`}
                    aria-label={link.label}
                    title={link.label}
                  >
                    <Icon className="h-7 w-7" />
                  </NextLink>
                );
              })}
              <IntlLink
                href="/faq"
                className="inline-flex h-12 items-center rounded-full bg-[#FFF4E6] px-4 text-sm font-medium text-[#FF912C] hover:bg-[#FFE8CC]"
              >
                FAQ
              </IntlLink>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <div className="space-y-3">
              {chat.map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                    item.role === "user"
                      ? "ml-auto bg-[#FF912C] text-white"
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  {item.text}
                  {item.role === "bot" && item.text.includes("WhatsApp") && whatsappHref ? (
                    <div className="mt-2">
                      <NextLink href={whatsappHref} target="_blank" rel="noopener noreferrer" className="text-[#FF912C] underline">
                        {assistantCopy.openWhatsapp}
                      </NextLink>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 p-3">
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
              <Button type="submit" size="icon" className="h-10 w-10 bg-[#FF912C] text-white hover:bg-[#E67F1F]">
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
        className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#FF912C] text-white shadow-[0_18px_40px_-16px_rgba(255,145,44,0.45)] transition hover:bg-[#E67F1F]"
        style={{ backgroundColor: "#FF912C", color: "#ffffff" }}
      >
        <Bot className="h-8 w-8 text-white" />
      </button>
    </div>
  );
}
