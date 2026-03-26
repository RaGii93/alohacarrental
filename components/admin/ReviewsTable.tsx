"use client";

import { useState } from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CompactText } from "@/components/shared/CompactText";
import { setReviewVisibilityAction } from "@/actions/reviews";
import { formatDate } from "@/lib/datetime";

function stars(rating: number) {
  return "★".repeat(Math.max(0, Math.min(5, rating))) + "☆".repeat(Math.max(0, 5 - rating));
}

export function ReviewsTable({ reviews, locale }: { reviews: any[]; locale: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<"bookingCode" | "customerName" | "rating" | "status" | "createdAt">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "createdAt" ? "desc" : "asc");
  };

  const sortIndicator = (key: typeof sortKey) => (sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "");

  const sorted = useMemo(() => {
    const rows = [...reviews];
    rows.sort((a, b) => {
      const valA =
        sortKey === "bookingCode"
          ? String(a.bookingCode || "").toLowerCase()
          : sortKey === "customerName"
            ? String(a.customerName || "").toLowerCase()
            : sortKey === "rating"
              ? Number(a.rating || 0)
              : sortKey === "status"
                ? (a.isVisible ? 1 : 0)
                : new Date(a.createdAt).getTime();
      const valB =
        sortKey === "bookingCode"
          ? String(b.bookingCode || "").toLowerCase()
          : sortKey === "customerName"
            ? String(b.customerName || "").toLowerCase()
            : sortKey === "rating"
              ? Number(b.rating || 0)
              : sortKey === "status"
                ? (b.isVisible ? 1 : 0)
                : new Date(b.createdAt).getTime();
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [reviews, sortKey, sortDir]);

  const pageRows = sorted;

  const onToggle = async (reviewId: string, isVisible: boolean) => {
    setBusyId(reviewId);
    const result = await setReviewVisibilityAction(reviewId, isVisible, locale);
    setBusyId(null);
    if (!result.success) {
      toast.error(result.error || t("admin.dashboard.reviews.messages.updateFailed"));
      return;
    }
    toast.success(isVisible ? t("admin.dashboard.reviews.messages.visible") : t("admin.dashboard.reviews.messages.hidden"));
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_24px_56px_-32px_hsl(215_28%_17%/0.12)] ring-1 ring-[hsl(215_25%_27%/0.05)]">
      <Table className="bg-transparent">
        <TableHeader>
          <TableRow>
            <TableHead><button type="button" onClick={() => toggleSort("bookingCode")}>{t("admin.dashboard.reviews.table.booking")}{sortIndicator("bookingCode")}</button></TableHead>
            <TableHead><button type="button" onClick={() => toggleSort("customerName")}>{t("admin.dashboard.reviews.table.customer")}{sortIndicator("customerName")}</button></TableHead>
            <TableHead><button type="button" onClick={() => toggleSort("rating")}>{t("admin.dashboard.reviews.table.rating")}{sortIndicator("rating")}</button></TableHead>
            <TableHead>{t("admin.dashboard.reviews.table.review")}</TableHead>
            <TableHead><button type="button" onClick={() => toggleSort("status")}>{t("admin.dashboard.reviews.table.status")}{sortIndicator("status")}</button></TableHead>
            <TableHead><button type="button" onClick={() => toggleSort("createdAt")}>{t("admin.dashboard.reviews.table.date")}{sortIndicator("createdAt")}</button></TableHead>
            <TableHead>{t("admin.dashboard.reviews.table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((review) => (
            <TableRow key={review.id}>
              <TableCell className="font-medium">{review.bookingCode}</TableCell>
              <TableCell>{review.customerName}</TableCell>
              <TableCell>{stars(review.rating)} ({review.rating}/5)</TableCell>
              <TableCell>
                <CompactText text={review.comment} widthClassName="max-w-[26rem]" expandedTitle={t("admin.dashboard.reviews.table.fullReview")} />
              </TableCell>
              <TableCell>
                <Badge className={review.isVisible ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"}>
                  {review.isVisible ? t("admin.dashboard.reviews.visibility.visible") : t("admin.dashboard.reviews.visibility.hidden")}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(review.createdAt)}</TableCell>
              <TableCell>
                {review.isVisible ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === review.id}
                    onClick={() => onToggle(review.id, false)}
                  >
                    {t("common.hide")}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={busyId === review.id}
                    onClick={() => onToggle(review.id, true)}
                  >
                    {t("common.show")}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {reviews.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-sm text-muted-foreground">
                {t("admin.dashboard.reviews.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
