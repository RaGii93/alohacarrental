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
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fafbfd_0%,#ffffff_48%,#fcfbfd_100%)] px-4 py-16 pb-24 sm:px-6 lg:px-8 lg:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,hsl(var(--primary)/0.1),transparent_30%),radial-gradient(circle_at_85%_15%,hsl(var(--accent)/0.18),transparent_24%)]" />
      <div className="relative mx-auto max-w-7xl">
        <Reveal className="mb-12 max-w-3xl space-y-4">
          <span className="inline-flex w-fit rounded-full border border-[hsl(var(--border))] bg-white/75 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--accent-foreground))] shadow-sm backdrop-blur">
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
                <div className="rounded-[1.5rem] border border-[hsl(var(--border))] bg-white p-5 shadow-[0_24px_50px_-42px_hsl(var(--foreground)/0.12)]">
                  <div className="text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))]">{averageRating}</div>
                  <div className="mt-2">
                    <StarRating count={Math.round(Number(averageRating))} />
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-[hsl(var(--border))] bg-white p-5 shadow-[0_24px_50px_-42px_hsl(var(--foreground)/0.12)]">
                  <div className="text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))]">{visibleReviews.length || 0}</div>
                  <div className="mt-1 text-sm font-medium text-[hsl(var(--muted-foreground))]">{t("landing.reviews.title")}</div>
                </div>
                <div className="rounded-[1.5rem] border border-[hsl(var(--border))] bg-white p-5 shadow-[0_24px_50px_-42px_hsl(var(--foreground)/0.12)]">
                  <div className="text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))]">{faqItems.length}</div>
                  <div className="mt-1 text-sm font-medium text-[hsl(var(--muted-foreground))]">{t("nav.faq")}</div>
                </div>
              </div>
            </Reveal>

            {loading ? (
              <Card className="rounded-[1.75rem] border-[hsl(var(--border))] bg-white p-6 text-center text-[hsl(var(--muted-foreground))] shadow-[0_24px_50px_-42px_hsl(var(--foreground)/0.12)]">
                {t("common.loading")}
              </Card>
            ) : visibleReviews.length === 0 ? (
              <Card className="rounded-[1.75rem] border-[hsl(var(--border))] bg-white p-6 text-center text-[hsl(var(--muted-foreground))] shadow-[0_24px_50px_-42px_hsl(var(--foreground)/0.12)]">
                {t("landing.reviews.empty")}
              </Card>
            ) : (
              visibleReviews.map((review, index) => (
                <Reveal key={review.id} delay={index * 80}>
                  <Card className="rounded-[1.75rem] border-[hsl(var(--border))] bg-white p-0 shadow-[0_24px_50px_-42px_hsl(var(--foreground)/0.12)]">
                    <div className="space-y-4 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[hsl(var(--foreground))]">
                            <MessageCircleMoreIcon className="h-5 w-5 text-[hsl(var(--primary))]" />
                            <span className="font-bold">{review.customerName}</span>
                          </div>
                          <StarRating count={review.rating} />
                        </div>
                        <span className="rounded-full bg-[hsl(var(--accent)/0.35)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
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
            <div className="overflow-hidden rounded-[2rem] border border-[hsl(var(--border)/0.8)] bg-[linear-gradient(180deg,rgba(255,255,255,0.84),hsl(var(--accent)/0.16))] text-[hsl(var(--foreground))] shadow-[0_30px_90px_-48px_hsl(var(--foreground)/0.14)] ring-1 ring-white/50 backdrop-blur-md">
              <div className="border-b border-[hsl(var(--border)/0.75)] bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(255,255,255,0.18))] p-6 sm:p-8">
                <div className="mb-6 space-y-3">
                  <span className="inline-flex rounded-full border border-[hsl(var(--border))] bg-white/72 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--primary))]">
                    Aloha Car Rental
                  </span>
                  <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("nav.faq")}</h3>
                  <p className="max-w-lg text-sm leading-6 text-[hsl(var(--muted-foreground))]">
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
                      className="rounded-2xl border border-[hsl(var(--border)/0.8)] bg-white/74 px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
                    >
                      <AccordionTrigger className="text-left font-semibold text-[hsl(var(--foreground))] hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-[hsl(var(--muted-foreground))]">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div className="border-t border-[hsl(var(--border)/0.75)] p-5 sm:p-6">
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-full border-[hsl(var(--border))] bg-white/80 font-bold text-[hsl(var(--foreground))] hover:bg-white hover:text-[hsl(var(--foreground))]"
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
