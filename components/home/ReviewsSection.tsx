"use client";

import { MessageCircleMoreIcon, StarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { formatDate } from "@/lib/datetime";
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
  const rating = Math.max(0, Math.min(5, Math.round(count)));
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={i < rating ? "h-4 w-4 fill-[#f4b400] text-[#f4b400]" : "h-4 w-4 fill-transparent text-[#d4a017]"}
        />
      ))}
    </div>
  );
}

export default function ReviewsSection({ reviews, loading = false, faqItems }: ReviewsSectionProps) {
  const t = useTranslations();
  const [cardsPerView, setCardsPerView] = useState(4);
  const [activePage, setActivePage] = useState(0);
  const visibleReviews = reviews.filter((review) => review?.isVisible !== false);
  const averageRating = visibleReviews.length
    ? (visibleReviews.reduce((sum, review) => sum + review.rating, 0) / visibleReviews.length).toFixed(1)
    : "5.0";
  const pageCount = Math.max(1, Math.ceil(visibleReviews.length / cardsPerView));
  const pagedReviews = useMemo(
    () =>
      Array.from({ length: pageCount }, (_, pageIndex) =>
        visibleReviews.slice(pageIndex * cardsPerView, pageIndex * cardsPerView + cardsPerView)
      ),
    [cardsPerView, pageCount, visibleReviews]
  );

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth >= 1280) setCardsPerView(4);
      else if (window.innerWidth >= 1024) setCardsPerView(3);
      else if (window.innerWidth >= 640) setCardsPerView(2);
      else setCardsPerView(1);
    };

    updateCardsPerView();
    window.addEventListener("resize", updateCardsPerView);
    return () => window.removeEventListener("resize", updateCardsPerView);
  }, []);

  useEffect(() => {
    setActivePage((current) => Math.min(current, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  useEffect(() => {
    if (pageCount <= 1) return;
    const interval = window.setInterval(() => {
      setActivePage((current) => (current + 1) % pageCount);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [pageCount]);

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

        <div className="space-y-5">
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
              <Reveal>
                <div className="space-y-4">
                  <div className="overflow-hidden">
                    <div
                      className="flex transition-transform duration-700 ease-out"
                      style={{ transform: `translateX(-${activePage * 100}%)` }}
                    >
                      {pagedReviews.map((page, pageIndex) => (
                        <div key={pageIndex} className="grid w-full shrink-0 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {page.map((review) => (
                            <Card key={review.id} className="public-glass-card rounded-[1.85rem] p-0">
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
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {pageCount > 1 ? (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        {pagedReviews.map((_, pageIndex) => (
                          <button
                            key={pageIndex}
                            type="button"
                            aria-label={`Show review group ${pageIndex + 1}`}
                            onClick={() => setActivePage(pageIndex)}
                            className={`h-2.5 rounded-full transition-all ${activePage === pageIndex ? "w-8 bg-[rgb(19,120,152)]" : "w-2.5 bg-slate-300"}`}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-full"
                          onClick={() => setActivePage((current) => (current - 1 + pageCount) % pageCount)}
                        >
                          <ChevronLeftIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-full"
                          onClick={() => setActivePage((current) => (current + 1) % pageCount)}
                        >
                          <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </Reveal>
            )}
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
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
}
