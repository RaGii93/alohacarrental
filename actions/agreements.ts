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

  const { sendEmail } = await import("@/lib/email");
  const { getTenantConfig } = await import("@/lib/tenant");
  const tenantConfig = await getTenantConfig();

  await sendEmail({
    to: agreement.booking.customerEmail,
    subject: `Your Rental Agreement — ${agreement.agreementNumber}`,
    html: `
      <p>Dear ${agreement.booking.customerName},</p>
      <p>Please find your rental agreement attached for booking <strong>${agreement.booking.bookingCode}</strong>.</p>
      <p>Agreement number: <strong>${agreement.agreementNumber}</strong></p>
      <p>You can download your agreement here:<br/>
        <a href="${pdfUrl}">${pdfUrl}</a>
      </p>
      <p>Thank you for choosing ${tenantConfig.tenantName}.</p>
    `,
  });

  return { success: true as const };
}
