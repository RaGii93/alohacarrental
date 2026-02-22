"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { setReviewVisibilityAction } from "@/actions/reviews";

function stars(rating: number) {
  return "★".repeat(Math.max(0, Math.min(5, rating))) + "☆".repeat(Math.max(0, 5 - rating));
}

export function ReviewsTable({ reviews, locale }: { reviews: any[]; locale: string }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Booking</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead>Review</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reviews.map((review) => (
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
            <TableCell>{new Date(review.createdAt).toLocaleDateString()}</TableCell>
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
  );
}

