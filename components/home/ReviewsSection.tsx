"use client";

import { StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card.tsx";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion.tsx";
import { formatDate } from "@/lib/datetime";

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

  return (
    <section className="relative bg-gradient-to-b from-[#e0f4ff] to-[#f0f9ff] px-4 py-16 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-2 text-center text-3xl font-extrabold italic sm:text-4xl">
          {t("landing.reviews.title")}
        </h2>
        <p className="mb-12 text-center text-muted-foreground">{t("landing.reviews.subtitle")}</p>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            {loading ? (
              <Card className="border-0 p-5 text-center text-muted-foreground shadow-md">
                {t("common.loading")}
              </Card>
            ) : visibleReviews.length === 0 ? (
              <Card className="border-0 p-5 text-center text-muted-foreground shadow-md">
                {t("landing.reviews.empty")}
              </Card>
            ) : (
              visibleReviews.map((review) => (
                <Card key={review.id} className="border-0 p-0 shadow-md">
                  <div className="space-y-3 p-5">
                    <div className="flex items-center justify-between">
                      <StarRating count={review.rating} />
                      <span className="font-bold">{review.customerName}</span>
                    </div>
                    <p className="text-muted-foreground italic">"{review.comment}"</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                </Card>
              ))
            )}
          </div>

          <div>
            <h3 className="mb-3 text-lg font-bold">{t("nav.faq")}</h3>
            <Accordion type="single" collapsible className="space-y-2">
              {faqItems.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={`item-${faq.id}`}
                  className="rounded-xl border-0 bg-card px-5 shadow-md"
                >
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
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
            fill="#071a36"
          />
        </svg>
      </div>
    </section>
  );
}
