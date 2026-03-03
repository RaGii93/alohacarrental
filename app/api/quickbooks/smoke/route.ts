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

type SmokeMode = "all" | "invoice" | "sales_receipt" | "payment";

function parseSmokeMode(value: string | null): SmokeMode | null {
  const normalized = String(value || "all").trim().toLowerCase();
  if (normalized === "all") return "all";
  if (normalized === "invoice") return "invoice";
  if (normalized === "sales_receipt") return "sales_receipt";
  if (normalized === "payment") return "payment";
  return null;
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
  const mode = parseSmokeMode(url.searchParams.get("mode"));
  if (!mode) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid mode. Use one of: all, invoice, sales_receipt, payment",
      },
      { status: 400 }
    );
  }

  const runInvoice = mode === "all" || mode === "invoice";
  const runSalesReceipt = mode === "all" || mode === "sales_receipt";
  const runPayment = mode === "all" || mode === "payment";
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

  const invoice = runInvoice
    ? await syncQuickBooksInvoice(payload)
    : ({ success: true as const, skipped: true as const, notRequested: true as const });

  const salesReceipt = runSalesReceipt
    ? await syncQuickBooksSalesReceipt(payload, {
        customerId: invoice.success ? String((invoice as any).customerId || "") : "",
      })
    : ({ success: true as const, skipped: true as const, notRequested: true as const });

  const payment = runPayment
    ? await receiveQuickBooksInvoicePayment(payload, {
        invoiceId: invoice.success ? String((invoice as any).invoiceId || "") : "",
        customerId: invoice.success ? String((invoice as any).customerId || "") : "",
      })
    : ({ success: true as const, skipped: true as const, notRequested: true as const });

  const success = invoice.success && salesReceipt.success && payment.success;
  return NextResponse.json(
    {
      success,
      smoke: {
        mode,
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
