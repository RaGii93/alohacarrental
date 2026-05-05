import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getTenantConfig } from "@/lib/tenant";

export async function GET() {
  try {
    const reviews = await db.review.findMany({
      where: { isVisible: true },
      select: {
        id: true,
        customerName: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    });

    return NextResponse.json({ success: true, reviews });
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
          <div style="margin:0;background:#f8f7f4;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#111111;" class="email-shell">
            <style>
              @media only screen and (max-width: 620px) {
                .email-shell { padding:16px 8px !important; }
                .email-card { border-radius:14px !important; }
                .email-section { padding:16px !important; }
                .email-word-break { word-break:break-word !important; overflow-wrap:anywhere !important; }
              }
            </style>
            <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #d7d0c4;border-radius:18px;overflow:hidden;" class="email-card">
              <div style="height:4px;background:#c1121f;"></div>
              <div style="padding:22px 24px;" class="email-section">
                <h2 style="margin:0 0 16px 0;font-size:24px;line-height:1.25;">New customer review submitted</h2>
                <table role="presentation" style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:10px 0;font-size:14px;color:#5b6472;width:140px;">Booking code</td>
                    <td style="padding:10px 0;font-size:14px;font-weight:700;color:#111111;" class="email-word-break">${booking.bookingCode}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;font-size:14px;color:#5b6472;border-top:1px solid #d7d0c4;">Customer</td>
                    <td style="padding:10px 0;font-size:14px;color:#111111;border-top:1px solid #d7d0c4;" class="email-word-break">${booking.customerName}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;font-size:14px;color:#5b6472;border-top:1px solid #d7d0c4;">Rating</td>
                    <td style="padding:10px 0;font-size:14px;color:#111111;border-top:1px solid #d7d0c4;">${rating}/5</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0 0 0;font-size:14px;color:#5b6472;border-top:1px solid #d7d0c4;vertical-align:top;">Comment</td>
                    <td style="padding:10px 0 0 0;font-size:14px;color:#111111;border-top:1px solid #d7d0c4;line-height:1.6;" class="email-word-break">${comment.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
                  </tr>
                </table>
                <p style="margin:18px 0 0 0;font-size:13px;line-height:1.6;color:#5b6472;">
                  This review is hidden by default. You can publish it from the admin dashboard.
                </p>
              </div>
            </div>
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
