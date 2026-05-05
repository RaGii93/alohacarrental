/**
 * Rental Agreement Service
 * Handles generation, PDF production, and status lifecycle for rental agreements.
 */

import { db } from "@/lib/db";
import { getTenantConfig } from "@/lib/tenant";
import { uploadBuffer } from "@/lib/uploads";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { generateAgreementPDF } from "@/lib/agreement-pdf";
import type { RentalAgreementStatus, AgreementSignerRole } from "@prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a sequential, human-readable agreement number: AGR-YYYYMMDD-XXXX */
function buildAgreementNumber(bookingCode: string): string {
  const date = new Date();
  const yyyymmdd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const suffix = String(bookingCode || "").replace(/[^a-z0-9]/gi, "").toUpperCase().slice(-6).padStart(6, "0");
  return `AGR-${yyyymmdd}-${suffix}`;
}

/** Fetch the full booking record needed for agreement generation */
export async function getBookingForAgreement(bookingId: string) {
  return db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      bookingCode: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      birthDate: true,
      driverLicenseNumber: true,
      licenseExpiryDate: true,
      startDate: true,
      endDate: true,
      pickupLocation: true,
      dropoffLocation: true,
      totalAmount: true,
      status: true,
      termsAcceptedAt: true,
      notes: true,
      vehicle: { select: { id: true, name: true, plateNumber: true } },
      category: { select: { id: true, name: true, dailyRate: true } },
      pickupLocationRef: { select: { name: true, address: true } },
      dropoffLocationRef: { select: { name: true, address: true } },
      bookingExtras: {
        select: {
          quantity: true,
          lineTotal: true,
          extra: { select: { name: true } },
        },
      },
      bookingDiscount: {
        select: {
          percentage: true,
          amount: true,
          discountCode: {
            select: { code: true },
          },
        },
      },
      additionalDrivers: {
        select: { fullName: true, driverLicenseNumber: true },
      },
      rentalAgreement: {
        select: {
          id: true,
          agreementNumber: true,
          status: true,
          pdfUrl: true,
          signedPdfUrl: true,
          signedAt: true,
          termsVersion: true,
          createdAt: true,
          updatedAt: true,
          signatures: {
            orderBy: { signedAt: "asc" },
            select: {
              id: true,
              signerName: true,
              signerEmail: true,
              signerRole: true,
              signedAt: true,
              ipAddress: true,
            },
          },
        },
      },
    },
  });
}

/** Build the human-readable terms snippet that gets embedded in the agreement PDF */
export async function buildTermsSnippet(tenantName: string, termsUrl: string): Promise<string> {
  return [
    `This Rental Agreement ("Agreement") is entered into between ${tenantName} ("Company") and the Customer identified herein.`,
    ``,
    `1. VEHICLE USE. The Customer agrees to use the rented vehicle only for lawful purposes and in a careful manner.`,
    `2. RESPONSIBILITY. The Customer is responsible for any damage to the vehicle during the rental period, including collision, vandalism, and theft.`,
    `3. FUEL. The vehicle must be returned with the same fuel level as at pickup. A fuel charge may apply otherwise.`,
    `4. LATE RETURN. Returning the vehicle after the scheduled drop-off time without prior approval may incur additional per-day charges.`,
    `5. MODIFICATIONS. The Customer may not modify, alter, or sublet the rented vehicle.`,
    `6. GOVERNING LAW. This Agreement is governed by applicable local law. Any disputes shall be resolved in the jurisdiction of the Company's principal place of business.`,
    ``,
    `Full terms and conditions are available at: ${termsUrl}`,
    ``,
    `By signing below, the Customer acknowledges reading and agreeing to these terms.`,
  ].join("\n");
}

// ─── Core operations ──────────────────────────────────────────────────────────

/**
 * Create or re-generate an agreement record for a booking.
 * Idempotent – if one already exists (not void), reuses it and regenerates PDF.
 */
export async function generateAgreement(bookingId: string): Promise<{
  success: boolean;
  agreementId?: string;
  pdfUrl?: string;
  error?: string;
}> {
  const booking = await getBookingForAgreement(bookingId);
  if (!booking) return { success: false, error: "Booking not found" };

  const tenantConfig = await getTenantConfig();
  const termsVersion = new Date().toISOString().slice(0, 10);
  const termsSnippet = await buildTermsSnippet(
    tenantConfig.tenantName,
    tenantConfig.termsPdfUrl || `${process.env.NEXT_PUBLIC_APP_URL || ""}/terms`
  );

  // Reuse existing non-void agreement or create one
  let agreementId = booking.rentalAgreement?.id;
  let agreementNumber = booking.rentalAgreement?.agreementNumber ?? buildAgreementNumber(booking.bookingCode);

  if (!agreementId) {
    const created = await db.rentalAgreement.create({
      data: {
        bookingId,
        agreementNumber,
        status: "DRAFT",
        termsVersion,
        termsSnippet,
      },
      select: { id: true },
    });
    agreementId = created.id;
  } else {
    // Update terms in case they've changed
    await db.rentalAgreement.update({
      where: { id: agreementId },
      data: { termsVersion, termsSnippet, status: "DRAFT" },
    });
  }

  // Generate PDF
  const pdfBuffer = await generateAgreementPDF({
    agreementNumber,
    booking,
    termsSnippet,
    termsVersion,
    tenantConfig,
    signatures: [],
  });

  if (!pdfBuffer || pdfBuffer.length < 500) {
    return { success: false, error: "PDF generation failed" };
  }

  const filename = `rental-agreement-${booking.bookingCode}.pdf`;
  const uploadResult = await uploadBuffer(pdfBuffer, "rental-agreements", filename, "application/pdf");
  if (!uploadResult.success || !uploadResult.url) {
    return { success: false, error: uploadResult.error || "Upload failed" };
  }

  await db.rentalAgreement.update({
    where: { id: agreementId },
    data: { pdfUrl: uploadResult.url, status: "GENERATED" },
  });

  return { success: true, agreementId, pdfUrl: uploadResult.url };
}

/** Mark the agreement as ready for signatures */
export async function markAgreementAwaitingSignatures(agreementId: string) {
  return db.rentalAgreement.update({
    where: { id: agreementId },
    data: { status: "AWAITING_SIGNATURES" },
  });
}

/** Capture a signature (customer or agent) and regenerate the signed PDF */
export async function captureSignature(opts: {
  agreementId: string;
  signerName: string;
  signerEmail?: string;
  signerRole: AgreementSignerRole;
  signatureDataUrl: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ success: boolean; error?: string; allSigned?: boolean }> {
  const agreement = await db.rentalAgreement.findUnique({
    where: { id: opts.agreementId },
    include: {
      signatures: { select: { signerRole: true } },
      booking: { select: { id: true, bookingCode: true } },
    },
  });
  if (!agreement) return { success: false, error: "Agreement not found" };
  if (agreement.status === "VOID") return { success: false, error: "Agreement has been voided" };

  // Upsert: one signature per role per agreement
  const existing = agreement.signatures.find((s) => s.signerRole === opts.signerRole);
  if (existing) {
    // Delete and re-capture (allows re-signing)
    await db.rentalAgreementSignature.deleteMany({
      where: { rentalAgreementId: opts.agreementId, signerRole: opts.signerRole },
    });
  }

  await db.rentalAgreementSignature.create({
    data: {
      rentalAgreementId: opts.agreementId,
      signerName: opts.signerName,
      signerEmail: opts.signerEmail,
      signerRole: opts.signerRole,
      signatureDataUrl: opts.signatureDataUrl,
      ipAddress: opts.ipAddress,
      userAgent: opts.userAgent,
      signedAt: new Date(),
    },
  });

  // Check if both customer + agent have signed
  const allSignatures = await db.rentalAgreementSignature.findMany({
    where: { rentalAgreementId: opts.agreementId },
    select: { signerRole: true, signerName: true, signerEmail: true, signatureDataUrl: true, signedAt: true },
  });
  const hasCustomer = allSignatures.some((s) => s.signerRole === "CUSTOMER");
  const hasAgent = allSignatures.some((s) => s.signerRole === "AGENT");
  const allSigned = hasCustomer && hasAgent;

  if (allSigned) {
    // Regenerate PDF with embedded signatures
    const booking = await getBookingForAgreement(agreement.booking.id);
    if (booking) {
      const tenantConfig = await getTenantConfig();
      const pdfBuffer = await generateAgreementPDF({
        agreementNumber: agreement.agreementNumber,
        booking,
        termsSnippet: agreement.termsSnippet ?? "",
        termsVersion: agreement.termsVersion ?? "",
        tenantConfig,
        signatures: allSignatures.map((s) => ({
          signerName: s.signerName,
          signerRole: s.signerRole as AgreementSignerRole,
          signatureDataUrl: s.signatureDataUrl,
          signedAt: s.signedAt,
        })),
      });

      const filename = `rental-agreement-signed-${booking.bookingCode}.pdf`;
      const uploadResult = await uploadBuffer(pdfBuffer, "rental-agreements", filename, "application/pdf");

      if (uploadResult.success && uploadResult.url) {
        await db.rentalAgreement.update({
          where: { id: opts.agreementId },
          data: {
            status: "SIGNED",
            signedAt: new Date(),
            signedPdfUrl: uploadResult.url,
          },
        });
      }
    }
  } else {
    await db.rentalAgreement.update({
      where: { id: opts.agreementId },
      data: { status: "AWAITING_SIGNATURES" },
    });
  }

  return { success: true, allSigned };
}

/** Void an agreement */
export async function voidAgreement(agreementId: string, reason?: string) {
  return db.rentalAgreement.update({
    where: { id: agreementId },
    data: { status: "VOID", voidedAt: new Date(), voidReason: reason ?? null },
  });
}
