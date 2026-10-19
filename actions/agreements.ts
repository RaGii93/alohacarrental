"use server";

import { requireAdminSection } from "@/app/[locale]/admin/_lib";
import {
  generateAgreement,
  markAgreementAwaitingSignatures,
  captureSignature,
  voidAgreement,
  getBookingForAgreement,
} from "@/lib/agreements";
import { db } from "@/lib/db";
import type { AgreementSignerRole } from "@prisma/client";
import { getCustomerEmailContent, getEmailLabels } from "@/lib/email-locale";
import { resolveBookingEmailLocale } from "@/lib/booking-email-locale";

export async function generateRentalAgreementAction(locale: string, bookingId: string) {
  await requireAdminSection(locale, "bookings");
  return generateAgreement(bookingId);
}

export async function markAgreementReadyForSignaturesAction(locale: string, agreementId: string) {
  await requireAdminSection(locale, "bookings");
  await markAgreementAwaitingSignatures(agreementId);
  return { success: true as const };
}

export async function captureAgreementSignatureAction(
  locale: string,
  opts: {
    agreementId: string;
    signerName: string;
    signerEmail?: string;
    signerRole: AgreementSignerRole;
    signatureDataUrl: string;
    ipAddress?: string;
    userAgent?: string;
  }
) {
  await requireAdminSection(locale, "bookings");
  return captureSignature(opts);
}

export async function voidRentalAgreementAction(locale: string, agreementId: string, reason?: string) {
  await requireAdminSection(locale, "bookings");
  await voidAgreement(agreementId, reason);
  return { success: true as const };
}

export async function getRentalAgreementAction(locale: string, bookingId: string) {
  await requireAdminSection(locale, "bookings");
  const booking = await getBookingForAgreement(bookingId);
  if (!booking) return { success: false as const, error: "Booking not found" };
  return { success: true as const, agreement: booking.rentalAgreement };
}

export async function emailAgreementToCustomerAction(locale: string, agreementId: string) {
  await requireAdminSection(locale, "bookings");

  const agreement = await db.rentalAgreement.findUnique({
    where: { id: agreementId },
    include: {
      booking: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          customerName: true,
          customerEmail: true,
          bookingCode: true,
        },
      },
    },
  });
  if (!agreement) return { success: false as const, error: "Agreement not found" };

  const pdfUrl = agreement.signedPdfUrl || agreement.pdfUrl;
  if (!pdfUrl) return { success: false as const, error: "No PDF available to email" };

  const { sendEmail, bookingEmailHtml } = await import("@/lib/email");
  const { getTermsEmailAttachment } = await import("@/lib/terms");
  locale = await resolveBookingEmailLocale(agreement.booking.id, locale);
  const content = getCustomerEmailContent("agreement", locale, {
    bookingCode: agreement.booking.bookingCode,
    agreementNumber: agreement.agreementNumber,
  });
  const terms = await getTermsEmailAttachment(locale);
  const result = await sendEmail({
    to: agreement.booking.customerEmail,
    subject: `${content.subject} — ${agreement.agreementNumber}`,
    html: await bookingEmailHtml({
      ...content,
      locale,
      customerName: agreement.booking.customerName,
      bookingCode: agreement.booking.bookingCode,
      startDate: agreement.booking.startDate,
      endDate: agreement.booking.endDate,
      invoiceUrl: pdfUrl,
      documentLabel: getEmailLabels(locale).agreement,
      termsUrl: terms.url,
      showFinancialSummary: false,
    }),
    attachments: terms.attachment ? [terms.attachment] : [],
  });
  if (!result.success) return { success: false as const, error: result.error || "Failed to send agreement email" };

  return { success: true as const };
}
