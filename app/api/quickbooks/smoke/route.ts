import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  receiveQuickBooksInvoicePayment,
  syncQuickBooksInvoice,
  syncQuickBooksSalesReceipt,
} from "@/lib/quickbooks";

function toPositiveCents(value: string | null, fallback = 1000) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.round(parsed);
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "ROOT" && session.role !== "OWNER")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const bookingCode = (url.searchParams.get("booking_code") || `SMOKE-${Date.now()}`).trim();
  const customerName = (url.searchParams.get("customer_name") || "QuickBooks Smoke Test").trim();
  const customerEmail = (url.searchParams.get("customer_email") || "quickbooks-smoke@example.com").trim();
  const customerPhone = (url.searchParams.get("customer_phone") || "").trim();
  const totalAmountCents = toPositiveCents(url.searchParams.get("amount_cents"), 1000);
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

  const payload = {
    bookingCode,
    customerName,
    customerEmail,
    customerPhone: customerPhone || null,
    totalAmountCents,
    startDate,
    endDate,
    note: "QuickBooks smoke test",
  };

  const invoice = await syncQuickBooksInvoice(payload);
  const salesReceipt = await syncQuickBooksSalesReceipt(payload);
  const payment = await receiveQuickBooksInvoicePayment(payload);

  const success = invoice.success && salesReceipt.success && payment.success;
  return NextResponse.json(
    {
      success,
      smoke: {
        input: {
          bookingCode,
          customerName,
          customerEmail,
          totalAmountCents,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        invoice,
        salesReceipt,
        payment,
      },
    },
    { status: success ? 200 : 400 }
  );
}
