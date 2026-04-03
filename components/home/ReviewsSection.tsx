"use client";

import Image from "next/image";
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
  const [cardsPerView, setCardsPerView] = useState(3);
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
      if (window.innerWidth >= 1280) setCardsPerView(3);
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(228,98,170,0.1),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(255,210,63,0.16),transparent_24%),radial-gradient(circle_at_10%_85%,rgba(255,145,28,0.12),transparent_26%)]" />
      <div className="relative mx-auto max-w-7xl space-y-8">
        <Reveal className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div className="space-y-4">
            <span className="public-eyebrow inline-flex w-fit rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
              Guest postcards
            </span>
            <h2 className="public-postcard-title max-w-3xl text-3xl font-black sm:text-4xl lg:text-5xl">
              {t("landing.reviews.title")}
            </h2>
            <p className="public-postcard-copy max-w-2xl text-base sm:text-lg">
              {t("landing.reviews.subtitle")}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="public-glass-card rounded-[1.6rem] p-5">
              <div className="text-3xl font-black text-[rgb(141,74,11)]">{averageRating}</div>
              <div className="mt-2">
                <StarRating count={Math.round(Number(averageRating))} />
              </div>
            </div>
            <div className="public-glass-card rounded-[1.6rem] p-5">
              <div className="text-3xl font-black text-[rgb(141,74,11)]">{visibleReviews.length || 0}</div>
              <div className="mt-1 text-sm font-medium text-[rgba(46,64,134,0.92)]">{t("landing.reviews.title")}</div>
            </div>
            <div className="public-glass-card rounded-[1.6rem] p-5">
              <div className="text-3xl font-black text-[rgb(141,74,11)]">{faqItems.length}</div>
              <div className="mt-1 text-sm font-medium text-[rgba(46,64,134,0.92)]">{t("nav.faq")}</div>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <Reveal>
            <div className="public-photo-frame overflow-hidden rounded-[2rem] p-4">
              <div className="relative min-h-[28rem] overflow-hidden rounded-[1.6rem]">
                <Image
                  src="/images/Toren.jpeg"
                  alt="Historic tower view in Bonaire"
                  fill
                  sizes="(max-width: 1280px) 100vw, 34vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,19,43,0.06),rgba(10,19,43,0.52))]" />
                <div className="absolute left-5 top-5 max-w-[17rem] rounded-[1.5rem] bg-white/90 p-4 text-[rgb(141,74,11)] shadow-[0_22px_48px_-28px_rgba(15,23,42,0.34)] backdrop-blur-xl">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[rgb(228,98,170)]">Bonaire notes</p>
                  <p className="mt-2 text-sm leading-7 text-[rgba(46,64,134,0.92)]">
                    The best guest stories usually start with a simple plan: collect the keys, follow the coast, and stop where the island tells you to.
                  </p>
                </div>
                <div className="public-photo-label absolute bottom-5 left-5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]">
                  From beach to town in one easy drive
                </div>
              </div>
            </div>
          </Reveal>

          <div className="space-y-4">
            {loading ? (
              <Card className="public-glass-card rounded-[1.75rem] p-6 text-center text-[rgba(46,64,134,0.92)]">
                We are gathering recent guest feedback.
              </Card>
            ) : visibleReviews.length === 0 ? (
              <Card className="public-glass-card rounded-[1.75rem] p-6 text-center text-[rgba(46,64,134,0.92)]">
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
                        <div key={pageIndex} className="grid w-full shrink-0 gap-5 md:grid-cols-2 xl:grid-cols-3">
                          {page.map((review) => (
                            <Card key={review.id} className="public-glass-card rounded-[1.9rem] p-0">
                              <div className="space-y-4 p-6">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[rgb(141,74,11)]">
                                      <MessageCircleMoreIcon className="h-5 w-5 text-[rgb(228,98,170)]" />
                                      <span className="font-black">{review.customerName}</span>
                                    </div>
                                    <StarRating count={review.rating} />
                                  </div>
                                  <span className="rounded-full bg-[rgba(255,247,237,0.94)] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[rgb(141,74,11)]">
                                    {formatDate(review.createdAt)}
                                  </span>
                                </div>
                                <p className="text-base leading-8 text-[rgba(46,64,134,0.92)]">"{review.comment}"</p>
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
                            className={`h-2.5 rounded-full transition-all ${activePage === pageIndex ? "w-8 bg-[rgb(196,69,142)]" : "w-2.5 bg-[rgba(251,191,36,0.55)]"}`}
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
    </section>
  );
}
