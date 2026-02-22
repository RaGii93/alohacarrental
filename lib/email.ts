import { getTenantConfig } from "@/lib/tenant";

type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "Missing RESEND_API_KEY" };

  const from = process.env.RESEND_FROM || "EdgeRent <EdgeRent@endlessedgetechnology.com>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!res.ok) {
      const payload = await res.text();
      return { success: false, error: payload || `Resend error ${res.status}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Email send failed" };
  }
}

export function bookingEmailHtml(input: {
  title: string;
  customerName: string;
  bookingCode: string;
  startDate: Date;
  endDate: Date;
  totalAmountCents: number;
  invoiceUrl?: string | null;
  documentLabel?: string;
}) {
  const tenant = getTenantConfig();
  const documentLabel = input.documentLabel || "Billing document";
  const amount = `${tenant.currency} ${(input.totalAmountCents / 100).toFixed(2)}`;
  const pickup = input.startDate.toLocaleString();
  const dropoff = input.endDate.toLocaleString();
  const escapeHtml = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const safeTenant = escapeHtml(tenant.tenantName);
  const safeTitle = escapeHtml(input.title);
  const safeName = escapeHtml(input.customerName);
  const safeBookingCode = escapeHtml(input.bookingCode);
  const safePickup = escapeHtml(pickup);
  const safeDropoff = escapeHtml(dropoff);
  const safeAmount = escapeHtml(amount);
  const safeDocumentLabel = escapeHtml(documentLabel);
  const safeAddress = escapeHtml(tenant.address || "-");
  const safeEmail = escapeHtml(tenant.email || "-");
  const safePhone = escapeHtml(tenant.phone || "-");
  const safeInvoiceUrl = input.invoiceUrl ? escapeHtml(input.invoiceUrl) : null;

  return `
    <div style="margin:0;background:#f3f6fb;padding:28px 14px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #dbe3ef;border-radius:12px;overflow:hidden;">
        <div style="padding:22px 26px;background:linear-gradient(135deg,#0f3a7d,#1d4ed8);color:#ffffff;">
          <p style="margin:0;font-size:12px;letter-spacing:.08em;opacity:.9;text-transform:uppercase;">${safeTenant}</p>
          <h2 style="margin:8px 0 0 0;font-size:24px;line-height:1.25;">${safeTitle}</h2>
        </div>

        <div style="padding:24px 26px;">
          <p style="margin:0 0 12px 0;font-size:15px;">Hello ${safeName},</p>
          <p style="margin:0 0 18px 0;font-size:14px;color:#334155;">
            Thank you for choosing ${safeTenant}. Below is your booking summary.
          </p>

          <table role="presentation" style="width:100%;border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:10px 12px;font-size:13px;color:#475569;width:40%;">Booking Reference</td>
              <td style="padding:10px 12px;font-size:13px;font-weight:700;color:#0f172a;">${safeBookingCode}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;font-size:13px;color:#475569;border-top:1px solid #e2e8f0;">Pickup</td>
              <td style="padding:10px 12px;font-size:13px;color:#0f172a;border-top:1px solid #e2e8f0;">${safePickup}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;font-size:13px;color:#475569;border-top:1px solid #e2e8f0;">Dropoff</td>
              <td style="padding:10px 12px;font-size:13px;color:#0f172a;border-top:1px solid #e2e8f0;">${safeDropoff}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;font-size:13px;color:#475569;border-top:1px solid #e2e8f0;">Total Amount</td>
              <td style="padding:10px 12px;font-size:15px;font-weight:700;color:#0f172a;border-top:1px solid #e2e8f0;">${safeAmount}</td>
            </tr>
          </table>

          ${
            safeInvoiceUrl
              ? `
          <div style="margin-top:18px;padding:14px;border:1px solid #dbeafe;background:#eff6ff;border-radius:8px;">
            <p style="margin:0 0 10px 0;font-size:13px;color:#1e3a8a;font-weight:600;">${safeDocumentLabel}</p>
            <a href="${safeInvoiceUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:600;">Open ${safeDocumentLabel}</a>
          </div>
          `
              : ""
          }

          <p style="margin:18px 0 0 0;font-size:13px;color:#475569;">
            If you need assistance, contact us at ${safeEmail}.
          </p>
        </div>

        <div style="padding:16px 26px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;color:#64748b;">This is a no-reply mailbox. Please do not reply to this email.</p>
          <p style="margin:8px 0 0 0;font-size:12px;color:#64748b;">${safeAddress}</p>
          <p style="margin:4px 0 0 0;font-size:12px;color:#64748b;">${safeEmail} · ${safePhone}</p>
        </div>
      </div>
    </div>
  `;
}
