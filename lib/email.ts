import { getTenantConfig, tenantThemeTokenToHex } from "@/lib/tenant";
import { formatDateTime } from "@/lib/datetime";
import { readFile } from "node:fs/promises";
import path from "node:path";

type SendEmailParams = {
  to: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
};

export type EmailAttachment = {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  contentId?: string;
};

export const BOOKING_EMAIL_LOGO_CID = "aloha-car-rental-logo";

function normalizeFromAddress(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^([^<]+)<\s*([^>]+)\s*>$/);
  if (!match) return trimmed;
  return `${match[1].trim()} <${match[2].trim()}>`;
}

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_API;
  if (!apiKey) {
    console.error("Email send skipped: missing RESEND_API_KEY or RESEND_API");
    return { success: false, error: "Missing RESEND_API_KEY or RESEND_API" };
  }

  const rawFrom = normalizeFromAddress(String(process.env.RESEND_FROM || ""));
  const from =
    !rawFrom || rawFrom.includes("@endlessedgetechnology.com")
      ? "Aloha Car Rental <edgeRent@endlessedgetechnology.com>"
      : rawFrom;

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
        ...(params.bcc
          ? {
              bcc: Array.isArray(params.bcc) ? params.bcc : [params.bcc],
            }
          : {}),
        subject: params.subject,
        html: params.html,
        text: params.text,
        attachments: params.attachments?.map((file) => ({
          filename: file.filename,
          content: typeof file.content === "string" ? file.content : file.content.toString("base64"),
          content_type: file.contentType,
          content_id: file.contentId,
        })),
      }),
    });

    if (!res.ok) {
      const payload = await res.text();
      console.error("Resend API rejected email", {
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        from,
        status: res.status,
        error: payload || `Resend error ${res.status}`,
      });
      return { success: false, error: payload || `Resend error ${res.status}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Email send failed", {
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      from,
      error: error?.message || "Email send failed",
    });
    return { success: false, error: error?.message || "Email send failed" };
  }
}

export async function bookingEmailHtml(input: {
  title: string;
  customerName: string;
  bookingCode: string;
  startDate: Date;
  endDate: Date;
  totalAmountCents?: number;
  extras?: Array<{ name: string; quantity: number; lineTotal: number }>;
  invoiceUrl?: string | null;
  documentLabel?: string;
  termsUrl?: string | null;
  termsLabel?: string;
  introText?: string;
  outroText?: string;
  logoCid?: string;
  customerEmail?: string;
  customerPhone?: string;
  pickupLocation?: string | null;
  dropoffLocation?: string | null;
  showFinancialSummary?: boolean;
}) {
  const tenant = await getTenantConfig();
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    "";
  const primaryHex = tenantThemeTokenToHex(tenant.theme.primary);
  const primaryForegroundHex = tenantThemeTokenToHex(tenant.theme.primaryForeground);
  const accentHex = tenantThemeTokenToHex(tenant.theme.accent);
  const accentForegroundHex = tenantThemeTokenToHex(tenant.theme.accentForeground);
  const documentLabel = input.documentLabel || "Billing document";
  const pickup = formatDateTime(input.startDate);
  const dropoff = formatDateTime(input.endDate);
  const showFinancialSummary = input.showFinancialSummary !== false && typeof input.totalAmountCents === "number";
  const amount = showFinancialSummary
    ? `${tenant.currency} ${(input.totalAmountCents! / 100).toFixed(2)}`
    : "";
  const escapeHtml = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const safeTenant = escapeHtml(tenant.tenantName);
  const resolvedLogoUrl = (() => {
    const rawLogoUrl = String(tenant.logoUrl || "/home/logo.png").trim();
    if (!rawLogoUrl) return "";
    if (rawLogoUrl.startsWith("http://") || rawLogoUrl.startsWith("https://")) return rawLogoUrl;
    if (!rawLogoUrl.startsWith("/") || !baseUrl) return "";
    const normalizedBase = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
    return `${normalizedBase.replace(/\/$/, "")}${rawLogoUrl}`;
  })();
  const safeLogoUrl = resolvedLogoUrl ? escapeHtml(resolvedLogoUrl) : "";
  const safeLogoCid = input.logoCid ? escapeHtml(input.logoCid) : "";
  const safeTitle = escapeHtml(input.title);
  const safeName = escapeHtml(input.customerName);
  const safeBookingCode = escapeHtml(input.bookingCode);
  const safePickup = escapeHtml(pickup);
  const safeDropoff = escapeHtml(dropoff);
  const safeAmount = amount ? escapeHtml(amount) : "";
  const safeDocumentLabel = escapeHtml(documentLabel);
  const safeAddress = escapeHtml(tenant.address || "-");
  const safeEmail = escapeHtml(tenant.email || "-");
  const safePhone = escapeHtml(tenant.phone || "-");
  const safeCustomerEmail = escapeHtml(input.customerEmail || "-");
  const safeCustomerPhone = escapeHtml(input.customerPhone || "-");
  const safePickupLocation = escapeHtml(input.pickupLocation || "-");
  const safeDropoffLocation = escapeHtml(input.dropoffLocation || "-");
  const safeIntroText = escapeHtml(input.introText || `Thank you for choosing ${tenant.tenantName}. Below is your booking summary.`);
  const safeOutroText = escapeHtml(input.outroText || `If you need assistance, contact us at ${tenant.email || "-"}.`);
  const safeInvoiceUrl = input.invoiceUrl ? escapeHtml(input.invoiceUrl) : null;
  const safeTermsUrl = input.termsUrl ? escapeHtml(input.termsUrl) : null;
  const safeTermsLabel = escapeHtml(input.termsLabel || "Terms and Conditions");
  const accentSoft = accentHex;
  const accentBorder = primaryHex;
  const neutralBorder = accentHex;
  const neutralSurface = "#ffffff";
  const neutralText = "#5b6472";
  const luxurySurface = "#f8f7f4";
  const luxuryBorder = "#d7d0c4";
  const sectionTitle = "#243041";
  const logoSrc = safeLogoCid ? `cid:${safeLogoCid}` : safeLogoUrl;
  const extrasRows = showFinancialSummary
    ? (input.extras || [])
    .map((extra) => `
      <tr>
        <td style="padding:10px 12px;font-size:13px;color:${neutralText};border-top:1px solid ${neutralBorder};">Extra</td>
        <td style="padding:10px 12px;font-size:13px;color:#111111;border-top:1px solid ${neutralBorder};">${escapeHtml(`${extra.name} x${extra.quantity}`)} - ${escapeHtml(`${tenant.currency} ${(extra.lineTotal / 100).toFixed(2)}`)}</td>
      </tr>
    `)
    .join("")
    : "";

  return `
    <div style="margin:0;background:${luxurySurface};padding:28px 14px;font-family:Arial,Helvetica,sans-serif;color:#111111;" class="email-shell">
      <style>
        @media only screen and (max-width: 620px) {
          .email-shell { padding:16px 8px !important; }
          .email-card { border-radius:14px !important; }
          .email-header,
          .email-section,
          .email-footer { padding-left:16px !important; padding-right:16px !important; }
          .email-header-table,
          .email-header-table tbody,
          .email-header-table tr,
          .email-header-table td,
          .email-stack-table,
          .email-stack-table tbody,
          .email-stack-table tr,
          .email-stack-table td { display:block !important; width:100% !important; }
          .email-header-copy { text-align:left !important; padding-top:14px !important; }
          .email-stack-left { padding-right:0 !important; }
          .email-stack-right { padding-left:0 !important; padding-top:12px !important; }
          .email-word-break { word-break:break-word !important; overflow-wrap:anywhere !important; }
          .email-cta { display:block !important; text-align:center !important; }
        }
      </style>
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid ${luxuryBorder};border-radius:18px;overflow:hidden;" class="email-card">
        <div style="padding:22px 26px;background:#ffffff;color:#111111;border-bottom:1px solid ${luxuryBorder};" class="email-header">
          <div style="height:3px;background:${accentHex};margin:-22px -26px 18px -26px;"></div>
          <table role="presentation" style="width:100%;border-collapse:collapse;" class="email-header-table">
            <tr>
              <td style="vertical-align:middle;text-align:left;">
                ${
                  logoSrc
                    ? `<img src="${logoSrc}" alt="${safeTenant}" style="display:block;max-height:58px;width:auto;max-width:220px;object-fit:contain;" />`
                    : `<p style="margin:0;font-size:12px;letter-spacing:.08em;color:${neutralText};text-transform:uppercase;">${safeTenant}</p>`
                }
              </td>
              <td style="vertical-align:middle;text-align:right;" class="email-header-copy">
                <h2 style="margin:0;font-size:22px;line-height:1.25;color:#111111;">${safeTitle}</h2>
                <p style="margin:6px 0 0 0;font-size:12px;color:${neutralText};">${safeBookingCode}</p>
              </td>
            </tr>
          </table>
        </div>

        <div style="padding:24px 26px;" class="email-section">
          <p style="margin:0 0 12px 0;font-size:15px;">Hello ${safeName},</p>
          <p style="margin:0 0 18px 0;font-size:14px;color:${neutralText};">
            ${safeIntroText}
          </p>

          <table role="presentation" style="width:100%;border-collapse:separate;border-spacing:0 12px;" class="email-stack-table">
            <tr>
              <td style="width:50%;vertical-align:top;padding-right:6px;" class="email-stack-left">
                <div style="border:1px solid ${luxuryBorder};border-radius:14px;overflow:hidden;background:#ffffff;">
                  <div style="padding:12px 14px;background:${primaryHex};color:${primaryForegroundHex};font-size:12px;font-weight:700;letter-spacing:.06em;">CUSTOMER INFORMATION</div>
                  <table role="presentation" style="width:100%;border-collapse:collapse;">
                    <tr>
                      <td style="padding:10px 12px;font-size:13px;color:${neutralText};width:40%;">Customer</td>
                      <td style="padding:10px 12px;font-size:13px;font-weight:700;color:#111111;" class="email-word-break">${safeName}</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 12px;font-size:13px;color:${neutralText};border-top:1px solid ${luxuryBorder};">Email</td>
                      <td style="padding:10px 12px;font-size:13px;color:#111111;border-top:1px solid ${luxuryBorder};" class="email-word-break">${safeCustomerEmail}</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 12px;font-size:13px;color:${neutralText};border-top:1px solid ${luxuryBorder};">Phone</td>
                      <td style="padding:10px 12px;font-size:13px;color:#111111;border-top:1px solid ${luxuryBorder};" class="email-word-break">${safeCustomerPhone}</td>
                    </tr>
                  </table>
                </div>
              </td>
              <td style="width:50%;vertical-align:top;padding-left:6px;" class="email-stack-right">
                <div style="border:1px solid ${luxuryBorder};border-radius:14px;overflow:hidden;background:#ffffff;">
                  <div style="padding:12px 14px;background:${primaryHex};color:${primaryForegroundHex};font-size:12px;font-weight:700;letter-spacing:.06em;">BOOKING INFORMATION</div>
                  <table role="presentation" style="width:100%;border-collapse:collapse;">
                    <tr>
                      <td style="padding:10px 12px;font-size:13px;color:${neutralText};width:42%;">Reference</td>
                      <td style="padding:10px 12px;font-size:13px;font-weight:700;color:#111111;" class="email-word-break">${safeBookingCode}</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 12px;font-size:13px;color:${neutralText};border-top:1px solid ${luxuryBorder};">Pickup</td>
                      <td style="padding:10px 12px;font-size:13px;color:#111111;border-top:1px solid ${luxuryBorder};" class="email-word-break">${safePickup}</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 12px;font-size:13px;color:${neutralText};border-top:1px solid ${luxuryBorder};">Dropoff</td>
                      <td style="padding:10px 12px;font-size:13px;color:#111111;border-top:1px solid ${luxuryBorder};" class="email-word-break">${safeDropoff}</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 12px;font-size:13px;color:${neutralText};border-top:1px solid ${luxuryBorder};">Pickup location</td>
                      <td style="padding:10px 12px;font-size:13px;color:#111111;border-top:1px solid ${luxuryBorder};" class="email-word-break">${safePickupLocation}</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 12px;font-size:13px;color:${neutralText};border-top:1px solid ${luxuryBorder};">Dropoff location</td>
                      <td style="padding:10px 12px;font-size:13px;color:#111111;border-top:1px solid ${luxuryBorder};" class="email-word-break">${safeDropoffLocation}</td>
                    </tr>
                    ${
                      showFinancialSummary
                        ? `
                    <tr>
                      <td style="padding:10px 12px;font-size:13px;color:${neutralText};border-top:1px solid ${luxuryBorder};">Total Amount</td>
                      <td style="padding:10px 12px;font-size:15px;font-weight:700;color:#111111;border-top:1px solid ${luxuryBorder};" class="email-word-break">${safeAmount}</td>
                    </tr>
                    `
                        : ""
                    }
                  </table>
                </div>
              </td>
            </tr>
          </table>

          ${
            extrasRows
              ? `
          <div style="margin-top:6px;border:1px solid ${luxuryBorder};border-radius:14px;overflow:hidden;background:#ffffff;">
            <div style="padding:12px 14px;background:${luxurySurface};color:${sectionTitle};font-size:12px;font-weight:700;letter-spacing:.06em;">BOOKING DETAILS</div>
            <table role="presentation" style="width:100%;border-collapse:collapse;">
              ${extrasRows}
            </table>
          </div>
          `
              : ""
          }

          ${
            safeInvoiceUrl
              ? `
          <div style="margin-top:18px;padding:16px;border:1px solid ${accentBorder};background:${accentSoft};border-radius:14px;">
            <p style="margin:0 0 10px 0;font-size:13px;color:${accentForegroundHex};font-weight:600;">${safeDocumentLabel}</p>
            <a href="${safeInvoiceUrl}" style="display:inline-block;background:${primaryHex};color:${primaryForegroundHex};text-decoration:none;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:600;" class="email-cta">Open ${safeDocumentLabel}</a>
          </div>
          `
              : ""
          }

          ${
            safeTermsUrl
              ? `
          <div style="margin-top:18px;padding:14px;border:1px solid ${luxuryBorder};background:${neutralSurface};border-radius:14px;">
            <p style="margin:0 0 10px 0;font-size:13px;color:${neutralText};font-weight:600;">${safeTermsLabel}</p>
            <a href="${safeTermsUrl}" style="display:inline-block;background:${accentHex};color:${accentForegroundHex};text-decoration:none;padding:10px 14px;border-radius:8px;border:1px solid ${luxuryBorder};font-size:13px;font-weight:600;" class="email-cta">Open ${safeTermsLabel}</a>
          </div>
          `
              : ""
          }

          <p style="margin:18px 0 0 0;font-size:13px;color:#475569;">
            ${safeOutroText}
          </p>
        </div>

        <div style="padding:16px 26px;background:${luxurySurface};border-top:1px solid ${luxuryBorder};" class="email-footer">
          <p style="margin:0;font-size:12px;color:${neutralText};">This is a no-reply mailbox. Please do not reply to this email.</p>
          <p style="margin:8px 0 0 0;font-size:12px;color:${neutralText};" class="email-word-break">${safeAddress}</p>
          <p style="margin:4px 0 0 0;font-size:12px;color:${neutralText};" class="email-word-break">${safeEmail} · ${safePhone}</p>
        </div>
      </div>
    </div>
  `;
}

export async function getBookingEmailLogoAttachment(): Promise<EmailAttachment | null> {
  const tenant = await getTenantConfig();
  const rawLogoUrl = String(tenant.logoUrl || "/home/logo.png").trim();
  if (!rawLogoUrl) return null;
  const localCandidates = Array.from(new Set([rawLogoUrl, "/home/logo.png"].filter((url) => url.startsWith("/"))));

  try {
    for (const logoPath of localCandidates) {
      try {
        const filePath = path.join(process.cwd(), "public", logoPath.replace(/^\/+/, ""));
        const bytes = await readFile(filePath);
        const lowerPath = logoPath.toLowerCase();
        const contentType = lowerPath.endsWith(".png")
          ? "image/png"
          : lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")
            ? "image/jpeg"
            : lowerPath.endsWith(".svg")
              ? "image/svg+xml"
              : "application/octet-stream";

        return {
          filename: path.basename(logoPath) || "aloha-logo.png",
          content: bytes,
          contentType,
          contentId: BOOKING_EMAIL_LOGO_CID,
        };
      } catch {}
    }

    if (rawLogoUrl.startsWith("http://") || rawLogoUrl.startsWith("https://")) {
      const response = await fetch(rawLogoUrl);
      if (!response.ok) return null;
      const bytes = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get("content-type") || "application/octet-stream";
      const pathname = new URL(rawLogoUrl).pathname;

      return {
        filename: path.basename(pathname) || "aloha-logo",
        content: bytes,
        contentType,
        contentId: BOOKING_EMAIL_LOGO_CID,
      };
    }
  } catch (error: any) {
    console.error("Failed to load booking email logo attachment", {
      rawLogoUrl,
      error: error?.message || "Unknown logo attachment error",
    });
  }

  return null;
}

export async function buildBookingEmailPayload(
  input: Parameters<typeof bookingEmailHtml>[0],
  extraAttachments: EmailAttachment[] = []
) {
  const logoAttachment = await getBookingEmailLogoAttachment();
  return {
    html: await bookingEmailHtml({
      ...input,
      logoCid: logoAttachment ? BOOKING_EMAIL_LOGO_CID : input.logoCid,
    }),
    attachments: [...(logoAttachment ? [logoAttachment] : []), ...extraAttachments],
  };
}
