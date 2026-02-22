import { PDFDocument, rgb } from "pdf-lib";
import { TenantConfig } from "./tenant";

export interface InvoiceData {
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
  totalAmount: number;
  discountCode?: string;
  extras?: Array<{ name: string; quantity: number; lineTotal: number }>;
  paymentInstructions: string;
  tenantConfig: TenantConfig;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  const margin = 42;
  const contentWidth = width - margin * 2;
  const blue = rgb(0.12, 0.24, 0.52);
  const lightBlue = rgb(0.93, 0.96, 1);
  const dark = rgb(0.1, 0.1, 0.12);
  const muted = rgb(0.38, 0.4, 0.45);
  const border = rgb(0.86, 0.88, 0.92);
  const okBg = rgb(0.9, 0.98, 0.92);
  const okText = rgb(0.12, 0.47, 0.22);

  const currency = (cents: number) =>
    `${data.tenantConfig.currency} ${(Math.max(0, cents) / 100).toFixed(2)}`;
  const fmtDate = (d: Date) => d.toLocaleString();
  const rentalDays = Math.max(
    1,
    Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Header bar
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width,
    height: 120,
    color: blue,
  });
  page.drawText(data.tenantConfig.tenantName, {
    x: margin,
    y: height - 55,
    size: 22,
    color: rgb(1, 1, 1),
  });
  page.drawText("INVOICE", {
    x: margin,
    y: height - 82,
    size: 12,
    color: rgb(0.9, 0.94, 1),
  });
  page.drawText(`Invoice Date: ${new Date().toLocaleDateString()}`, {
    x: width - margin - 170,
    y: height - 55,
    size: 10,
    color: rgb(1, 1, 1),
  });
  page.drawText(`Booking Code: ${data.bookingCode}`, {
    x: width - margin - 170,
    y: height - 72,
    size: 10,
    color: rgb(1, 1, 1),
  });
  page.drawText(`Invoice ID: ${data.orderId}`, {
    x: width - margin - 170,
    y: height - 89,
    size: 10,
    color: rgb(0.9, 0.94, 1),
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
    color: lightBlue,
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
    color: blue,
  });
  page.drawText("DESCRIPTION", { x: tableX + leftPadding, y: ty - 18, size: 10, color: rgb(1, 1, 1) });
  page.drawText("AMOUNT", { x: rightX, y: ty - 18, size: 10, color: rgb(1, 1, 1) });
  ty -= 28;

  const drawRow = (label: string, amount: string, emphasis = false) => {
    const h = emphasis ? 30 : 24;
    page.drawRectangle({
      x: tableX,
      y: ty - h,
      width: tableW,
      height: h,
      color: emphasis ? lightBlue : rgb(1, 1, 1),
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

  drawRow(`Base rental (${rentalDays} day${rentalDays > 1 ? "s" : ""})`, currency(data.baseRentalAmount));
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
  drawRow("Total Amount", currency(data.totalAmount), true);

  // Payment badge + footer note
  ty -= 22;
  page.drawRectangle({
    x: margin,
    y: ty - 24,
    width: 182,
    height: 24,
    color: okBg,
    borderColor: rgb(0.77, 0.93, 0.8),
    borderWidth: 1,
  });
  page.drawText("PAYMENT STATUS: RECEIVED", {
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
