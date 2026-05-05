import { PDFDocument, rgb } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { TenantConfig } from "./tenant";
import { tenantThemeTokenToPdfRgb } from "./tenant";
import { formatDate, formatDateTime } from "@/lib/datetime";

export interface InvoiceData {
  documentType?: "INVOICE" | "SALES_RECEIPT" | "RENTAL_AGREEMENT";
  orderId: string;
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  additionalDrivers?: Array<{
    fullName: string;
    birthDate: Date;
    driverLicenseNumber: string;
    licenseExpiryDate: Date;
  }>;
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
  closeoutCharges?: Array<{ label: string; amount: number }>;
  alreadyPaidAmount?: number;
  outstandingAmount?: number;
  paymentInstructions: string;
  tenantConfig: TenantConfig;
}

function resolveLogoUrl(rawUrl: string | undefined) {
  const logoUrl = String(rawUrl || "/home/logo.png").trim();
  if (!logoUrl) return "";
  if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) return logoUrl;
  if (!logoUrl.startsWith("/")) return "";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  if (!baseUrl) return "";
  return `${baseUrl.replace(/\/$/, "")}${logoUrl}`;
}

function shortDocumentNumber(documentType: InvoiceData["documentType"], bookingCode: string) {
  const prefix =
    documentType === "SALES_RECEIPT"
      ? "RCPT"
      : documentType === "RENTAL_AGREEMENT"
        ? "AGR"
        : "INV";
  const compactCode = String(bookingCode || "")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();
  return `${prefix}-${compactCode.slice(-6) || "000000"}`;
}

async function loadLogoImageForPdf(pdfDoc: PDFDocument, logoUrl: string, rawLogoUrl?: string) {
  const candidatePaths = Array.from(new Set([String(rawLogoUrl || "").trim(), "/home/logo.png"].filter(Boolean)));
  for (const candidatePath of candidatePaths) {
    if (candidatePath.startsWith("/")) {
      try {
        const filePath = path.join(process.cwd(), "public", candidatePath.replace(/^\/+/, ""));
        const bytes = await readFile(filePath);
        const isPng = candidatePath.toLowerCase().endsWith(".png");
        const isJpg =
          candidatePath.toLowerCase().endsWith(".jpg") ||
          candidatePath.toLowerCase().endsWith(".jpeg");
        if (isPng) return await pdfDoc.embedPng(bytes);
        if (isJpg) return await pdfDoc.embedJpg(bytes);
      } catch {}
    }
  }

  try {
    if (!logoUrl) return null;
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
        : (data.outstandingAmount || 0) <= 0 && (data.alreadyPaidAmount || 0) > 0
          ? "PAYMENT STATUS: RECEIVED"
          : (data.outstandingAmount || 0) > 0 && (data.alreadyPaidAmount || 0) > 0
            ? "PAYMENT STATUS: PARTIALLY PAID"
            : "PAYMENT STATUS: PENDING";

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  const margin = 42;
  const contentWidth = width - margin * 2;
  const primary = (() => {
    const { r, g, b } = tenantThemeTokenToPdfRgb(data.tenantConfig.theme.primary);
    return rgb(r, g, b);
  })();
  const primaryForeground = (() => {
    const { r, g, b } = tenantThemeTokenToPdfRgb(data.tenantConfig.theme.primaryForeground);
    return rgb(r, g, b);
  })();
  const accent = (() => {
    const { r, g, b } = tenantThemeTokenToPdfRgb(data.tenantConfig.theme.accent);
    return rgb(r, g, b);
  })();
  const accentForeground = (() => {
    const { r, g, b } = tenantThemeTokenToPdfRgb(data.tenantConfig.theme.accentForeground);
    return rgb(r, g, b);
  })();
  const dark = rgb(0.1, 0.1, 0.12);
  const muted = rgb(0.38, 0.4, 0.45);
  const border = rgb(0.91, 0.87, 0.85);
  const statusBg =
    documentType === "SALES_RECEIPT"
      ? accent
      : documentType === "RENTAL_AGREEMENT"
        ? accent
        : accent;
  const statusText =
    documentType === "SALES_RECEIPT"
      ? accentForeground
      : accentForeground;

  const currency = (cents: number) =>
    `${data.tenantConfig.currency} ${(Math.max(0, cents) / 100).toFixed(2)}`;
  const formatPercentage = (value: number) =>
    Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
  const rentalDays = Math.max(
    1,
    Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const documentNumber = shortDocumentNumber(documentType, data.bookingCode);

  // White document header: logo left, document meta right.
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width,
    height: 120,
    color: rgb(1, 1, 1),
  });
  const resolvedLogoUrl = resolveLogoUrl(data.tenantConfig.logoUrl);
  const embeddedLogo = await loadLogoImageForPdf(pdfDoc, resolvedLogoUrl, data.tenantConfig.logoUrl);
  if (embeddedLogo) {
    const logoMaxHeight = 58;
    const logoScale = logoMaxHeight / embeddedLogo.height;
    const logoWidth = embeddedLogo.width * logoScale;
    page.drawImage(embeddedLogo, {
      x: margin,
      y: height - 88,
      width: logoWidth,
      height: logoMaxHeight,
    });
  } else {
    page.drawText(data.tenantConfig.tenantName || "LOGO", {
      x: margin,
      y: height - 55,
      size: 14,
      color: dark,
    });
  }
  const metaX = width - margin - 190;
  page.drawText(documentTitle, {
    x: metaX,
    y: height - 48,
    size: 15,
    color: dark,
  });
  page.drawText(`No: ${documentNumber}`, {
    x: metaX,
    y: height - 66,
    size: 10,
    color: muted,
  });
  page.drawText(`Date: ${formatDate(new Date())}`, {
    x: metaX,
    y: height - 82,
    size: 10,
    color: muted,
  });
  page.drawText(`Booking: ${data.bookingCode}`, {
    x: metaX,
    y: height - 98,
    size: 10,
    color: muted,
  });

  // Company meta
  let y = height - 146;
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
    color: accent,
    borderColor: border,
    borderWidth: 1,
  });
  page.drawRectangle({
    x: margin + cardW + gap,
    y: y - cardHeight,
    width: cardW,
    height: cardHeight,
    color: rgb(1, 1, 1),
    borderColor: border,
    borderWidth: 1,
  });

  page.drawText("BILL TO", { x: margin + 12, y: y - 20, size: 11, color: primary });
  page.drawText(data.customerName, { x: margin + 12, y: y - 39, size: 12, color: dark });
  page.drawText(data.customerEmail, { x: margin + 12, y: y - 56, size: 10, color: muted });
  page.drawText(data.customerPhone, { x: margin + 12, y: y - 72, size: 10, color: muted });

  const rx = margin + cardW + gap + 12;
  page.drawText("RENTAL INFO", { x: rx, y: y - 20, size: 11, color: primary });
  page.drawText(`Vehicle: ${data.vehicleName}`, { x: rx, y: y - 39, size: 10, color: dark });
  page.drawText(`Category: ${data.categoryName}`, { x: rx, y: y - 54, size: 10, color: dark });
  page.drawText(`Pickup: ${formatDateTime(data.startDate)}`, { x: rx, y: y - 69, size: 9.5, color: muted });
  page.drawText(`Dropoff: ${formatDateTime(data.endDate)}`, { x: rx, y: y - 83, size: 9.5, color: muted });
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

  if ((data.additionalDrivers?.length || 0) > 0) {
    y -= 24;
    page.drawText("AUTHORIZED ADDITIONAL DRIVERS", {
      x: margin,
      y,
      size: 10,
      color: primary,
    });
    y -= 14;

    data.additionalDrivers?.forEach((driver, index) => {
      page.drawText(
        `${index + 1}. ${driver.fullName} | DOB: ${formatDate(driver.birthDate)} | License: ${driver.driverLicenseNumber} | Expires: ${formatDate(driver.licenseExpiryDate)}`,
        {
          x: margin,
          y,
          size: 8.7,
          color: dark,
        }
      );
      y -= 13;
    });
  }

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
    color: primary,
  });
  page.drawText("DESCRIPTION", { x: tableX + leftPadding, y: ty - 18, size: 10, color: primaryForeground });
  page.drawText("AMOUNT", { x: rightX, y: ty - 18, size: 10, color: primaryForeground });
  ty -= 28;

  const drawRow = (label: string, amount: string, emphasis = false) => {
    const h = emphasis ? 30 : 24;
    page.drawRectangle({
      x: tableX,
      y: ty - h,
      width: tableW,
      height: h,
      color: emphasis ? accent : rgb(1, 1, 1),
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
  for (const charge of data.closeoutCharges || []) {
    if (charge.amount > 0) drawRow(charge.label, currency(charge.amount));
  }
  drawRow("Total Amount", currency(data.totalAmount), true);

  if (documentType !== "RENTAL_AGREEMENT") {
    if ((data.alreadyPaidAmount || 0) > 0) {
      drawRow("Amount Already Paid", `-${currency(data.alreadyPaidAmount || 0)}`);
    }
    drawRow(
      (data.outstandingAmount || 0) > 0 ? "Remaining Balance" : "Balance Due",
      currency(Math.max(0, data.outstandingAmount || 0)),
      true
    );
  }

  // Payment badge + footer note
  ty -= 22;
  page.drawRectangle({
    x: margin,
    y: ty - 24,
    width: 182,
    height: 24,
    color: statusBg,
    borderColor: border,
    borderWidth: 1,
  });
  page.drawText(paymentStatusText, {
    x: margin + 10,
    y: ty - 16,
    size: 9.5,
    color: statusText,
  });

  ty -= 40;
  page.drawText("Payment Instructions:", { x: margin, y: ty, size: 10, color: primary });
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
