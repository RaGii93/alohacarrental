"use client";

import { MessageCircleMoreIcon, StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion.tsx";
import { formatDate } from "@/lib/datetime";
import { Link } from "@/i18n/navigation";
import Reveal from "./Reveal";

type ReviewItem = {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVisible?: boolean;
};

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

type ReviewsSectionProps = {
  reviews: ReviewItem[];
  loading?: boolean;
  faqItems: FaqItem[];
};

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: Math.max(1, Math.min(5, count)) }).map((_, i) => (
        <StarIcon key={i} className="h-4 w-4 fill-primary text-primary" />
      ))}
    </div>
  );
}

export default function ReviewsSection({ reviews, loading = false, faqItems }: ReviewsSectionProps) {
  const t = useTranslations();
  const visibleReviews = reviews.filter((review) => review?.isVisible !== false);
  const averageRating = visibleReviews.length
    ? (visibleReviews.reduce((sum, review) => sum + review.rating, 0) / visibleReviews.length).toFixed(1)
    : "5.0";

  return (
    <section className="public-shell-bg relative overflow-hidden px-4 py-16 pb-24 sm:px-6 lg:px-8 lg:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(15,39,64,0.08),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(23,184,197,0.12),transparent_24%),radial-gradient(circle_at_10%_85%,rgba(194,178,128,0.1),transparent_26%)]" />
      <div className="relative mx-auto max-w-7xl">
        <Reveal className="mb-12 max-w-3xl space-y-4">
          <span className="public-eyebrow inline-flex w-fit rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
            Aloha Car Rental
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl lg:text-5xl">
            {t("landing.reviews.title")}
          </h2>
          <p className="text-base leading-7 text-[hsl(var(--muted-foreground))] sm:text-lg">
            {t("landing.reviews.subtitle")}
          </p>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <Reveal>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="public-glass-card rounded-[1.5rem] p-5">
                  <div className="text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))]">{averageRating}</div>
                  <div className="mt-2">
                    <StarRating count={Math.round(Number(averageRating))} />
                  </div>
                </div>
                <div className="public-glass-card rounded-[1.5rem] p-5">
                  <div className="text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))]">{visibleReviews.length || 0}</div>
                  <div className="mt-1 text-sm font-medium text-[hsl(var(--muted-foreground))]">{t("landing.reviews.title")}</div>
                </div>
                <div className="public-glass-card rounded-[1.5rem] p-5">
                  <div className="text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))]">{faqItems.length}</div>
                  <div className="mt-1 text-sm font-medium text-[hsl(var(--muted-foreground))]">{t("nav.faq")}</div>
                </div>
              </div>
            </Reveal>

            {loading ? (
              <Card className="public-glass-card rounded-[1.75rem] p-6 text-center text-[hsl(var(--muted-foreground))]">
                We are gathering recent guest feedback.
              </Card>
            ) : visibleReviews.length === 0 ? (
              <Card className="public-glass-card rounded-[1.75rem] p-6 text-center text-[hsl(var(--muted-foreground))]">
                Guest reviews will appear here as new bookings are completed.
              </Card>
            ) : (
              visibleReviews.map((review, index) => (
                <Reveal key={review.id} delay={index * 80}>
                  <Card className="public-glass-card rounded-[1.85rem] p-0">
                    <div className="space-y-4 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[hsl(var(--foreground))]">
                            <MessageCircleMoreIcon className="h-5 w-5 text-[rgb(19,120,152)]" />
                            <span className="font-bold">{review.customerName}</span>
                          </div>
                          <StarRating count={review.rating} />
                        </div>
                        <span className="public-chip rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <p className="text-base leading-7 text-[hsl(var(--muted-foreground))]">"{review.comment}"</p>
                    </div>
                  </Card>
                </Reveal>
              ))
            )}
          </div>

          <Reveal className="lg:self-start">
            <div className="overflow-hidden rounded-[2rem] border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(180deg,rgba(11,31,51,0.98),rgba(18,50,75,0.97)_58%,rgba(15,95,114,0.92)_100%)] text-white shadow-[0_34px_90px_-44px_rgba(15,23,42,0.45)] ring-1 ring-white/8 backdrop-blur-xl">
              <div className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 sm:p-8">
                <div className="mb-6 space-y-3">
                  <span className="inline-flex rounded-full border border-white/14 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                    Aloha Car Rental
                  </span>
                  <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("nav.faq")}</h3>
                  <p className="max-w-lg text-sm leading-6 text-white/72">
                    {t("landing.reviews.faqPreview")}
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <Accordion collapsible className="space-y-3">
                  {faqItems.map((faq) => (
                    <AccordionItem
                      key={faq.id}
                      value={`item-${faq.id}`}
                      className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.08)] px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    >
                      <AccordionTrigger className="text-left font-semibold text-white hover:bg-white/6 hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="border-white/10 text-white/72">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div className="border-t border-white/10 p-5 sm:p-6">
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-full border-white/14 bg-white/10 font-bold text-white hover:bg-white/14 hover:text-white"
                >
                  <Link href="/faq">{t("landing.reviews.viewAllFaq")}</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 translate-y-[1px]">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          preserveAspectRatio="none"
          className="block h-[60px] w-full"
        >
          <path
            d="M0,20 C360,55 720,5 1080,35 C1280,55 1440,20 1440,20 L1440,60 L0,60 Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
}
