"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function setReviewVisibilityAction(
  reviewId: string,
  isVisible: boolean,
  locale: string
) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const updated = await db.review.update({
      where: { id: reviewId },
      data: { isVisible },
    });

    try {
      await db.auditLog.create({
        data: {
          adminUserId: session.adminUserId,
          bookingId: updated.bookingId,
          action: isVisible ? "REVIEW_SHOWN" : "REVIEW_HIDDEN",
        },
      });
    } catch {}

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update review visibility" };
  }
}

