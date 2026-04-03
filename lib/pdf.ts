import { PDFDocument, rgb } from "pdf-lib";
import { TenantConfig } from "./tenant";
import { documentBranding, hexToRgbUnit, resolveTenantAssetUrl } from "./document-branding";

export interface InvoiceData {
  documentType?: "INVOICE" | "SALES_RECEIPT" | "RENTAL_AGREEMENT";
  orderId: string;
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleName: string;
  categoryName: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  startDate: Date;
  endDate: Date;
  baseRentalAmount: number;
  extrasAmount: number;
  discountAmount: number;
  taxAmount?: number;
  taxPercentage?: number;
  totalAmount: number;
  discountCode?: string;
  extras?: Array<{ name: string; quantity: number; lineTotal: number }>;
  paymentInstructions: string;
  tenantConfig: TenantConfig;
}

async function loadLogoImageForPdf(pdfDoc: PDFDocument, logoUrl: string) {
  if (!logoUrl) return null;
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    const bytes = await response.arrayBuffer();
    const isPng = contentType.includes("png") || logoUrl.toLowerCase().endsWith(".png");
    const isJpg =
      contentType.includes("jpeg") ||
      contentType.includes("jpg") ||
      logoUrl.toLowerCase().endsWith(".jpg") ||
      logoUrl.toLowerCase().endsWith(".jpeg");
    if (isPng) return await pdfDoc.embedPng(bytes);
    if (isJpg) return await pdfDoc.embedJpg(bytes);
    return null;
  } catch {
    return null;
  }
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const documentType = data.documentType || "INVOICE";
  const documentTitle =
    documentType === "SALES_RECEIPT"
      ? "SALES RECEIPT"
      : documentType === "RENTAL_AGREEMENT"
        ? "RENTAL AGREEMENT"
        : "INVOICE";
  const paymentStatusText =
    documentType === "SALES_RECEIPT"
      ? "PAYMENT STATUS: RECEIVED"
      : documentType === "RENTAL_AGREEMENT"
        ? "BOOKING STATUS: CONFIRMED"
        : "PAYMENT STATUS: PENDING";

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  const margin = 42;
  const contentWidth = width - margin * 2;
  const pdfColor = (hex: string) => {
    const { r, g, b } = hexToRgbUnit(hex);
    return rgb(r, g, b);
  };
  const blue = pdfColor(documentBranding.body);
  const warm = pdfColor(documentBranding.warmSurface);
  const blush = pdfColor(documentBranding.blushSurface);
  const paper = pdfColor(documentBranding.surface);
  const dark = pdfColor(documentBranding.title);
  const muted = pdfColor(documentBranding.muted);
  const border = pdfColor(documentBranding.line);
  const accentOrange = pdfColor(documentBranding.orange);
  const accentPink = pdfColor(documentBranding.pink);
  const accentYellow = pdfColor(documentBranding.yellow);
  const okBg = pdfColor(documentBranding.successBg);
  const okText = pdfColor(documentBranding.successText);

  const currency = (cents: number) =>
    `${data.tenantConfig.currency} ${(Math.max(0, cents) / 100).toFixed(2)}`;
  const formatPercentage = (value: number) =>
    Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
  const fmtDate = (d: Date) => d.toLocaleString();
  const rentalDays = Math.max(
    1,
    Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: pdfColor(documentBranding.canvas),
  });

  // Header bar
  page.drawRectangle({
    x: 0,
    y: height - 132,
    width,
    height: 132,
    color: warm,
  });
  page.drawRectangle({
    x: 0,
    y: height - 12,
    width,
    height: 12,
    color: accentPink,
  });
  page.drawRectangle({
    x: 0,
    y: height - 28,
    width,
    height: 16,
    color: accentOrange,
  });
  const resolvedLogoUrl = resolveTenantAssetUrl(data.tenantConfig.logoUrl);
  const embeddedLogo = await loadLogoImageForPdf(pdfDoc, resolvedLogoUrl);
  if (embeddedLogo) {
    const logoMaxHeight = 52;
    const logoScale = logoMaxHeight / embeddedLogo.height;
    const logoWidth = embeddedLogo.width * logoScale;
    page.drawImage(embeddedLogo, {
      x: margin,
      y: height - 94,
      width: logoWidth,
      height: logoMaxHeight,
    });
  } else {
    page.drawText(data.tenantConfig.logoUrl || "LOGO", {
      x: margin,
      y: height - 61,
      size: 14,
      color: dark,
    });
  }
  page.drawText(data.tenantConfig.tenantName, {
    x: embeddedLogo ? margin + 88 : margin,
    y: height - 56,
    size: 18,
    color: blue,
  });
  page.drawText(documentTitle, {
    x: margin,
    y: height - 110,
    size: 12,
    color: accentPink,
  });
  page.drawText(`Invoice Date: ${new Date().toLocaleDateString()}`, {
    x: width - margin - 170,
    y: height - 58,
    size: 10,
    color: dark,
  });
  page.drawText(`Booking Code: ${data.bookingCode}`, {
    x: width - margin - 170,
    y: height - 75,
    size: 10,
    color: dark,
  });
  page.drawText(`Invoice ID: ${data.orderId}`, {
    x: width - margin - 170,
    y: height - 92,
    size: 10,
    color: blue,
  });

  // Company meta
  let y = height - 162;
  page.drawText(data.tenantConfig.address || "-", {
    x: margin,
    y,
    size: 10,
    color: muted,
  });
  y -= 14;
  page.drawText(`${data.tenantConfig.email} | ${data.tenantConfig.phone}`, {
    x: margin,
    y,
    size: 10,
    color: muted,
  });

  // Customer + rental cards
  y -= 26;
  const cardHeight = 132;
  const gap = 12;
  const cardW = (contentWidth - gap) / 2;
  page.drawRectangle({
    x: margin,
    y: y - cardHeight,
    width: cardW,
    height: cardHeight,
    color: blush,
    borderColor: border,
    borderWidth: 1,
  });
  page.drawRectangle({
    x: margin + cardW + gap,
    y: y - cardHeight,
    width: cardW,
    height: cardHeight,
    color: paper,
    borderColor: border,
    borderWidth: 1,
  });

  page.drawText("BILL TO", { x: margin + 12, y: y - 20, size: 11, color: blue });
  page.drawText(data.customerName, { x: margin + 12, y: y - 39, size: 12, color: dark });
  page.drawText(data.customerEmail, { x: margin + 12, y: y - 56, size: 10, color: muted });
  page.drawText(data.customerPhone, { x: margin + 12, y: y - 72, size: 10, color: muted });

  const rx = margin + cardW + gap + 12;
  page.drawText("RENTAL INFO", { x: rx, y: y - 20, size: 11, color: blue });
  page.drawText(`Vehicle: ${data.vehicleName}`, { x: rx, y: y - 39, size: 10, color: dark });
  page.drawText(`Category: ${data.categoryName}`, { x: rx, y: y - 54, size: 10, color: dark });
  page.drawText(`Pickup: ${fmtDate(data.startDate)}`, { x: rx, y: y - 69, size: 9.5, color: muted });
  page.drawText(`Dropoff: ${fmtDate(data.endDate)}`, { x: rx, y: y - 83, size: 9.5, color: muted });
  page.drawText(`Days: ${rentalDays}`, { x: rx, y: y - 98, size: 9.5, color: muted });

  y -= cardHeight + 20;

  // Location lines
  page.drawText(`Pickup Location: ${data.pickupLocation || "-"}`, {
    x: margin,
    y,
    size: 10,
    color: dark,
  });
  y -= 14;
  page.drawText(`Dropoff Location: ${data.dropoffLocation || "-"}`, {
    x: margin,
    y,
    size: 10,
    color: dark,
  });

  // Price table
  y -= 28;
  const tableX = margin;
  const tableW = contentWidth;
  const leftPadding = 12;
  const rightX = tableX + tableW - 110;
  let ty = y;

  page.drawRectangle({
    x: tableX,
    y: ty - 28,
    width: tableW,
    height: 28,
    color: accentOrange,
  });
  page.drawText("DESCRIPTION", { x: tableX + leftPadding, y: ty - 18, size: 10, color: dark });
  page.drawText("AMOUNT", { x: rightX, y: ty - 18, size: 10, color: dark });
  ty -= 28;

  const drawRow = (label: string, amount: string, emphasis = false) => {
    const h = emphasis ? 30 : 24;
    page.drawRectangle({
      x: tableX,
      y: ty - h,
      width: tableW,
      height: h,
      color: emphasis ? warm : paper,
      borderColor: border,
      borderWidth: 1,
    });
    page.drawText(label, {
      x: tableX + leftPadding,
      y: ty - (emphasis ? 19 : 16),
      size: emphasis ? 11 : 10,
      color: dark,
    });
    page.drawText(amount, {
      x: rightX,
      y: ty - (emphasis ? 19 : 16),
      size: emphasis ? 11 : 10,
      color: dark,
    });
    ty -= h;
  };

  drawRow(`Base rental (${rentalDays} day${rentalDays > 1 ? "s" : ""}, tax included)`, currency(data.baseRentalAmount));
  if (data.discountAmount > 0) {
    drawRow(
      `Discount${data.discountCode ? ` (${data.discountCode})` : ""}`,
      `-${currency(data.discountAmount)}`
    );
  }
  if (data.extrasAmount > 0) {
    drawRow("Extras", currency(data.extrasAmount));
    for (const extra of data.extras || []) {
      drawRow(`  ${extra.name} x${extra.quantity}`, currency(extra.lineTotal));
    }
  }
  if ((data.taxAmount || 0) > 0) {
    const percentage = data.taxPercentage ?? 0;
    drawRow(`Tax on extras (${formatPercentage(percentage)}%)`, currency(data.taxAmount || 0));
  }
  drawRow("Total Amount", currency(data.totalAmount), true);

  // Payment badge + footer note
  ty -= 22;
  page.drawRectangle({
    x: margin,
    y: ty - 24,
    width: 182,
    height: 24,
    color: okBg,
    borderColor: accentYellow,
    borderWidth: 1,
  });
  page.drawText(paymentStatusText, {
    x: margin + 10,
    y: ty - 16,
    size: 9.5,
    color: okText,
  });

  ty -= 40;
  page.drawText("Payment Instructions:", { x: margin, y: ty, size: 10, color: blue });
  ty -= 13;
  page.drawText(data.paymentInstructions || "-", { x: margin, y: ty, size: 9.5, color: muted });
  ty -= 16;
  page.drawText("No-reply mailbox: please do not reply to this invoice email.", {
    x: margin,
    y: ty,
    size: 8.5,
    color: muted,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
