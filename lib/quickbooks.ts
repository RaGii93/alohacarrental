type QuickBooksCustomerInput = {
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
};

type QuickBooksInvoiceInput = QuickBooksCustomerInput & {
  totalAmountCents: number;
  startDate: Date;
  endDate: Date;
  note?: string;
};

type QuickBooksSalesReceiptInput = QuickBooksInvoiceInput;

type QuickBooksPaymentInput = QuickBooksInvoiceInput;

type QueryResponse<T = any> = {
  QueryResponse?: {
    Customer?: T[];
    Invoice?: T[];
    SalesReceipt?: T[];
    Payment?: T[];
    Item?: T[];
  };
  Fault?: any;
};

function parseQuickBooksFaultPayload(payload: any) {
  const fault = payload?.Fault || payload?.fault || null;
  const firstError = fault?.Error?.[0] || fault?.error?.[0] || null;
  const code = String(firstError?.code || firstError?.Code || "").trim();
  const message = String(firstError?.Detail || firstError?.Message || firstError?.message || "").trim();
  return { code, message };
}

function buildQuickBooksHint(code: string, message: string) {
  const joined = `${code} ${message}`.toLowerCase();
  if (joined.includes("3100") || joined.includes("applicationauthorizationfailed")) {
    return "Authorization mismatch: verify CLIENT_ID/CLIENT_SECRET/REALM_ID/REFRESH_TOKEN belong to the same Intuit app + same sandbox company.";
  }
  if (joined.includes("invalid_grant")) {
    return "Refresh token is invalid/expired/revoked. Reconnect OAuth and save the newest refresh token.";
  }
  return undefined;
}

function normalizeQuickBooksError(error: any) {
  const raw = String(error?.message || "QuickBooks request failed");
  let parsed: any = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }

  if (parsed) {
    const { code, message } = parseQuickBooksFaultPayload(parsed);
    if (code || message) {
      const hint = buildQuickBooksHint(code, message);
      return hint ? `${code || "QBO_ERROR"}: ${message}. ${hint}` : `${code || "QBO_ERROR"}: ${message}`;
    }
  }

  const hint = buildQuickBooksHint("", raw);
  return hint ? `${raw}. ${hint}` : raw;
}

function parseBool(value: string | undefined, fallback = false) {
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function escapeQueryValue(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

function amountToMajor(cents: number) {
  return Math.round(Math.max(0, cents)) / 100;
}

const QUICKBOOKS_PRODUCTION_API_BASE = "https://quickbooks.api.intuit.com";
const QUICKBOOKS_SANDBOX_API_BASE = "https://sandbox-quickbooks.api.intuit.com";
const QUICKBOOKS_DEFAULT_MINOR_VERSION = "75";
const QUICKBOOKS_DEFAULT_ITEM_NAME = "Vehicle Rental";

function resolveQuickBooksApiBase(environment: string) {
  return environment === "sandbox" ? QUICKBOOKS_SANDBOX_API_BASE : QUICKBOOKS_PRODUCTION_API_BASE;
}

function getQuickBooksConfig() {
  const enabled = parseBool(process.env.QUICKBOOKS_ENABLED, false);
  const environment = (process.env.QUICKBOOKS_ENVIRONMENT || "production").trim().toLowerCase();
  return {
    enabled,
    environment: environment === "sandbox" ? "sandbox" : "production",
    realmId: process.env.QUICKBOOKS_REALM_ID || "",
    clientId: process.env.QUICKBOOKS_CLIENT_ID || "",
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || "",
    refreshToken: process.env.QUICKBOOKS_REFRESH_TOKEN || "",
    minorVersion: QUICKBOOKS_DEFAULT_MINOR_VERSION,
    itemId: process.env.QUICKBOOKS_ITEM_ID || "",
    itemName: QUICKBOOKS_DEFAULT_ITEM_NAME,
  };
}

function maskValue(value: string, visible = 4) {
  const normalized = String(value || "");
  if (!normalized) return "";
  if (normalized.length <= visible * 2) return `${normalized.slice(0, 1)}***${normalized.slice(-1)}`;
  return `${normalized.slice(0, visible)}...${normalized.slice(-visible)}`;
}

export function isQuickBooksEnabled() {
  return getQuickBooksConfig().enabled;
}

function hasRequiredQuickBooksConfig() {
  const cfg = getQuickBooksConfig();
  if (!cfg.enabled) return false;
  return Boolean(cfg.realmId && cfg.itemId && cfg.clientId && cfg.clientSecret && cfg.refreshToken);
}

async function resolveAccessToken() {
  const cfg = getQuickBooksConfig();
  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: cfg.refreshToken,
  });
  const response = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });
  const text = await response.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!response.ok || !json?.access_token) {
    const message = normalizeQuickBooksError(
      new Error(json?.error_description || json?.error || text || `QuickBooks OAuth refresh failed (${response.status})`)
    );
    throw new Error(message);
  }
  return String(json.access_token);
}

async function qbRequest(path: string, method: "GET" | "POST", body?: unknown, contentType = "application/json") {
  const cfg = getQuickBooksConfig();
  const accessToken = await resolveAccessToken();
  const apiBase = resolveQuickBooksApiBase(cfg.environment);
  const url = `${apiBase}${path}${path.includes("?") ? "&" : "?"}minorversion=${encodeURIComponent(cfg.minorVersion)}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": contentType,
    },
    body: body === undefined ? undefined : contentType === "application/json" ? JSON.stringify(body) : String(body),
    cache: "no-store",
  });

  const text = await response.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    const faultMessage =
      json?.Fault?.Error?.[0]?.Detail ||
      json?.Fault?.Error?.[0]?.Message ||
      text ||
      `QuickBooks API error ${response.status}`;
    const message = normalizeQuickBooksError(new Error(faultMessage));
    throw new Error(message);
  }

  return json;
}

async function qbQuery<T = any>(query: string) {
  const cfg = getQuickBooksConfig();
  const path = `/v3/company/${encodeURIComponent(cfg.realmId)}/query`;
  return (await qbRequest(path, "POST", query, "text/plain")) as QueryResponse<T>;
}

async function qbCreateOrUpdate(resource: "customer" | "invoice" | "salesreceipt" | "payment", payload: any) {
  const cfg = getQuickBooksConfig();
  const path = `/v3/company/${encodeURIComponent(cfg.realmId)}/${resource}`;
  return await qbRequest(path, "POST", payload, "application/json");
}

async function upsertCustomer(input: QuickBooksCustomerInput) {
  const safeEmail = escapeQueryValue(input.customerEmail.trim().toLowerCase());
  const customerQuery = await qbQuery<any>(
    `select * from Customer where PrimaryEmailAddr = '${safeEmail}' maxresults 1`
  );
  const existing = customerQuery?.QueryResponse?.Customer?.[0];

  const displayName = input.customerName.trim() || `Customer ${input.bookingCode}`;
  const payloadBase = {
    DisplayName: displayName,
    PrimaryEmailAddr: { Address: input.customerEmail.trim().toLowerCase() },
    ...(input.customerPhone ? { PrimaryPhone: { FreeFormNumber: input.customerPhone } } : {}),
  };

  if (existing?.Id && existing?.SyncToken !== undefined) {
    const updated = await qbCreateOrUpdate("customer", {
      Id: existing.Id,
      SyncToken: existing.SyncToken,
      sparse: true,
      ...payloadBase,
    });
    return updated?.Customer || existing;
  }

  const created = await qbCreateOrUpdate("customer", payloadBase);
  return created?.Customer;
}

async function upsertInvoice(input: QuickBooksInvoiceInput, customerRefId: string) {
  const cfg = getQuickBooksConfig();
  const safeDocNumber = escapeQueryValue(input.bookingCode);
  const existingQuery = await qbQuery<any>(`select * from Invoice where DocNumber = '${safeDocNumber}' maxresults 1`);
  const existing = existingQuery?.QueryResponse?.Invoice?.[0];
  const totalAmount = amountToMajor(input.totalAmountCents);

  const payloadBase = {
    DocNumber: input.bookingCode,
    TxnDate: formatDateOnly(new Date()),
    DueDate: formatDateOnly(input.startDate),
    PrivateNote: input.note || `Booking ${input.bookingCode}`,
    CustomerRef: { value: customerRefId },
    BillEmail: { Address: input.customerEmail.trim().toLowerCase() },
    Line: [
      {
        Amount: totalAmount,
        DetailType: "SalesItemLineDetail",
        Description: `Rental booking ${input.bookingCode} (${formatDateOnly(input.startDate)} to ${formatDateOnly(
          input.endDate
        )})`,
        SalesItemLineDetail: {
          ItemRef: { value: cfg.itemId, name: cfg.itemName },
          Qty: 1,
          UnitPrice: totalAmount,
        },
      },
    ],
  };

  if (existing?.Id && existing?.SyncToken !== undefined) {
    const updated = await qbCreateOrUpdate("invoice", {
      Id: existing.Id,
      SyncToken: existing.SyncToken,
      sparse: true,
      ...payloadBase,
    });
    return updated?.Invoice || existing;
  }

  const created = await qbCreateOrUpdate("invoice", payloadBase);
  return created?.Invoice;
}

async function upsertSalesReceipt(input: QuickBooksSalesReceiptInput, customerRefId: string) {
  const cfg = getQuickBooksConfig();
  const docNumber = `SR-${input.bookingCode}`;
  const safeDocNumber = escapeQueryValue(docNumber);
  const existingQuery = await qbQuery<any>(
    `select * from SalesReceipt where DocNumber = '${safeDocNumber}' maxresults 1`
  );
  const existing = existingQuery?.QueryResponse?.SalesReceipt?.[0];
  const totalAmount = amountToMajor(input.totalAmountCents);

  const payloadBase = {
    DocNumber: docNumber,
    TxnDate: formatDateOnly(new Date()),
    PrivateNote: input.note || `Sales receipt for booking ${input.bookingCode}`,
    CustomerRef: { value: customerRefId },
    BillEmail: { Address: input.customerEmail.trim().toLowerCase() },
    Line: [
      {
        Amount: totalAmount,
        DetailType: "SalesItemLineDetail",
        Description: `Rental booking ${input.bookingCode} (${formatDateOnly(input.startDate)} to ${formatDateOnly(
          input.endDate
        )})`,
        SalesItemLineDetail: {
          ItemRef: { value: cfg.itemId, name: cfg.itemName },
          Qty: 1,
          UnitPrice: totalAmount,
        },
      },
    ],
  };

  if (existing?.Id && existing?.SyncToken !== undefined) {
    const updated = await qbCreateOrUpdate("salesreceipt", {
      Id: existing.Id,
      SyncToken: existing.SyncToken,
      sparse: true,
      ...payloadBase,
    });
    return updated?.SalesReceipt || existing;
  }

  const created = await qbCreateOrUpdate("salesreceipt", payloadBase);
  return created?.SalesReceipt;
}

async function upsertInvoicePayment(input: QuickBooksPaymentInput, customerRefId: string, invoiceId: string) {
  const paymentRefNum = `PAY-${input.bookingCode}`;
  const safeRef = escapeQueryValue(paymentRefNum);
  const existingQuery = await qbQuery<any>(`select * from Payment where PaymentRefNum = '${safeRef}' maxresults 1`);
  const existing = existingQuery?.QueryResponse?.Payment?.[0];
  const totalAmount = amountToMajor(input.totalAmountCents);

  const payloadBase = {
    TxnDate: formatDateOnly(new Date()),
    PaymentRefNum: paymentRefNum,
    PrivateNote: `Payment for booking ${input.bookingCode}`,
    TotalAmt: totalAmount,
    CustomerRef: { value: customerRefId },
    Line: [
      {
        Amount: totalAmount,
        LinkedTxn: [{ TxnId: invoiceId, TxnType: "Invoice" }],
      },
    ],
  };

  if (existing?.Id && existing?.SyncToken !== undefined) {
    const updated = await qbCreateOrUpdate("payment", {
      Id: existing.Id,
      SyncToken: existing.SyncToken,
      sparse: true,
      ...payloadBase,
    });
    return updated?.Payment || existing;
  }

  const created = await qbCreateOrUpdate("payment", payloadBase);
  return created?.Payment;
}

export async function syncQuickBooksInvoice(input: QuickBooksInvoiceInput) {
  if (!isQuickBooksEnabled()) return { success: true as const, skipped: true as const };
  if (!hasRequiredQuickBooksConfig()) {
    return { success: false as const, error: "QuickBooks is enabled but missing required env configuration" };
  }
  try {
    const customer = await upsertCustomer(input);
    if (!customer?.Id) throw new Error("QuickBooks customer upsert failed");
    const invoice = await upsertInvoice(input, customer.Id);
    if (!invoice?.Id) throw new Error("QuickBooks invoice upsert failed");
    return { success: true as const, skipped: false as const, customerId: customer.Id, invoiceId: invoice.Id };
  } catch (error: any) {
    return { success: false as const, error: normalizeQuickBooksError(error) || "QuickBooks invoice sync failed" };
  }
}

export async function syncQuickBooksSalesReceipt(input: QuickBooksSalesReceiptInput) {
  if (!isQuickBooksEnabled()) return { success: true as const, skipped: true as const };
  if (!hasRequiredQuickBooksConfig()) {
    return { success: false as const, error: "QuickBooks is enabled but missing required env configuration" };
  }
  try {
    const customer = await upsertCustomer(input);
    if (!customer?.Id) throw new Error("QuickBooks customer upsert failed");
    const salesReceipt = await upsertSalesReceipt(input, customer.Id);
    if (!salesReceipt?.Id) throw new Error("QuickBooks sales receipt upsert failed");
    return {
      success: true as const,
      skipped: false as const,
      customerId: customer.Id,
      salesReceiptId: salesReceipt.Id,
    };
  } catch (error: any) {
    return { success: false as const, error: normalizeQuickBooksError(error) || "QuickBooks sales receipt sync failed" };
  }
}

export async function receiveQuickBooksInvoicePayment(input: QuickBooksPaymentInput) {
  if (!isQuickBooksEnabled()) return { success: true as const, skipped: true as const };
  if (!hasRequiredQuickBooksConfig()) {
    return { success: false as const, error: "QuickBooks is enabled but missing required env configuration" };
  }
  try {
    const customer = await upsertCustomer(input);
    if (!customer?.Id) throw new Error("QuickBooks customer upsert failed");
    const invoice = await upsertInvoice(input, customer.Id);
    if (!invoice?.Id) throw new Error("QuickBooks invoice upsert failed before payment");
    const payment = await upsertInvoicePayment(input, customer.Id, invoice.Id);
    if (!payment?.Id) throw new Error("QuickBooks payment upsert failed");
    return {
      success: true as const,
      skipped: false as const,
      customerId: customer.Id,
      invoiceId: invoice.Id,
      paymentId: payment.Id,
    };
  } catch (error: any) {
    return { success: false as const, error: normalizeQuickBooksError(error) || "QuickBooks payment sync failed" };
  }
}

export async function getQuickBooksHealth() {
  if (!isQuickBooksEnabled()) {
    return { success: false as const, error: "QuickBooks is disabled" };
  }
  if (!hasRequiredQuickBooksConfig()) {
    return { success: false as const, error: "QuickBooks is enabled but missing required env configuration" };
  }

  try {
    const cfg = getQuickBooksConfig();
    const token = await resolveAccessToken();
    const apiBase = resolveQuickBooksApiBase(cfg.environment);
    const companyInfoResponse = await qbRequest(
      `/v3/company/${encodeURIComponent(cfg.realmId)}/companyinfo/${encodeURIComponent(cfg.realmId)}`,
      "GET"
    );
    const companyInfo = companyInfoResponse?.CompanyInfo || null;

    let itemCheck:
      | {
          configuredItemId: string;
          exists: boolean;
          itemId?: string;
          itemName?: string;
          itemActive?: boolean;
        }
      | null = null;
    if (cfg.itemId) {
      try {
        const itemResponse = await qbRequest(
          `/v3/company/${encodeURIComponent(cfg.realmId)}/item/${encodeURIComponent(cfg.itemId)}`,
          "GET"
        );
        const item = itemResponse?.Item || null;
        itemCheck = {
          configuredItemId: cfg.itemId,
          exists: Boolean(item?.Id),
          ...(item?.Id
            ? {
                itemId: String(item.Id),
                itemName: String(item.Name || ""),
                itemActive: Boolean(item.Active),
              }
            : {}),
        };
      } catch {
        itemCheck = {
          configuredItemId: cfg.itemId,
          exists: false,
        };
      }
    }

    return {
      success: true as const,
      quickbooks: {
        enabled: true,
        realmId: cfg.realmId,
        minorVersion: cfg.minorVersion,
        authMode: "oauth_refresh_token",
        hasAccessToken: Boolean(token),
        company: companyInfo
          ? {
              companyName: companyInfo.CompanyName || null,
              legalName: companyInfo.LegalName || null,
              country: companyInfo.Country || null,
            }
          : null,
        itemCheck,
        environment: cfg.environment,
        apiBase,
      },
    };
  } catch (error: any) {
    return { success: false as const, error: normalizeQuickBooksError(error) || "QuickBooks health check failed" };
  }
}

export function getQuickBooksRuntimePreview() {
  const cfg = getQuickBooksConfig();
  return {
    enabled: cfg.enabled,
    realmId: cfg.realmId,
    realmIdMasked: maskValue(cfg.realmId, 4),
    itemId: cfg.itemId,
    itemIdMasked: maskValue(cfg.itemId, 2),
    hasClientId: Boolean(cfg.clientId),
    clientIdMasked: maskValue(cfg.clientId, 6),
    hasClientSecret: Boolean(cfg.clientSecret),
    clientSecretMasked: maskValue(cfg.clientSecret, 4),
    hasRefreshToken: Boolean(cfg.refreshToken),
    refreshTokenMasked: maskValue(cfg.refreshToken, 6),
    redirectUri: process.env.QUICKBOOKS_REDIRECT_URI || "",
    minorVersion: cfg.minorVersion,
    environment: cfg.environment,
    apiBase: resolveQuickBooksApiBase(cfg.environment),
  };
}

export async function listQuickBooksItems(options?: { limit?: number; activeOnly?: boolean }) {
  if (!isQuickBooksEnabled()) {
    return { success: false as const, error: "QuickBooks is disabled" };
  }
  if (!hasRequiredQuickBooksConfig()) {
    return { success: false as const, error: "QuickBooks is enabled but missing required env configuration" };
  }

  try {
    const limit = Math.max(1, Math.min(1000, Number(options?.limit || 100)));
    const activeOnly = options?.activeOnly !== false;
    const where = activeOnly ? " where Active = true" : "";
    const query = `select * from Item${where} maxresults ${limit}`;
    const result = await qbQuery<any>(query);
    const items = (result?.QueryResponse?.Item || []).map((item) => ({
      id: String(item.Id || ""),
      name: String(item.Name || ""),
      type: String(item.Type || ""),
      active: Boolean(item.Active),
    }));

    return {
      success: true as const,
      count: items.length,
      items,
    };
  } catch (error: any) {
    return { success: false as const, error: normalizeQuickBooksError(error) || "QuickBooks item list failed" };
  }
}
