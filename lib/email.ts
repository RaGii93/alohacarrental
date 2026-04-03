import { getTenantConfig } from "@/lib/tenant";
import { formatDateTime } from "@/lib/datetime";
import { documentBranding, escapeHtml, resolveTenantAssetUrl } from "@/lib/document-branding";

type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
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
        attachments: params.attachments?.map((file) => ({
          filename: file.filename,
          content: typeof file.content === "string" ? file.content : file.content.toString("base64"),
        })),
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

export async function bookingEmailHtml(input: {
  title: string;
  customerName: string;
  bookingCode: string;
  startDate: Date;
  endDate: Date;
  totalAmountCents: number;
  extras?: Array<{ name: string; quantity: number; lineTotal: number }>;
  invoiceUrl?: string | null;
  documentLabel?: string;
  termsUrl?: string | null;
  termsLabel?: string;
  introText?: string;
  outroText?: string;
}) {
  const tenant = await getTenantConfig();
  const documentLabel = input.documentLabel || "Billing document";
  const amount = `${tenant.currency} ${(input.totalAmountCents / 100).toFixed(2)}`;
  const pickup = formatDateTime(input.startDate);
  const dropoff = formatDateTime(input.endDate);

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
  const safeIntroText = escapeHtml(input.introText || `Thank you for choosing ${tenant.tenantName}. Below is your booking summary.`);
  const safeOutroText = escapeHtml(input.outroText || `If you need assistance, contact us at ${tenant.email || "-"}.`);
  const safeInvoiceUrl = input.invoiceUrl ? escapeHtml(input.invoiceUrl) : null;
  const safeTermsUrl = input.termsUrl ? escapeHtml(input.termsUrl) : null;
  const safeTermsLabel = escapeHtml(input.termsLabel || "Terms and Conditions");
  const logoUrl = resolveTenantAssetUrl(tenant.logoUrl);
  const safeLogoUrl = logoUrl ? escapeHtml(logoUrl) : "";
  const extrasRows = (input.extras || [])
    .map((extra) => `
      <tr>
        <td style="padding:10px 12px;font-size:13px;color:${documentBranding.muted};border-top:1px solid ${documentBranding.line};">Extra</td>
        <td style="padding:10px 12px;font-size:13px;color:${documentBranding.body};border-top:1px solid ${documentBranding.line};">${escapeHtml(`${extra.name} x${extra.quantity}`)} - ${escapeHtml(`${tenant.currency} ${(extra.lineTotal / 100).toFixed(2)}`)}</td>
      </tr>
    `)
    .join("");

  return `
    <div style="margin:0;background:${documentBranding.canvas};padding:28px 14px;font-family:Arial,Helvetica,sans-serif;color:${documentBranding.body};">
      <div style="max-width:680px;margin:0 auto;background:${documentBranding.surface};border:1px solid ${documentBranding.line};border-radius:20px;overflow:hidden;box-shadow:0 20px 48px rgba(141,74,11,0.08);">
        <div style="height:10px;background:${documentBranding.pink};"></div>
        <div style="height:14px;background:${documentBranding.orange};"></div>

        <div style="padding:24px 26px 18px 26px;background:${documentBranding.warmSurface};border-bottom:1px solid ${documentBranding.line};">
          <table role="presentation" style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="vertical-align:middle;">
                ${safeLogoUrl ? `<img src="${safeLogoUrl}" alt="${safeTenant}" style="height:52px;width:auto;display:block;" />` : ""}
              </td>
              <td style="vertical-align:middle;text-align:right;">
                <p style="margin:0;font-size:12px;letter-spacing:.12em;color:${documentBranding.pink};text-transform:uppercase;font-weight:700;">${safeTenant}</p>
                <h2 style="margin:8px 0 0 0;font-size:26px;line-height:1.2;color:${documentBranding.title};">${safeTitle}</h2>
              </td>
            </tr>
          </table>
        </div>

        <div style="padding:24px 26px;">
          <p style="margin:0 0 12px 0;font-size:15px;color:${documentBranding.title};font-weight:700;">Hello ${safeName},</p>
          <p style="margin:0 0 18px 0;font-size:14px;line-height:1.7;color:${documentBranding.body};">
            ${safeIntroText}
          </p>

          <table role="presentation" style="width:100%;border-collapse:collapse;background:${documentBranding.oceanSurface};border:1px solid ${documentBranding.line};border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:10px 12px;font-size:13px;color:${documentBranding.muted};width:40%;">Booking Reference</td>
              <td style="padding:10px 12px;font-size:13px;font-weight:700;color:${documentBranding.title};">${safeBookingCode}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;font-size:13px;color:${documentBranding.muted};border-top:1px solid ${documentBranding.line};">Pickup</td>
              <td style="padding:10px 12px;font-size:13px;color:${documentBranding.body};border-top:1px solid ${documentBranding.line};">${safePickup}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;font-size:13px;color:${documentBranding.muted};border-top:1px solid ${documentBranding.line};">Dropoff</td>
              <td style="padding:10px 12px;font-size:13px;color:${documentBranding.body};border-top:1px solid ${documentBranding.line};">${safeDropoff}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;font-size:13px;color:${documentBranding.muted};border-top:1px solid ${documentBranding.line};">Total Amount</td>
              <td style="padding:10px 12px;font-size:15px;font-weight:700;color:${documentBranding.title};border-top:1px solid ${documentBranding.line};">${safeAmount}</td>
            </tr>
            ${extrasRows}
          </table>

          ${
            safeInvoiceUrl
              ? `
          <div style="margin-top:18px;padding:16px;border:1px solid ${documentBranding.line};background:${documentBranding.warmSurface};border-radius:14px;">
            <p style="margin:0 0 10px 0;font-size:13px;color:${documentBranding.pink};font-weight:700;text-transform:uppercase;letter-spacing:.08em;">${safeDocumentLabel}</p>
            <a href="${safeInvoiceUrl}" style="display:inline-block;background:${documentBranding.orange};color:${documentBranding.title};text-decoration:none;padding:11px 16px;border-radius:999px;font-size:13px;font-weight:700;">Open ${safeDocumentLabel}</a>
          </div>
          `
              : ""
          }

          ${
            safeTermsUrl
              ? `
          <div style="margin-top:18px;padding:16px;border:1px solid ${documentBranding.line};background:${documentBranding.blushSurface};border-radius:14px;">
            <p style="margin:0 0 10px 0;font-size:13px;color:${documentBranding.pink};font-weight:700;text-transform:uppercase;letter-spacing:.08em;">${safeTermsLabel}</p>
            <a href="${safeTermsUrl}" style="display:inline-block;background:${documentBranding.surface};color:${documentBranding.body};text-decoration:none;padding:11px 16px;border-radius:999px;border:1px solid ${documentBranding.pink};font-size:13px;font-weight:700;">Open ${safeTermsLabel}</a>
          </div>
          `
              : ""
          }

          <p style="margin:18px 0 0 0;font-size:13px;line-height:1.7;color:${documentBranding.body};">
            ${safeOutroText}
          </p>
        </div>

        <div style="padding:16px 26px;background:${documentBranding.warmSurface};border-top:1px solid ${documentBranding.line};">
          <p style="margin:0;font-size:12px;color:${documentBranding.footerText};">This is a no-reply mailbox. Please do not reply to this email.</p>
          <p style="margin:8px 0 0 0;font-size:12px;color:${documentBranding.footerText};">${safeAddress}</p>
          <p style="margin:4px 0 0 0;font-size:12px;color:${documentBranding.footerText};">${safeEmail} · ${safePhone}</p>
        </div>
      </div>
    </div>
  `;
}
