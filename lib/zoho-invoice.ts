import {
  getInvoiceProvider,
  getZohoInvoiceFeatureSettings,
  getZohoInvoiceOrganizationId,
  getZohoInvoiceRefreshToken,
  getZohoSetupSettings,
  setZohoInvoiceRefreshToken,
} from "@/lib/settings";

type ZohoCustomerInput = {
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
};

type ZohoInvoiceInput = ZohoCustomerInput & {
  totalAmountCents: number;
  startDate: Date;
  endDate: Date;
};

type ZohoPaymentInput = ZohoInvoiceInput;

function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function amountToMajor(cents: number) {
  return Math.round(Math.max(0, cents)) / 100;
}

function splitName(value: string) {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || value, lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

async function getZohoConfig() {
  const setup = await getZohoSetupSettings();
  const [feature, organizationId] = await Promise.all([
    getZohoInvoiceFeatureSettings(),
    getZohoInvoiceOrganizationId(),
  ]);
  return {
    clientId: setup.clientId,
    clientSecret: setup.clientSecret,
    redirectUri: setup.redirectUri,
    accountsBaseUrl: setup.accountsBaseUrl.replace(/\/$/, ""),
    apiBaseUrl: setup.apiBaseUrl.replace(/\/$/, ""),
    organizationId,
    enabled: feature.enabled,
  };
}

export async function isZohoInvoiceEnabled() {
  return (await getZohoConfig()).enabled && (await getInvoiceProvider()) === "ZOHO";
}

async function resolveAccessToken() {
  const cfg = await getZohoConfig();
  const refreshToken = await getZohoInvoiceRefreshToken();
  if (!refreshToken) {
    throw new Error("Missing Zoho Invoice refresh token.");
  }
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
  });
  const response = await fetch(`${cfg.accountsBaseUrl}/oauth/v2/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  if (!response.ok || !json?.access_token) {
    throw new Error(String(json?.error_description || json?.error || text || "Zoho OAuth refresh failed"));
  }
  if (json?.refresh_token) {
    await setZohoInvoiceRefreshToken(String(json.refresh_token));
  }
  return String(json.access_token);
}

async function zohoRequest<T = any>(path: string, method: "GET" | "POST", body?: unknown) {
  const cfg = await getZohoConfig();
  const accessToken = await resolveAccessToken();
  const response = await fetch(`${cfg.apiBaseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      Accept: "application/json",
      "X-com-zoho-invoice-organizationid": cfg.organizationId,
      ...(body === undefined ? {} : { "Content-Type": "application/x-www-form-urlencoded" }),
    },
    body: body === undefined ? undefined : new URLSearchParams({ JSONString: JSON.stringify(body) }).toString(),
    cache: "no-store",
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  if (!response.ok || (json && typeof json.code === "number" && json.code !== 0)) {
    throw new Error(String(json?.message || text || `Zoho Invoice API error ${response.status}`));
  }
  return json as T;
}

async function findContact(input: ZohoCustomerInput) {
  const cfg = await getZohoConfig();
  const accessToken = await resolveAccessToken();
  const queries = [
    `email_contains=${encodeURIComponent(input.customerEmail)}`,
    `contact_name_contains=${encodeURIComponent(input.customerName)}`,
  ];

  for (const query of queries) {
    const response = await fetch(`${cfg.apiBaseUrl}/contacts?${query}`, {
      method: "GET",
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        Accept: "application/json",
        "X-com-zoho-invoice-organizationid": cfg.organizationId,
      },
      cache: "no-store",
    });
    const text = await response.text();
    const json = text ? JSON.parse(text) : null;
    const contacts = Array.isArray(json?.contacts) ? json.contacts : [];
    const exact = contacts.find((contact: any) =>
      String(contact?.email || "").trim().toLowerCase() === input.customerEmail.trim().toLowerCase()
    );
    if (exact?.contact_id) return String(exact.contact_id);
    if (contacts[0]?.contact_id) return String(contacts[0].contact_id);
  }

  return null;
}

async function ensureContact(input: ZohoCustomerInput) {
  const existingId = await findContact(input);
  if (existingId) return existingId;
  const { firstName, lastName } = splitName(input.customerName);
  const created = await zohoRequest<any>("/contacts", "POST", {
    contact_name: input.customerName,
    company_name: input.customerName,
    contact_type: "customer",
    email: input.customerEmail,
    phone: input.customerPhone || undefined,
    contact_persons: [
      {
        first_name: firstName,
        last_name: lastName,
        email: input.customerEmail,
        phone: input.customerPhone || undefined,
        is_primary_contact: true,
      },
    ],
  });
  return String(created?.contact?.contact_id || "");
}

export async function syncZohoInvoice(input: ZohoInvoiceInput) {
  if (!(await isZohoInvoiceEnabled())) {
    return { success: false as const, error: "Zoho Invoice is disabled" };
  }
  try {
    const customerId = await ensureContact(input);
    const invoice = await zohoRequest<any>("/invoices", "POST", {
      customer_id: customerId,
      reference_number: input.bookingCode,
      date: formatDateOnly(input.startDate),
      due_date: formatDateOnly(input.endDate),
      line_items: [
        {
          name: `Vehicle rental ${input.bookingCode}`,
          description: `Rental ${formatDateOnly(input.startDate)} to ${formatDateOnly(input.endDate)}`,
          quantity: 1,
          rate: amountToMajor(input.totalAmountCents),
        },
      ],
    });
    return {
      success: true as const,
      customerId,
      invoiceId: String(invoice?.invoice?.invoice_id || ""),
    };
  } catch (error: any) {
    return { success: false as const, error: String(error?.message || "Zoho invoice sync failed") };
  }
}

export async function syncZohoSalesReceipt(input: ZohoInvoiceInput, options?: { customerId?: string }) {
  const invoiceResult = await syncZohoInvoice({
    ...input,
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
  });
  if (!invoiceResult.success) return invoiceResult;
  const paymentResult = await receiveZohoInvoicePayment(input, {
    customerId: options?.customerId || invoiceResult.customerId,
    invoiceId: invoiceResult.invoiceId,
  });
  if (!paymentResult.success) return paymentResult;
  return {
    success: true as const,
    customerId: paymentResult.customerId,
    invoiceId: paymentResult.invoiceId,
    paymentId: paymentResult.paymentId,
  };
}

export async function receiveZohoInvoicePayment(
  input: ZohoPaymentInput,
  options?: { customerId?: string; invoiceId?: string }
) {
  if (!(await isZohoInvoiceEnabled())) {
    return { success: false as const, error: "Zoho Invoice is disabled" };
  }
  try {
    const customerId = options?.customerId || (await ensureContact(input));
    const invoiceId = options?.invoiceId;
    if (!invoiceId) {
      return { success: false as const, error: "Zoho invoice is required before payment sync" };
    }
    const payment = await zohoRequest<any>("/customerpayments", "POST", {
      customer_id: customerId,
      payment_mode: "Bank Transfer",
      amount: amountToMajor(input.totalAmountCents),
      date: formatDateOnly(new Date()),
      invoices: [
        {
          invoice_id: invoiceId,
          amount_applied: amountToMajor(input.totalAmountCents),
        },
      ],
      reference_number: input.bookingCode,
      description: `Payment for booking ${input.bookingCode}`,
    });
    return {
      success: true as const,
      customerId,
      invoiceId,
      paymentId: String(payment?.payment?.payment_id || payment?.payment?.customer_payment_id || ""),
    };
  } catch (error: any) {
    return { success: false as const, error: String(error?.message || "Zoho payment sync failed") };
  }
}
