import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getTenantConfig } from "@/lib/tenant";

export async function GET() {
  try {
    const where = { isVisible: true };
    const [reviews, summary] = await Promise.all([
      db.review.findMany({
        where,
        select: {
          id: true,
          customerName: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      db.review.aggregate({
        where,
        _count: { id: true },
        _avg: { rating: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      reviews,
      summary: {
        count: summary._count.id ?? 0,
        averageRating: summary._avg.rating ? Number(summary._avg.rating.toFixed(1)) : 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookingCode = String(body?.bookingCode || "").trim();
    const rating = Number(body?.rating);
    const comment = String(body?.comment || "").trim();

    if (!bookingCode || !Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 5) {
      return NextResponse.json(
        { success: false, error: "Invalid review input" },
        { status: 400 }
      );
    }

    const booking = await db.booking.findFirst({
      where: {
        bookingCode: {
          equals: bookingCode,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        bookingCode: true,
        customerName: true,
        customerEmail: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "BOOKING_CODE_NOT_FOUND" },
        { status: 404 }
      );
    }

    const existing = await db.review.findUnique({ where: { bookingId: booking.id } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "REVIEW_ALREADY_EXISTS" },
        { status: 409 }
      );
    }

    const review = await db.review.create({
      data: {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        customerName: booking.customerName,
        rating,
        comment,
        isVisible: false,
      },
      select: { id: true },
    });

    try {
      const tenant = await getTenantConfig();
      await sendEmail({
        to: tenant.email,
        subject: `New Review Submitted - ${booking.bookingCode}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
            <h2>New customer review submitted</h2>
            <p><strong>Booking code:</strong> ${booking.bookingCode}</p>
            <p><strong>Customer:</strong> ${booking.customerName}</p>
            <p><strong>Rating:</strong> ${rating}/5</p>
            <p><strong>Comment:</strong><br/>${comment.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            <p>This review is hidden by default. You can publish it from the admin dashboard.</p>
          </div>
        `,
      });
    } catch {}

    return NextResponse.json({
      success: true,
      reviewId: review.id,
      message: "Review submitted and pending admin approval",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to submit review" },
      { status: 500 }
    );
  }
}
