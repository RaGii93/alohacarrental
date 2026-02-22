import { PDFDocument, PDFPage, rgb } from "pdf-lib";
import { TenantConfig } from "./tenant";

export interface InvoiceData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleName: string;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  paymentInstructions: string;
  tenantConfig: TenantConfig;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { height } = page.getSize();
  let yPosition = height - 50;

  const drawText = (text: string, x: number, size: number = 12, bold: boolean = false) => {
    page.drawText(text, {
      x,
      y: yPosition,
      size,
      color: rgb(0, 0, 0),
    });
    yPosition -= size + 5;
  };

  // Header
  drawText(data.tenantConfig.tenantName, 50, 20, true);
  yPosition -= 10;

  drawText(data.tenantConfig.address, 50);
  drawText(`${data.tenantConfig.email} | ${data.tenantConfig.phone}`, 50);
  yPosition -= 20;

  // Invoice title
  drawText(`INVOICE #${data.orderId}`, 50, 16, true);
  yPosition -= 15;

  // Customer info
  drawText("BILL TO:", 50, 12, true);
  drawText(data.customerName, 50);
  drawText(data.customerEmail, 50);
  drawText(data.customerPhone, 50);
  yPosition -= 15;

  // Booking details
  drawText("BOOKING DETAILS:", 50, 12, true);
  drawText(`Vehicle: ${data.vehicleName}`, 50);
  drawText(`Pickup: ${data.startDate.toLocaleDateString()}`, 50);
  drawText(`Return: ${data.endDate.toLocaleDateString()}`, 50);
  yPosition -= 15;

  // Amount
  drawText("AMOUNT:", 50, 12, true);
  drawText(`${data.tenantConfig.currency} ${(data.totalAmount / 100).toFixed(2)}`, 50, 14, true);
  yPosition -= 20;

  // Payment instructions
  drawText("PAYMENT INSTRUCTIONS:", 50, 12, true);
  drawText(data.paymentInstructions, 50);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
