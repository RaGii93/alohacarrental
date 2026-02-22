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
  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <h2>${tenant.tenantName}</h2>
      <h3>${input.title}</h3>
      <p>Hello ${input.customerName},</p>
      <p>Your booking reference is <strong>${input.bookingCode}</strong>.</p>
      <p>Pickup: ${input.startDate.toLocaleString()}</p>
      <p>Dropoff: ${input.endDate.toLocaleString()}</p>
      <p>Total: <strong>${tenant.currency} ${(input.totalAmountCents / 100).toFixed(2)}</strong></p>
      ${input.invoiceUrl ? `<p>${documentLabel}: <a href="${input.invoiceUrl}">${input.invoiceUrl}</a></p>` : ""}
      <p style="color:#6b7280;font-size:12px;">This is a no-reply mailbox. Please do not reply to this email.</p>
      <hr />
      <p>${tenant.address}</p>
      <p>${tenant.email} · ${tenant.phone}</p>
    </div>
  `;
}
