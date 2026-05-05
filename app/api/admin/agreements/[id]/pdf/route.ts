import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { generateAgreementPDF } from "@/lib/agreement-pdf";
import { getBookingForAgreement } from "@/lib/agreements";
import { getTenantConfig } from "@/lib/tenant";

/**
 * GET /api/admin/agreements/[id]/pdf
 * Streams the agreement PDF inline for browser preview or download.
 * Query param: ?download=1 for attachment disposition.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check – any admin role
  try {
    await requireAdmin("en");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const forceDownload = searchParams.get("download") === "1";

  const agreement = await db.rentalAgreement.findUnique({
    where: { id },
    include: {
      signatures: {
        orderBy: { signedAt: "asc" },
        select: {
          signerName: true,
          signerRole: true,
          signatureDataUrl: true,
          signedAt: true,
        },
      },
    },
  });

  if (!agreement) {
    return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  }

  const booking = await getBookingForAgreement(agreement.bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const tenantConfig = await getTenantConfig();

  const pdfBuffer = await generateAgreementPDF({
    agreementNumber: agreement.agreementNumber,
    booking,
    termsSnippet: agreement.termsSnippet ?? "",
    termsVersion: agreement.termsVersion ?? "",
    tenantConfig,
    signatures: agreement.signatures.map((s) => ({
      signerName: s.signerName,
      signerRole: s.signerRole as "CUSTOMER" | "AGENT",
      signatureDataUrl: s.signatureDataUrl,
      signedAt: s.signedAt,
    })),
  });

  const filename = `rental-agreement-${booking.bookingCode}.pdf`;
  const disposition = forceDownload
    ? `attachment; filename="${filename}"`
    : `inline; filename="${filename}"`;

  const pdfBytes = new Uint8Array(pdfBuffer);

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Content-Length": String(pdfBuffer.length),
      "Cache-Control": "private, no-store",
    },
  });
}
