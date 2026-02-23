"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Car, Shield, Clock, Star, ArrowRight, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/datetime";

type PublicReview = {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

function renderStars(rating: number) {
  const safe = Math.max(1, Math.min(5, rating));
  return "★".repeat(safe) + "☆".repeat(5 - safe);
}

export function HomePageClient() {
  const t = useTranslations();
  const router = useRouter();
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bookingCode, setBookingCode] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const features = useMemo(
    () => [
      {
        icon: Car,
        title: t("landing.whyChoose.features.selection.title"),
        description: t("landing.whyChoose.features.selection.description"),
      },
      {
        icon: Shield,
        title: t("landing.whyChoose.features.security.title"),
        description: t("landing.whyChoose.features.security.description"),
      },
      {
        icon: Clock,
        title: t("landing.whyChoose.features.support.title"),
        description: t("landing.whyChoose.features.support.description"),
      },
      {
        icon: Star,
        title: t("landing.whyChoose.features.rating.title"),
        description: t("landing.whyChoose.features.rating.description"),
      },
    ],
    [t]
  );

  useEffect(() => {
    let active = true;
    const loadReviews = async () => {
      try {
        const response = await fetch("/api/reviews", { method: "GET" });
        const payload = await response.json();
        if (!active) return;
        if (payload?.success && Array.isArray(payload.reviews)) {
          setReviews(payload.reviews);
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

  const submitReview = async () => {
    if (!bookingCode.trim()) {
      toast.error(t("landing.reviews.errors.codeRequired"));
      return;
    }
    if (!comment.trim() || comment.trim().length < 5) {
      toast.error(t("landing.reviews.errors.commentShort"));
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingCode: bookingCode.trim(),
          rating,
          comment: comment.trim(),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        if (payload?.error === "BOOKING_CODE_NOT_FOUND") {
          toast.error(t("landing.reviews.errors.bookingNotFound"));
        } else if (payload?.error === "REVIEW_ALREADY_EXISTS") {
          toast.error(t("landing.reviews.errors.alreadyReviewed"));
        } else {
          toast.error(payload?.error || t("landing.reviews.errors.submitFailed"));
        }
        return;
      }

      toast.success(t("landing.reviews.success.pendingApproval"));
      setDialogOpen(false);
      setBookingCode("");
      setRating(5);
      setComment("");
    } catch {
      toast.error(t("landing.reviews.errors.submitFailed"));
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl animate-bounce" />
      </div>

      <section className="relative z-10 min-h-[calc(100vh-100px)] flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Badge variant="secondary" className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/20 transition-colors">
              {t("landing.badge")}
            </Badge>
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              {t("landing.title")}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 animate-pulse">
                {t("landing.tagline")}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              {t("landing.subtitle")}
            </p>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
              onClick={() => router.push("/book")}
            >
              {t("landing.cta")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-full backdrop-blur-sm transition-all duration-300"
              onClick={() => router.push("/admin/login")}
            >
              {t("nav.login")}
            </Button>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{t("landing.stats.vehicles")}</div>
              <div className="text-gray-400">{t("landing.stats.vehiclesLabel")}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{t("landing.stats.customers")}</div>
              <div className="text-gray-400">{t("landing.stats.customersLabel")}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{t("landing.stats.locations")}</div>
              <div className="text-gray-400">{t("landing.stats.locationsLabel")}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{t("landing.stats.support")}</div>
              <div className="text-gray-400">{t("landing.stats.supportLabel")}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">{t("landing.whyChoose.title")}</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">{t("landing.whyChoose.subtitle")}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-bounce">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-md rounded-3xl p-12 border border-white/10">
            <h2 className="text-4xl font-bold text-white mb-4">{t("landing.ctaSection.title")}</h2>
            <p className="text-xl text-gray-300 mb-8">{t("landing.ctaSection.subtitle")}</p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105"
              onClick={() => router.push("/book")}
            >
              {t("landing.ctaSection.button")}
              <CheckCircle className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 bg-black/25">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white">{t("landing.reviews.title")}</h2>
              <p className="text-gray-300 mt-2">{t("landing.reviews.subtitle")}</p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="bg-white text-slate-900 hover:bg-slate-100">
              {t("landing.reviews.leaveButton")}
            </Button>
          </div>

          {loadingReviews ? (
            <p className="text-gray-300">{t("common.loading")}</p>
          ) : reviews.length === 0 ? (
            <p className="text-gray-300">{t("landing.reviews.empty")}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {reviews.map((review) => (
                <Card key={review.id} className="bg-white/10 border-white/20 backdrop-blur-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-white">{review.customerName}</p>
                      <p className="text-amber-300 text-sm">{renderStars(review.rating)} ({review.rating}/5)</p>
                    </div>
                    <p className="text-gray-200 mt-3">{review.comment}</p>
                    <p className="text-xs text-gray-400 mt-4">{formatDate(review.createdAt)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("landing.reviews.form.title")}</DialogTitle>
            <DialogDescription>{t("landing.reviews.form.subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reviewBookingCode">{t("landing.reviews.form.bookingCode")}</Label>
              <Input
                id="reviewBookingCode"
                value={bookingCode}
                onChange={(event) => setBookingCode(event.target.value)}
                placeholder={t("landing.reviews.form.bookingCodePlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("landing.reviews.form.rating")}</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`h-9 w-9 rounded-md border text-sm ${
                      rating === value ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-300"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reviewComment">{t("landing.reviews.form.comment")}</Label>
              <Textarea
                id="reviewComment"
                rows={4}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={t("landing.reviews.form.commentPlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submittingReview}>
              {t("common.cancel")}
            </Button>
            <Button onClick={submitReview} disabled={submittingReview}>
              {submittingReview ? t("common.loading") : t("landing.reviews.form.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
