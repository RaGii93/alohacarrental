"use client";

import { useState } from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { setReviewVisibilityAction } from "@/actions/reviews";
import { TablePaginationControls } from "@/components/admin/TablePaginationControls";
import { formatDate } from "@/lib/datetime";

function stars(rating: number) {
  return "★".repeat(Math.max(0, Math.min(5, rating))) + "☆".repeat(Math.max(0, 5 - rating));
}

export function ReviewsTable({ reviews, locale }: { reviews: any[]; locale: string }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const onToggle = async (reviewId: string, isVisible: boolean) => {
    setBusyId(reviewId);
    const result = await setReviewVisibilityAction(reviewId, isVisible, locale);
    setBusyId(null);
    if (!result.success) {
      toast.error(result.error || "Failed to update review");
      return;
    }
    toast.success(isVisible ? "Review is now visible" : "Review is now hidden");
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <TablePaginationControls
        page={currentPage}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><button type="button" onClick={() => toggleSort("bookingCode")}>Booking{sortIndicator("bookingCode")}</button></TableHead>
            <TableHead><button type="button" onClick={() => toggleSort("customerName")}>Customer{sortIndicator("customerName")}</button></TableHead>
            <TableHead><button type="button" onClick={() => toggleSort("rating")}>Rating{sortIndicator("rating")}</button></TableHead>
            <TableHead>Review</TableHead>
            <TableHead><button type="button" onClick={() => toggleSort("status")}>Status{sortIndicator("status")}</button></TableHead>
            <TableHead><button type="button" onClick={() => toggleSort("createdAt")}>Date{sortIndicator("createdAt")}</button></TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((review) => (
            <TableRow key={review.id}>
              <TableCell className="font-medium">{review.bookingCode}</TableCell>
              <TableCell>{review.customerName}</TableCell>
              <TableCell>{stars(review.rating)} ({review.rating}/5)</TableCell>
              <TableCell className="max-w-[360px]">{review.comment}</TableCell>
              <TableCell>
                <Badge className={review.isVisible ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"}>
                  {review.isVisible ? "VISIBLE" : "HIDDEN"}
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
                    Hide
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={busyId === review.id}
                    onClick={() => onToggle(review.id, true)}
                  >
                    Show
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {reviews.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-sm text-muted-foreground">
                No reviews yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
