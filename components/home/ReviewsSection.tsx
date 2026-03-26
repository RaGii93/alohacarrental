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
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#dff5ff_0%,#f4fbff_48%,#fffef8_100%)] px-4 py-16 pb-24 sm:px-6 lg:px-8 lg:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(42,164,206,0.18),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(247,191,0,0.14),transparent_24%)]" />
      <div className="relative mx-auto max-w-7xl">
        <Reveal className="mb-12 max-w-3xl space-y-4">
          <span className="inline-flex w-fit rounded-full border border-[#0b2346]/10 bg-white/75 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#0b2346]/72 shadow-sm backdrop-blur">
            Aloha Car Rental
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#071a36] sm:text-4xl lg:text-5xl">
            {t("landing.reviews.title")}
          </h2>
          <p className="text-base leading-7 text-[#35506d] sm:text-lg">
            {t("landing.reviews.subtitle")}
          </p>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <Reveal>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 shadow-[0_24px_50px_-42px_rgba(7,26,54,0.65)] backdrop-blur">
                  <div className="text-3xl font-extrabold tracking-tight text-[#071a36]">{averageRating}</div>
                  <div className="mt-2">
                    <StarRating count={Math.round(Number(averageRating))} />
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 shadow-[0_24px_50px_-42px_rgba(7,26,54,0.65)] backdrop-blur">
                  <div className="text-3xl font-extrabold tracking-tight text-[#071a36]">{visibleReviews.length || 0}</div>
                  <div className="mt-1 text-sm font-medium text-[#45627e]">{t("landing.reviews.title")}</div>
                </div>
                <div className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 shadow-[0_24px_50px_-42px_rgba(7,26,54,0.65)] backdrop-blur">
                  <div className="text-3xl font-extrabold tracking-tight text-[#071a36]">{faqItems.length}</div>
                  <div className="mt-1 text-sm font-medium text-[#45627e]">{t("nav.faq")}</div>
                </div>
              </div>
            </Reveal>

            {loading ? (
              <Card className="rounded-[1.75rem] border-white/70 bg-white/85 p-6 text-center text-[#45627e] shadow-[0_24px_50px_-42px_rgba(7,26,54,0.65)] backdrop-blur">
                {t("common.loading")}
              </Card>
            ) : visibleReviews.length === 0 ? (
              <Card className="rounded-[1.75rem] border-white/70 bg-white/85 p-6 text-center text-[#45627e] shadow-[0_24px_50px_-42px_rgba(7,26,54,0.65)] backdrop-blur">
                {t("landing.reviews.empty")}
              </Card>
            ) : (
              visibleReviews.map((review, index) => (
                <Reveal key={review.id} delay={index * 80}>
                  <Card className="rounded-[1.75rem] border-white/70 bg-white/88 p-0 shadow-[0_24px_50px_-42px_rgba(7,26,54,0.65)] backdrop-blur">
                    <div className="space-y-4 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[#071a36]">
                            <MessageCircleMoreIcon className="h-5 w-5 text-[#2aa4ce]" />
                            <span className="font-bold">{review.customerName}</span>
                          </div>
                          <StarRating count={review.rating} />
                        </div>
                        <span className="rounded-full bg-[#f5fbff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#45627e]">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <p className="text-base leading-7 text-[#35506d]">"{review.comment}"</p>
                    </div>
                  </Card>
                </Reveal>
              ))
            )}
          </div>

          <Reveal className="lg:self-start">
            <div className="overflow-hidden rounded-[2rem] border border-[#0b2346]/8 bg-[#071a36] text-white shadow-[0_30px_90px_-48px_rgba(7,26,54,0.95)]">
              <div className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-6 sm:p-8">
                <div className="mb-6 space-y-3">
                  <span className="inline-flex rounded-full border border-white/14 bg-white/8 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/68">
                    Aloha Car Rental
                  </span>
                  <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("nav.faq")}</h3>
                  <p className="max-w-lg text-sm leading-6 text-white/68">
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
                      className="rounded-2xl border border-white/10 bg-white/6 px-5 shadow-inner"
                    >
                      <AccordionTrigger className="text-left font-semibold text-white hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-white/72">
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
                  className="w-full rounded-full border-white/20 bg-white/8 font-bold text-white hover:bg-white/14 hover:text-white"
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
            fill="#fffef8"
          />
        </svg>
      </div>
    </section>
  );
}
