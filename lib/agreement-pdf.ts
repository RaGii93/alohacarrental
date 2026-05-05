/**
 * Agreement PDF Generator
 * Produces a formal rental agreement PDF with optional embedded signature blocks.
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { TenantConfig } from "./tenant";
import { tenantThemeTokenToPdfRgb } from "./tenant";
import { formatDate, formatDateTime } from "@/lib/datetime";

type AgreementSignatureData = {
  signerName: string;
  signerRole: string;
  signatureDataUrl: string;
  signedAt: Date;
};

export type AgreementPDFInput = {
  agreementNumber: string;
  booking: any;
  termsSnippet: string;
  termsVersion: string;
  tenantConfig: TenantConfig;
  signatures: AgreementSignatureData[];
};

const DARK = rgb(0.09, 0.09, 0.11);
const MUTED = rgb(0.38, 0.4, 0.45);
const BORDER = rgb(0.88, 0.85, 0.83);
const WHITE = rgb(1, 1, 1);
const LIGHT_BG = rgb(0.97, 0.97, 0.98);

function currency(cents: number, symbol: string) {
  return `${symbol} ${(Math.max(0, cents) / 100).toFixed(2)}`;
}

async function loadLocalImage(pdfDoc: PDFDocument, logoUrl: string | undefined) {
  if (!logoUrl) return null;
  const candidates = logoUrl.startsWith("/") ? [path.join(process.cwd(), "public", logoUrl.replace(/^\/+/, ""))] : [];
  candidates.push(path.join(process.cwd(), "public", "home/logo.png"));
  for (const fpath of candidates) {
    try {
      const bytes = await readFile(fpath);
      if (fpath.endsWith(".png")) return await pdfDoc.embedPng(bytes);
      if (fpath.endsWith(".jpg") || fpath.endsWith(".jpeg")) return await pdfDoc.embedJpg(bytes);
    } catch {}
  }
  return null;
}

async function embedSignatureImage(pdfDoc: PDFDocument, dataUrl: string) {
  try {
    const [header, b64] = dataUrl.split(",");
    if (!b64) return null;
    const bytes = Buffer.from(b64, "base64");
    if (header.includes("png")) return await pdfDoc.embedPng(bytes);
    if (header.includes("jpeg") || header.includes("jpg")) return await pdfDoc.embedJpg(bytes);
  } catch {}
  return null;
}

export async function generateAgreementPDF(input: AgreementPDFInput): Promise<Buffer> {
  const { booking, tenantConfig, agreementNumber, termsSnippet, termsVersion, signatures } = input;

  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const primary = (() => {
    const { r, g, b } = tenantThemeTokenToPdfRgb(tenantConfig.theme.primary);
    return rgb(r, g, b);
  })();

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 44;
  const contentWidth = pageWidth - margin * 2;

  // ── Helper to add a new page and return cursor position ──
  function newPage() {
    const pg = pdfDoc.addPage([pageWidth, pageHeight]);
    return { pg, y: pageHeight - margin };
  }

  // ── Helper: draw wrapped text, returns new y ──
  function drawWrapped(
    pg: ReturnType<typeof pdfDoc.addPage>,
    text: string,
    opts: {
      x: number;
      y: number;
      maxWidth: number;
      size: number;
      color?: ReturnType<typeof rgb>;
      font?: typeof boldFont;
      lineHeight?: number;
    }
  ) {
    const { x, maxWidth, size, color = DARK, font = regularFont, lineHeight = size * 1.55 } = opts;
    let curY = opts.y;
    const words = text.split(" ");
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      const w = font.widthOfTextAtSize(candidate, size);
      if (w > maxWidth && line) {
        pg.drawText(line, { x, y: curY, size, color, font });
        curY -= lineHeight;
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) {
      pg.drawText(line, { x, y: curY, size, color, font });
      curY -= lineHeight;
    }
    return curY;
  }

  // ── Helper: section header ──
  function drawSectionHeader(pg: ReturnType<typeof pdfDoc.addPage>, label: string, y: number) {
    pg.drawRectangle({ x: margin, y: y - 2, width: contentWidth, height: 22, color: primary });
    pg.drawText(label.toUpperCase(), { x: margin + 8, y: y + 5, size: 9, color: WHITE, font: boldFont });
    return y - 28;
  }

  // ── Helper: two-column field row ──
  function drawFieldRow(
    pg: ReturnType<typeof pdfDoc.addPage>,
    label: string,
    value: string,
    y: number,
    col: "left" | "right" | "full" = "full"
  ) {
    const halfW = (contentWidth - 8) / 2;
    const x = col === "right" ? margin + halfW + 8 : margin;
    const w = col === "full" ? contentWidth : halfW;
    pg.drawText(label, { x, y, size: 7.5, color: MUTED, font: regularFont });
    pg.drawText(value || "—", { x, y: y - 11, size: 9, color: DARK, font: regularFont });
    pg.drawLine({ start: { x, y: y - 20 }, end: { x: x + w, y: y - 20 }, thickness: 0.5, color: BORDER });
    return y - 28;
  }

  // ════════════════════════════════════════════════════════
  // PAGE 1
  // ════════════════════════════════════════════════════════
  let { pg, y } = newPage();

  // ── Logo header bar ──
  pg.drawRectangle({ x: 0, y: pageHeight - 90, width: pageWidth, height: 90, color: LIGHT_BG });
  const logo = await loadLocalImage(pdfDoc, tenantConfig.logoUrl);
  if (logo) {
    const logoH = 50;
    const logoW = (logo.width / logo.height) * logoH;
    pg.drawImage(logo, { x: margin, y: pageHeight - 72, width: logoW, height: logoH });
  } else {
    pg.drawText(tenantConfig.tenantName || "COMPANY", { x: margin, y: pageHeight - 50, size: 13, color: DARK, font: boldFont });
  }
  // Agreement meta (top right)
  const metaX = pageWidth - margin - 165;
  pg.drawText("RENTAL AGREEMENT", { x: metaX, y: pageHeight - 38, size: 12, color: DARK, font: boldFont });
  pg.drawText(agreementNumber, { x: metaX, y: pageHeight - 54, size: 9, color: MUTED, font: regularFont });
  pg.drawText(`Date: ${formatDate(new Date())}`, { x: metaX, y: pageHeight - 67, size: 9, color: MUTED, font: regularFont });
  if (termsVersion) {
    pg.drawText(`Terms v${termsVersion}`, { x: metaX, y: pageHeight - 80, size: 8, color: MUTED, font: regularFont });
  }

  y = pageHeight - 110;

  // ── PARTIES SECTION ──
  y = drawSectionHeader(pg, "1. Parties", y);
  // Company block
  pg.drawText("RENTAL COMPANY", { x: margin, y, size: 7.5, color: MUTED, font: regularFont });
  y -= 12;
  pg.drawText(tenantConfig.tenantName, { x: margin, y, size: 10, color: DARK, font: boldFont });
  y -= 13;
  if (tenantConfig.address) {
    pg.drawText(tenantConfig.address, { x: margin, y, size: 8.5, color: MUTED, font: regularFont });
    y -= 12;
  }
  if (tenantConfig.phone) {
    pg.drawText(`Tel: ${tenantConfig.phone}`, { x: margin, y, size: 8.5, color: MUTED, font: regularFont });
    y -= 12;
  }
  if (tenantConfig.email) {
    pg.drawText(`Email: ${tenantConfig.email}`, { x: margin, y, size: 8.5, color: MUTED, font: regularFont });
    y -= 12;
  }
  y -= 6;

  // Customer block
  pg.drawText("CUSTOMER", { x: margin, y, size: 7.5, color: MUTED, font: regularFont });
  y -= 12;
  pg.drawText(booking.customerName, { x: margin, y, size: 10, color: DARK, font: boldFont });
  y -= 13;
  pg.drawText(`Email: ${booking.customerEmail || "—"}`, { x: margin, y, size: 8.5, color: MUTED, font: regularFont });
  y -= 12;
  pg.drawText(`Phone: ${booking.customerPhone || "—"}`, { x: margin, y, size: 8.5, color: MUTED, font: regularFont });
  y -= 12;
  if (booking.driverLicenseNumber) {
    pg.drawText(`License: ${booking.driverLicenseNumber}`, { x: margin, y, size: 8.5, color: MUTED, font: regularFont });
    y -= 12;
  }
  y -= 10;

  // ── RENTAL DETAILS ──
  y = drawSectionHeader(pg, "2. Rental Details", y);
  const startStr = formatDate(booking.startDate);
  const endStr = formatDate(booking.endDate);
  const rentalDays = Math.max(1, Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / 86400000));
  const pickupLabel = booking.pickupLocationRef?.name || booking.pickupLocation || "—";
  const dropoffLabel = booking.dropoffLocationRef?.name || booking.dropoffLocation || "—";
  const vehicleLabel = booking.vehicle ? `${booking.vehicle.name}${booking.vehicle.plateNumber ? ` (${booking.vehicle.plateNumber})` : ""}` : `${booking.category?.name || "—"} (TBD)`;

  // Row pair
  const rowY = y;
  drawFieldRow(pg, "BOOKING CODE", booking.bookingCode, rowY, "left");
  drawFieldRow(pg, "AGREEMENT NUMBER", agreementNumber, rowY, "right");
  y -= 28;
  drawFieldRow(pg, "VEHICLE / CATEGORY", vehicleLabel, y, "left");
  drawFieldRow(pg, "RENTAL DURATION", `${rentalDays} day${rentalDays !== 1 ? "s" : ""}`, y, "right");
  y -= 28;
  drawFieldRow(pg, "PICK-UP DATE", startStr, y, "left");
  drawFieldRow(pg, "RETURN DATE", endStr, y, "right");
  y -= 28;
  drawFieldRow(pg, "PICK-UP LOCATION", pickupLabel, y, "left");
  drawFieldRow(pg, "DROP-OFF LOCATION", dropoffLabel, y, "right");
  y -= 28;

  // ── PRICING ──
  y = drawSectionHeader(pg, "3. Pricing Summary", y);
  const sym = tenantConfig.currency;
  const extrasAmount = (booking.bookingExtras || []).reduce((s: number, l: any) => s + (l.lineTotal || 0), 0);
  const discountAmount = booking.bookingDiscount?.amount || 0;

  const priceRows: [string, string][] = [
    [`Daily rate (${rentalDays} day${rentalDays !== 1 ? "s" : ""} × ${currency(booking.category?.dailyRate || 0, sym)})`,
      currency((booking.category?.dailyRate || 0) * rentalDays, sym)],
  ];
  if (booking.bookingExtras?.length) {
    priceRows.push(["Extras", currency(extrasAmount, sym)]);
  }
  if (discountAmount) {
    priceRows.push(["Discount", `- ${currency(discountAmount, sym)}`]);
  }
  priceRows.push(["TOTAL DUE", currency(booking.totalAmount, sym)]);

  for (const [label, value] of priceRows) {
    const isTotalRow = label === "TOTAL DUE";
    if (isTotalRow) {
      pg.drawRectangle({ x: margin, y: y - 4, width: contentWidth, height: 22, color: LIGHT_BG });
    }
    pg.drawText(label, { x: margin + 4, y: y + 4, size: isTotalRow ? 9 : 8.5, color: isTotalRow ? DARK : MUTED, font: isTotalRow ? boldFont : regularFont });
    const valW = regularFont.widthOfTextAtSize(value, 9);
    pg.drawText(value, { x: margin + contentWidth - valW - 4, y: y + 4, size: 9, color: DARK, font: boldFont });
    y -= 22;
  }
  y -= 6;

  // ── TERMS & CONDITIONS ──
  y = drawSectionHeader(pg, "4. Terms & Conditions", y);
  const termsLines = (termsSnippet || "").split("\n");
  for (const line of termsLines) {
    if (y < margin + 60) {
      // New page if running low
      const next = newPage();
      pg = next.pg;
      y = next.y;
    }
    if (line.trim() === "") {
      y -= 8;
      continue;
    }
    y = drawWrapped(pg, line, { x: margin, y, maxWidth: contentWidth, size: 8, color: line.match(/^\d+\./) ? DARK : MUTED, lineHeight: 12 });
  }
  y -= 10;

  // ── SIGNATURE PAGE ──
  if (y < 200) {
    const next = newPage();
    pg = next.pg;
    y = next.y;
    pg.drawText("RENTAL AGREEMENT — SIGNATURES", { x: margin, y, size: 11, color: DARK, font: boldFont });
    y -= 20;
  }

  y = drawSectionHeader(pg, "5. Signatures", y);

  const sigColW = (contentWidth - 12) / 2;
  const customerSig = signatures.find((s) => s.signerRole === "CUSTOMER");
  const agentSig = signatures.find((s) => s.signerRole === "AGENT");

  async function drawSigBlock(
    col: "left" | "right",
    title: string,
    sig: AgreementSignatureData | undefined,
    baseY: number
  ) {
    const colX = col === "right" ? margin + sigColW + 12 : margin;
    pg.drawText(title, { x: colX, y: baseY, size: 9, color: MUTED, font: regularFont });
    baseY -= 14;
    if (sig) {
      const embedded = await embedSignatureImage(pdfDoc, sig.signatureDataUrl);
      const sigBoxH = 50;
      if (embedded) {
        const drawW = Math.min(sigColW, embedded.width);
        const drawH = (embedded.height / embedded.width) * drawW;
        pg.drawImage(embedded, { x: colX, y: baseY - drawH, width: drawW, height: drawH });
        baseY -= sigBoxH + 5;
      } else {
        pg.drawRectangle({ x: colX, y: baseY - sigBoxH, width: sigColW, height: sigBoxH, color: LIGHT_BG });
        pg.drawText("[Signature recorded]", { x: colX + 8, y: baseY - sigBoxH / 2, size: 8, color: MUTED, font: regularFont });
        baseY -= sigBoxH + 5;
      }
      pg.drawText(`${sig.signerName}`, { x: colX, y: baseY, size: 9, color: DARK, font: boldFont });
      baseY -= 13;
      pg.drawText(`Signed: ${formatDateTime(sig.signedAt)}`, { x: colX, y: baseY, size: 8, color: MUTED, font: regularFont });
    } else {
      // Blank signature box
      pg.drawRectangle({ x: colX, y: baseY - 60, width: sigColW, height: 60, color: LIGHT_BG });
      pg.drawLine({ start: { x: colX + 8, y: baseY - 54 }, end: { x: colX + sigColW - 8, y: baseY - 54 }, thickness: 0.5, color: BORDER });
      pg.drawText("Signature", { x: colX + 8, y: baseY - 65, size: 7.5, color: MUTED, font: regularFont });
      baseY -= 72;
      pg.drawText("Name: ___________________________", { x: colX, y: baseY, size: 8, color: MUTED, font: regularFont });
      baseY -= 14;
      pg.drawText("Date: ___________________________", { x: colX, y: baseY, size: 8, color: MUTED, font: regularFont });
    }
    return baseY;
  }

  const startSigY = y;
  await drawSigBlock("left", "CUSTOMER SIGNATURE", customerSig, startSigY);
  await drawSigBlock("right", "AGENT SIGNATURE", agentSig, startSigY);

  y -= 120;

  // Footer
  pg.drawLine({ start: { x: margin, y: margin + 16 }, end: { x: pageWidth - margin, y: margin + 16 }, thickness: 0.5, color: BORDER });
  pg.drawText(`${tenantConfig.tenantName} · ${agreementNumber} · Generated ${formatDateTime(new Date())}`, {
    x: margin,
    y: margin + 4,
    size: 7,
    color: MUTED,
    font: regularFont,
  });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
