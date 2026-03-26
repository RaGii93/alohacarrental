"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { getFaqEntries } from "@/lib/faq";
import HeroSection from "./HeroSection";
import FleetSection from "./FleetSection";
import FooterSection from "./FooterSection";
import WhyChooseSection from "./Why-Choose-Section";
import ReviewsSection from "./ReviewsSection";
import CtaSection from "./CtaSection";

type PublicReview = {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVisible?: boolean;
};

type HomePageClientProps = {
  locations: { id: string; name: string; address?: string | null }[];
  categories: { id: string; name: string; seats: number; imageUrl: string | null }[];
};

export function HomePageClient({ locations, categories }: HomePageClientProps) {
  const locale = useLocale();
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const faqEntries = useMemo(
    () =>
      getFaqEntries(locale)
        .slice(0, 5)
        .map((entry) => ({
          id: entry.id,
          question: entry.question,
          answer: entry.blocks
            .map((block) =>
              block.type === "paragraph"
                ? block.runs.map((run) => run.text).join("")
                : block.items.map((item) => item.map((run) => run.text).join("")).join(" ")
            )
            .join(" "),
        })),
    [locale]
  );

  useEffect(() => {
    let active = true;

    const loadReviews = async () => {
      try {
        const response = await fetch("/api/reviews", { method: "GET" });
        const payload = await response.json();

        if (!active) return;

        if (payload?.success && Array.isArray(payload.reviews)) {
          const visibleReviews = payload.reviews.filter((review: PublicReview) => review?.isVisible !== false);
          setReviews(visibleReviews);
        } else {
          setReviews([]);
        }
      } catch {
        if (active) setReviews([]);
      } finally {
        if (active) setLoadingReviews(false);
      }
    };

    loadReviews();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <HeroSection locations={locations} />
      <FleetSection categories={categories} />
      <WhyChooseSection />
      <ReviewsSection reviews={reviews} loading={loadingReviews} faqItems={faqEntries} />
      <CtaSection />
      <FooterSection />
    </>
  );
}
