import {
  getAppSettingValue,
  getQuickBooksFeatureSettings,
  getQuickBooksRefreshToken,
  getQuickBooksSetupSettings,
  setAppSettingValue,
  setQuickBooksRefreshToken,
} from "@/lib/settings";

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
    Vendor?: T[];
    Employee?: T[];
    Invoice?: T[];
    SalesReceipt?: T[];
    Payment?: T[];
    Item?: T[];
    Account?: T[];
  };
  Fault?: any;
};

type QuickBooksNameListEntityType = "CUSTOMER" | "VENDOR" | "EMPLOYEE";

type QuickBooksNameListEntry = {
  entityType: QuickBooksNameListEntityType;
  id: string;
  displayName: string;
  fullyQualifiedName: string;
  companyName: string;
  email: string;
  phone: string;
  active: boolean | null;
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
  const raw = String(error?.rawPayload || error?.message || "QuickBooks request failed");
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

function isDuplicateNameError(error: any) {
  const message = String(error?.rawPayload || error?.message || "").toLowerCase();
  return message.includes("name supplied already exists") || message.includes("6240");
}

function parseDuplicateEntityId(error: any) {
  const message = String(error?.rawPayload || error?.message || "");
  let parsed: any = null;
  try {
    parsed = JSON.parse(message);
  } catch {
    parsed = null;
  }

  const payloadCandidates = [
    parsed?.Fault?.Error?.[0]?.Detail,
    parsed?.Fault?.Error?.[0]?.Message,
    parsed?.fault?.error?.[0]?.detail,
    parsed?.fault?.error?.[0]?.message,
    parsed?.Fault?.Error?.[0]?.element,
    parsed?.fault?.error?.[0]?.element,
  ]
    .map((value) => String(value || ""))
    .filter(Boolean);

  for (const candidate of payloadCandidates) {
    const payloadMatch = candidate.match(/(?:^|[\s:])id\s*=\s*(\d+)\b/i);
    if (payloadMatch?.[1]) return payloadMatch[1];
  }

  const match = message.match(/(?:^|[\s:])id\s*=\s*(\d+)\b/i);
  return match?.[1] || null;
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

function normalizeCustomerDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function stripBookingSuffixFromDisplayName(value: string) {
  return value.trim().replace(/\s*\([a-z0-9-]+\)\s*$/i, "").trim();
}

function stripEmailSuffixFromDisplayName(value: string) {
  return value.trim().replace(/\s*\([^()]*@[^()]*\)\s*$/i, "").trim();
}

function sanitizeCustomerDisplayName(value: string) {
  return stripBookingSuffixFromDisplayName(stripEmailSuffixFromDisplayName(value)).trim();
}

function buildFallbackCustomerDisplayName(input: Pick<QuickBooksCustomerInput, "bookingCode" | "customerEmail">) {
  const emailLocalPart = normalizeEmail(input.customerEmail).split("@")[0] || "";
  const fallback = emailLocalPart.replace(/[._-]+/g, " ").trim();
  return (fallback || `Customer ${input.bookingCode}`).slice(0, 100);
}

function buildCustomerMatchCandidates(input: QuickBooksCustomerInput) {
  const rawName = input.customerName.trim();
  const sanitizedName = sanitizeCustomerDisplayName(rawName);
  const fallbackName = buildFallbackCustomerDisplayName(input);

  return Array.from(new Set([sanitizedName, rawName, fallbackName].map((value) => value.trim().slice(0, 100)).filter(Boolean)));
}

function buildCustomerNormalizedNameSet(customer: any) {
  const values = [
    String(customer?.DisplayName || ""),
    String(customer?.FullyQualifiedName || ""),
    String(customer?.PrintOnCheckName || ""),
    [customer?.GivenName, customer?.MiddleName, customer?.FamilyName].filter(Boolean).join(" "),
    [customer?.Title, customer?.GivenName, customer?.MiddleName, customer?.FamilyName, customer?.Suffix].filter(Boolean).join(" "),
  ];

  return new Set(
    values
      .flatMap((value) => [value, sanitizeCustomerDisplayName(value)])
      .map((value) => normalizeCustomerDisplayName(value))
      .filter(Boolean)
  );
}

function splitCustomerPersonName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { GivenName: parts[0] };
  return {
    GivenName: parts[0],
    FamilyName: parts.slice(1).join(" "),
  };
}

function summarizeCustomerForDebug(customer: any) {
  return {
    Id: String(customer?.Id || ""),
    DisplayName: String(customer?.DisplayName || ""),
    FullyQualifiedName: String(customer?.FullyQualifiedName || ""),
    Active: typeof customer?.Active === "boolean" ? customer.Active : null,
    PrimaryEmailAddr: String(customer?.PrimaryEmailAddr?.Address || ""),
    PrimaryPhone: String(customer?.PrimaryPhone?.FreeFormNumber || ""),
  };
}

function amountToMajor(cents: number) {
  return Math.round(Math.max(0, cents)) / 100;
}

const QUICKBOOKS_PRODUCTION_API_BASE = "https://quickbooks.api.intuit.com";
const QUICKBOOKS_SANDBOX_API_BASE = "https://sandbox-quickbooks.api.intuit.com";
const QUICKBOOKS_DEFAULT_MINOR_VERSION = "75";
const QUICKBOOKS_DEFAULT_ITEM_NAME = "Vehicle Rental";
const QUICKBOOKS_FALLBACK_ITEM_NAME = "Vehicle Rental Service";
const QUICKBOOKS_DOC_NUMBER_MAX_LENGTH = 21;
const QUICKBOOKS_NAME_CACHE_KEY = "quickbooks_name_list_cache_v1";
const QUICKBOOKS_NAME_CACHE_MAX_AGE_MS = 1000 * 60 * 30;

function buildBoundedReference(prefix: string, rawValue: string, maxLength = QUICKBOOKS_DOC_NUMBER_MAX_LENGTH) {
  const base = `${prefix}${rawValue}`.trim();
  if (base.length <= maxLength) return base;
  const allowedRawLength = Math.max(1, maxLength - prefix.length);
  return `${prefix}${rawValue.slice(-allowedRawLength)}`;
}

function getNameListEntryEmail(entity: any) {
  return normalizeEmail(String(entity?.PrimaryEmailAddr?.Address || entity?.BillAddr?.Email || ""));
}

function getNameListEntryPhone(entity: any) {
  return String(
    entity?.PrimaryPhone?.FreeFormNumber ||
      entity?.Mobile?.FreeFormNumber ||
      entity?.Fax?.FreeFormNumber ||
      ""
  ).trim();
}

function mapNameListEntry(entityType: QuickBooksNameListEntityType, entity: any): QuickBooksNameListEntry {
  return {
    entityType,
    id: String(entity?.Id || ""),
    displayName: String(entity?.DisplayName || "").trim(),
    fullyQualifiedName: String(entity?.FullyQualifiedName || "").trim(),
    companyName: String(entity?.CompanyName || "").trim(),
    email: getNameListEntryEmail(entity),
    phone: getNameListEntryPhone(entity),
    active: typeof entity?.Active === "boolean" ? entity.Active : null,
  };
}

async function getQuickBooksNameListCache() {
  const raw = await getAppSettingValue(QUICKBOOKS_NAME_CACHE_KEY);
  if (!raw) return { updatedAt: 0, entries: [] as QuickBooksNameListEntry[] };
  try {
    const parsed = JSON.parse(raw);
    return {
      updatedAt: Number(parsed?.updatedAt || 0),
      entries: Array.isArray(parsed?.entries) ? (parsed.entries as QuickBooksNameListEntry[]) : [],
    };
  } catch {
    return { updatedAt: 0, entries: [] as QuickBooksNameListEntry[] };
  }
}

async function setQuickBooksNameListCache(entries: QuickBooksNameListEntry[]) {
  await setAppSettingValue(
    QUICKBOOKS_NAME_CACHE_KEY,
    JSON.stringify({
      updatedAt: Date.now(),
      entries,
    })
  );
}

function isSalesLineUsableItem(item: any) {
  const type = String(item?.Type || "").toLowerCase();
  return ["service", "inventory", "noninventory", "othercharge"].includes(type);
}

function resolveQuickBooksApiBase(environment: string) {
  return environment === "sandbox" ? QUICKBOOKS_SANDBOX_API_BASE : QUICKBOOKS_PRODUCTION_API_BASE;
}

function getQuickBooksEnvConfig() {
  const environment = (process.env.QUICKBOOKS_ENVIRONMENT || "production").trim().toLowerCase();
  return {
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

async function getQuickBooksConfig() {
  const env = getQuickBooksEnvConfig();
  const feature = await getQuickBooksFeatureSettings();
  const setup = await getQuickBooksSetupSettings();
  const persistedRealmId = String(await getAppSettingValue("quickbooks_realm_id")).trim();
  return {
    ...env,
    environment: setup.environment || env.environment,
    realmId: persistedRealmId || setup.realmId || env.realmId,
    clientId: setup.clientId || env.clientId,
    clientSecret: setup.clientSecret || env.clientSecret,
    itemId: setup.itemId || env.itemId,
    enabled: feature.enabled,
    visibleInAdmin: feature.visibleInAdmin,
  };
}

export async function isQuickBooksEnabled() {
  return (await getQuickBooksFeatureSettings()).enabled;
}

async function hasRequiredQuickBooksConfig() {
  const cfg = await getQuickBooksConfig();
  if (!cfg.enabled) return false;
  return Boolean(cfg.realmId && cfg.clientId && cfg.clientSecret);
}

async function resolveAccessToken() {
  const cfg = await getQuickBooksConfig();
  const persistedRefreshToken = await getQuickBooksRefreshToken();
  const refreshToken = persistedRefreshToken || cfg.refreshToken;
  if (!refreshToken) {
    throw new Error("Missing QuickBooks refresh token. Reconnect OAuth from /api/quickbooks/connect.");
  }
  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
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
  if (json?.refresh_token) {
    await setQuickBooksRefreshToken(String(json.refresh_token));
  }
  return String(json.access_token);
}

async function qbRequest(path: string, method: "GET" | "POST", body?: unknown, contentType = "application/json") {
  const cfg = await getQuickBooksConfig();
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
    const rawErrorPayload = json ? JSON.stringify(json) : text || `QuickBooks API error ${response.status}`;
    const error = new Error(normalizeQuickBooksError({ rawPayload: rawErrorPayload }));
    (error as any).rawPayload = rawErrorPayload;
    throw error;
  }

  return json;
}

async function qbQuery<T = any>(query: string) {
  const cfg = await getQuickBooksConfig();
  const path = `/v3/company/${encodeURIComponent(cfg.realmId)}/query?query=${encodeURIComponent(query)}`;
  return (await qbRequest(path, "GET")) as QueryResponse<T>;
}

function isQueryParserError(error: any) {
  const message = String(error?.message || "");
  return message.toLowerCase().includes("queryparsererror");
}

async function qbQuerySafe<T = any>(query: string) {
  try {
    return await qbQuery<T>(query);
  } catch (error: any) {
    if (isQueryParserError(error)) {
      // Fallback for inconsistent parser behavior in some sandbox realms.
      return {} as QueryResponse<T>;
    }
    throw error;
  }
}

async function qbQueryDiagnostic<T = any>(query: string) {
  try {
    const result = await qbQuery<T>(query);
    return { result, error: null as string | null };
  } catch (error: any) {
    return {
      result: {} as QueryResponse<T>,
      error: normalizeQuickBooksError(error) || String(error?.message || "unknown query error"),
    };
  }
}

async function qbCreateOrUpdate(resource: "customer" | "invoice" | "salesreceipt" | "payment", payload: any) {
  const cfg = await getQuickBooksConfig();
  const path = `/v3/company/${encodeURIComponent(cfg.realmId)}/${resource}`;
  return await qbRequest(path, "POST", payload, "application/json");
}

async function fetchEntityById(resource: "customer" | "item", id: string) {
  const cfg = await getQuickBooksConfig();
  const response = await qbRequest(`/v3/company/${encodeURIComponent(cfg.realmId)}/${resource}/${encodeURIComponent(id)}`, "GET");
  return response?.[resource === "customer" ? "Customer" : "Item"] || null;
}

async function listNameListEntities(entity: "Customer" | "Vendor" | "Employee") {
  const pageSize = 1000;
  const values: any[] = [];

  for (let startPosition = 1; startPosition <= 10000; startPosition += pageSize) {
    const query = `select * from ${entity} startposition ${startPosition} maxresults ${pageSize}`;
    const { result, error } = await qbQueryDiagnostic<any>(query);
    if (error) {
      throw new Error(`QuickBooks ${entity} cache refresh failed: ${error}`);
    }

    const page = result?.QueryResponse?.[entity] || [];
    if (!page.length) break;
    values.push(...page);
    if (page.length < pageSize) break;
  }

  return values;
}

export async function refreshQuickBooksNameListCache(options?: { force?: boolean }) {
  if (!(await isQuickBooksEnabled())) {
    return { success: false as const, error: "QuickBooks is disabled" };
  }
  if (!(await hasRequiredQuickBooksConfig())) {
    return { success: false as const, error: "QuickBooks is enabled but missing required env configuration" };
  }

  const cached = await getQuickBooksNameListCache();
  if (!options?.force && cached.entries.length > 0 && Date.now() - cached.updatedAt < QUICKBOOKS_NAME_CACHE_MAX_AGE_MS) {
    return { success: true as const, refreshed: false as const, count: cached.entries.length };
  }

  try {
    const [customers, vendors, employees] = await Promise.all([
      listNameListEntities("Customer"),
      listNameListEntities("Vendor"),
      listNameListEntities("Employee"),
    ]);
    const entries = [
      ...customers.map((entity) => mapNameListEntry("CUSTOMER", entity)),
      ...vendors.map((entity) => mapNameListEntry("VENDOR", entity)),
      ...employees.map((entity) => mapNameListEntry("EMPLOYEE", entity)),
    ].filter((entry) => entry.id && (entry.displayName || entry.email || entry.phone || entry.companyName));

    await setQuickBooksNameListCache(entries);
    return { success: true as const, refreshed: true as const, count: entries.length };
  } catch (error: any) {
    return { success: false as const, error: normalizeQuickBooksError(error) || "QuickBooks name cache refresh failed" };
  }
}

async function ensureQuickBooksNameListCache() {
  const refresh = await refreshQuickBooksNameListCache();
  if (!refresh.success) return { updatedAt: 0, entries: [] as QuickBooksNameListEntry[] };
  return await getQuickBooksNameListCache();
}

function findCachedCustomerMatch(input: QuickBooksCustomerInput, entries: QuickBooksNameListEntry[]) {
  const candidateNames = buildCustomerMatchCandidates(input).map((value) => normalizeCustomerDisplayName(value));
  const candidateEmail = normalizeEmail(input.customerEmail);
  const candidatePhone = String(input.customerPhone || "").trim();
  const customers = entries.filter((entry) => entry.entityType === "CUSTOMER");

  return (
    customers.find((entry) => candidateNames.includes(normalizeCustomerDisplayName(entry.displayName))) ||
    customers.find((entry) => entry.email && entry.email === candidateEmail) ||
    customers.find((entry) => entry.phone && candidatePhone && entry.phone === candidatePhone) ||
    null
  );
}

async function listAllCustomersSafe() {
  const pageSize = 1000;
  const customers: any[] = [];
  const scopes = [
    "",
    " where Active = false",
  ];

  for (const scope of scopes) {
    for (let startPosition = 1; startPosition <= 10000; startPosition += pageSize) {
      const response = await qbQuerySafe<any>(
        `select * from Customer${scope} startposition ${startPosition} maxresults ${pageSize}`
      );
      const page = response?.QueryResponse?.Customer || [];
      if (!page.length) break;
      customers.push(...page);
      if (page.length < pageSize) break;
    }
  }

  const unique = new Map<string, any>();
  for (const customer of customers) {
    const id = String(customer?.Id || "");
    if (id && !unique.has(id)) {
      unique.set(id, customer);
    }
  }

  return Array.from(unique.values());
}

async function findCustomersByDisplayNamePrefix(name: string) {
  const safeName = escapeQueryValue(name);
  const queries = [
    `select * from Customer where DisplayName like '${safeName}%' maxresults 100`,
    `select * from Customer where FullyQualifiedName like '${safeName}%' maxresults 100`,
    `select * from Customer where Active = false and DisplayName like '${safeName}%' maxresults 100`,
    `select * from Customer where Active = false and FullyQualifiedName like '${safeName}%' maxresults 100`,
  ];
  const matches: any[] = [];
  for (const query of queries) {
    const response = await qbQuerySafe<any>(query);
    const customers = response?.QueryResponse?.Customer || [];
    matches.push(...customers);
  }

  const unique = new Map<string, any>();
  for (const customer of matches) {
    const id = String(customer?.Id || "");
    if (id && !unique.has(id)) unique.set(id, customer);
  }
  return Array.from(unique.values());
}

async function ensureCustomer(input: QuickBooksCustomerInput) {
  const displayNameCandidates = buildCustomerMatchCandidates(input);
  const displayName = displayNameCandidates[0] || `Customer ${input.bookingCode}`;
  const normalizedDisplayCandidates = new Set(
    displayNameCandidates
      .flatMap((value) => [value, sanitizeCustomerDisplayName(value)])
      .map((value) => normalizeCustomerDisplayName(value))
      .filter(Boolean)
  );
  const normalizedEmail = normalizeEmail(input.customerEmail);
  const cachedNameList = await ensureQuickBooksNameListCache();
  const cachedCustomerMatch = findCachedCustomerMatch(input, cachedNameList.entries);
  const debugState: {
    exactMatches: Array<{ candidate: string; result: any | null }>;
    prefixMatches: Array<{ candidate: string; results: any[] }>;
    listScanSample: any[];
    queryErrors: Array<{ query: string; error: string }>;
    duplicatePayload: string | null;
    duplicateParsedId: string | null;
  } = {
    exactMatches: [],
    prefixMatches: [],
    listScanSample: [],
    queryErrors: [],
    duplicatePayload: null,
    duplicateParsedId: null,
  };

  if (cachedCustomerMatch?.id) {
    const fetchedCachedCustomer = await fetchEntityById("customer", cachedCustomerMatch.id);
    if (fetchedCachedCustomer?.Id) return fetchedCachedCustomer;
  }

  const listAndMatchExistingCustomer = async (preferredNames: string[] = []) => {
    const normalizedPreferredNames = new Set(
      preferredNames
        .flatMap((value) => [value, sanitizeCustomerDisplayName(value)])
        .map((value) => normalizeCustomerDisplayName(value))
        .filter(Boolean)
    );
    const customers = await listAllCustomersSafe();
    debugState.listScanSample = customers
      .filter((customer: any) => {
        const customerNames = buildCustomerNormalizedNameSet(customer);
        return Array.from(new Set([...normalizedPreferredNames, ...normalizedDisplayCandidates])).some((candidate) =>
          customerNames.has(candidate)
        );
      })
      .slice(0, 10)
      .map((customer: any) => summarizeCustomerForDebug(customer));
    return (
      customers.find((customer: any) => {
        const customerNames = buildCustomerNormalizedNameSet(customer);
        return Array.from(normalizedPreferredNames).some((candidate) => customerNames.has(candidate));
      }) ||
      customers.find((customer: any) => {
        const customerNames = buildCustomerNormalizedNameSet(customer);
        return Array.from(normalizedDisplayCandidates).some((candidate) => customerNames.has(candidate));
      }) ||
      customers.find((customer: any) => normalizeEmail(String(customer?.PrimaryEmailAddr?.Address || "")) === normalizedEmail) ||
      null
    );
  };

  const findByExactDisplayName = async (name: string) => {
    const safeName = escapeQueryValue(name);
    const exactQueries = [
      `select * from Customer where DisplayName = '${safeName}'`,
      `select * from Customer where Active = false and DisplayName = '${safeName}'`,
    ];

    for (const primaryQuery of exactQueries) {
      const { result, error } = await qbQueryDiagnostic<any>(primaryQuery);
      if (error) {
        debugState.queryErrors.push({ query: primaryQuery, error });
      }
      if (result?.QueryResponse?.Customer?.[0]) {
        const match = result.QueryResponse.Customer[0];
        debugState.exactMatches.push({ candidate: name, result: summarizeCustomerForDebug(match) });
        return match;
      }
    }

    for (const fallbackQuery of [
      `select * from Customer where DisplayName = '${safeName}' maxresults 1`,
      `select * from Customer where Active = false and DisplayName = '${safeName}' maxresults 1`,
    ]) {
      const { result: fallbackResult, error } = await qbQueryDiagnostic<any>(fallbackQuery);
      if (error) {
        debugState.queryErrors.push({ query: fallbackQuery, error });
      }
      if (fallbackResult?.QueryResponse?.Customer?.[0]) {
        const match = fallbackResult.QueryResponse.Customer[0];
        debugState.exactMatches.push({ candidate: name, result: summarizeCustomerForDebug(match) });
        return match;
      }
    }

    debugState.exactMatches.push({ candidate: name, result: null });
    return null;
  };

  const resolveExistingCustomer = async (preferredNames: string[] = []) => {
    for (const candidateName of preferredNames) {
      const exactByCandidate = await findByExactDisplayName(candidateName);
      if (exactByCandidate?.Id) return exactByCandidate;
    }
    const exactByName = await findByExactDisplayName(displayName);
    if (exactByName?.Id) return exactByName;

    for (const candidateName of preferredNames.length ? preferredNames : displayNameCandidates) {
      const prefixed = await findCustomersByDisplayNamePrefix(candidateName);
      debugState.prefixMatches.push({
        candidate: candidateName,
        results: prefixed.slice(0, 10).map((customer: any) => summarizeCustomerForDebug(customer)),
      });
      const matchedByPrefix = prefixed.find((customer: any) => {
        const customerNames = buildCustomerNormalizedNameSet(customer);
        return customerNames.has(normalizeCustomerDisplayName(candidateName)) ||
          customerNames.has(normalizeCustomerDisplayName(sanitizeCustomerDisplayName(candidateName)));
      });
      if (matchedByPrefix?.Id) return matchedByPrefix;
    }

    return await listAndMatchExistingCustomer(preferredNames);
  };

  const matchedExisting = await resolveExistingCustomer(displayNameCandidates);
  if (matchedExisting?.Id) {
    return (await fetchEntityById("customer", String(matchedExisting.Id))) || matchedExisting;
  }

  const payloadBase = {
    PrimaryEmailAddr: { Address: normalizedEmail },
    ...(input.customerPhone ? { PrimaryPhone: { FreeFormNumber: input.customerPhone } } : {}),
    ...splitCustomerPersonName(displayName),
  };

  const attemptCreate = async (payload: any) => {
    const created = await qbCreateOrUpdate("customer", payload);
    const createdId = created?.Customer?.Id;
    if (!createdId) return null;
    return (await fetchEntityById("customer", String(createdId))) || created.Customer;
  };

  const createErrors: string[] = [];
  try {
    const created = await attemptCreate({
      ...payloadBase,
      DisplayName: displayName,
    });
    if (created?.Id) return created;
  } catch (error: any) {
    if (isDuplicateNameError(error)) {
      createErrors.push(`duplicate:${displayName}`);
      debugState.duplicatePayload = String(error?.rawPayload || error?.message || "");
      const duplicateId = parseDuplicateEntityId(error);
      debugState.duplicateParsedId = duplicateId;
      if (duplicateId) {
        try {
          const duplicateCustomer = await fetchEntityById("customer", duplicateId);
          if (duplicateCustomer?.Id) return duplicateCustomer;
        } catch {
          // Continue to resolver-based fallback.
        }
      }
      const resolvedAfterDuplicate = await resolveExistingCustomer(displayNameCandidates);
      if (resolvedAfterDuplicate?.Id) {
        return (await fetchEntityById("customer", String(resolvedAfterDuplicate.Id))) || resolvedAfterDuplicate;
      }
      throw new Error(
        `QuickBooks name conflict: "${displayName}" already exists in QuickBooks, but no matching Customer record could be resolved. ` +
          `Debug: ${JSON.stringify({
            bookingCustomer: {
              displayName,
              bookingCode: input.bookingCode,
              email: normalizedEmail,
              phone: String(input.customerPhone || ""),
            },
            cachedCustomerMatch,
            exactMatches: debugState.exactMatches,
            prefixMatches: debugState.prefixMatches,
            listScanSample: debugState.listScanSample,
            queryErrors: debugState.queryErrors,
            duplicateParsedId: debugState.duplicateParsedId,
            duplicatePayload: debugState.duplicatePayload,
          })}`
      );
    } else {
      createErrors.push(`${displayName}:${normalizeQuickBooksError(error) || String(error?.message || "unknown error")}`);
      throw error;
    }
  }

  // Final re-fetch in case concurrent creation happened.
  const reFetchedAny = await resolveExistingCustomer(displayNameCandidates);
  if (reFetchedAny?.Id) return (await fetchEntityById("customer", String(reFetchedAny.Id))) || reFetchedAny;

  const attemptsSummary = createErrors.length ? ` Attempts: ${createErrors.join(" | ")}` : "";
  throw new Error(`QuickBooks customer ensure failed.${attemptsSummary}`);
}

async function findItemByName(name: string) {
  const safeName = escapeQueryValue(name);
  const byNameQuery = await qbQuerySafe<any>(`select * from Item where Name = '${safeName}' maxresults 1`);
  return byNameQuery?.QueryResponse?.Item?.[0] || null;
}

async function listAllItemsSafe() {
  const allItems = await qbQuerySafe<any>("select * from Item maxresults 1000");
  return allItems?.QueryResponse?.Item || [];
}

async function ensureItemRef() {
  const cfg = await getQuickBooksConfig();
  let lastItemError = "";
  if (cfg.itemId) {
    try {
      const item = await fetchEntityById("item", cfg.itemId);
      if (item?.Id && isSalesLineUsableItem(item)) {
        return {
          value: String(item.Id),
          name: String(item.Name || QUICKBOOKS_DEFAULT_ITEM_NAME),
        };
      }
    } catch {
      // Fall through to lookup/create by name.
    }
  }

  const rentalName = QUICKBOOKS_DEFAULT_ITEM_NAME;
  const existing = await findItemByName(rentalName);
  if (existing?.Id && isSalesLineUsableItem(existing)) {
    const fetched = (await fetchEntityById("item", String(existing.Id))) || existing;
    return {
      value: String(fetched.Id),
      name: String(fetched.Name || rentalName),
    };
  }

  const accountQuery = await qbQuerySafe<any>(
    "select * from Account where AccountType = 'Income' and Active = true maxresults 1"
  );
  const incomeAccount = accountQuery?.QueryResponse?.Account?.[0];
  const createPayload: any = {
    Name: rentalName,
    Type: "Service",
  };
  if (incomeAccount?.Id) {
    createPayload.IncomeAccountRef = { value: String(incomeAccount.Id) };
  }

  try {
    const created = await qbRequest(`/v3/company/${encodeURIComponent(cfg.realmId)}/item`, "POST", createPayload);
    const createdId = created?.Item?.Id;
    if (createdId) {
      const fetched = (await fetchEntityById("item", String(createdId))) || created.Item;
      if (isSalesLineUsableItem(fetched)) {
        return {
          value: String(fetched.Id),
          name: String(fetched.Name || rentalName),
        };
      }
    }
  } catch (error: any) {
    lastItemError = normalizeQuickBooksError(error) || String(error?.message || "");
    if (isDuplicateNameError(error)) {
      const duplicateId = parseDuplicateEntityId(error);
      if (duplicateId) {
        try {
          const duplicateItem = await fetchEntityById("item", duplicateId);
          if (duplicateItem?.Id && isSalesLineUsableItem(duplicateItem)) {
            return {
              value: String(duplicateItem.Id),
              name: String(duplicateItem.Name || rentalName),
            };
          }
        } catch {
          // Fall through to name-based lookup.
        }
      }
      const afterDuplicate = await findItemByName(rentalName);
      if (afterDuplicate?.Id && isSalesLineUsableItem(afterDuplicate)) {
        const fetched = (await fetchEntityById("item", String(afterDuplicate.Id))) || afterDuplicate;
        return {
          value: String(fetched.Id),
          name: String(fetched.Name || rentalName),
        };
      }
    }
  }

  // "Rental" may already exist as a Category. Use a service-specific fallback name.
  const fallbackName = QUICKBOOKS_FALLBACK_ITEM_NAME;
  const fallbackExisting = await findItemByName(fallbackName);
  if (fallbackExisting?.Id && isSalesLineUsableItem(fallbackExisting)) {
    const fetched = (await fetchEntityById("item", String(fallbackExisting.Id))) || fallbackExisting;
    return {
      value: String(fetched.Id),
      name: String(fetched.Name || fallbackName),
    };
  }
  try {
    const createdFallback = await qbRequest(`/v3/company/${encodeURIComponent(cfg.realmId)}/item`, "POST", {
      ...createPayload,
      Name: fallbackName,
    });
    const createdId = createdFallback?.Item?.Id;
    if (createdId) {
      const fetched = (await fetchEntityById("item", String(createdId))) || createdFallback.Item;
      if (isSalesLineUsableItem(fetched)) {
        return {
          value: String(fetched.Id),
          name: String(fetched.Name || fallbackName),
        };
      }
    }
  } catch (error: any) {
    lastItemError = normalizeQuickBooksError(error) || String(error?.message || "");
    if (isDuplicateNameError(error)) {
      const duplicateId = parseDuplicateEntityId(error);
      if (duplicateId) {
        try {
          const duplicateItem = await fetchEntityById("item", duplicateId);
          if (duplicateItem?.Id && isSalesLineUsableItem(duplicateItem)) {
            return {
              value: String(duplicateItem.Id),
              name: String(duplicateItem.Name || fallbackName),
            };
          }
        } catch {
          // Continue to broad fallback below.
        }
      }
    }
    // Continue to broad fallback below.
  }

  // Final fallback by broad list (for sandbox query oddities)
  const items = await listAllItemsSafe();
  const matched =
    items.find(
      (item: any) =>
        isSalesLineUsableItem(item) &&
        item?.Active &&
        String(item?.Name || "").trim().toLowerCase() === fallbackName.toLowerCase()
    ) ||
    items.find(
      (item: any) => isSalesLineUsableItem(item) && String(item?.Name || "").trim().toLowerCase() === fallbackName.toLowerCase()
    ) ||
    items.find(
      (item: any) =>
        isSalesLineUsableItem(item) &&
        item?.Active &&
        String(item?.Name || "").trim().toLowerCase() === rentalName.toLowerCase()
    ) ||
    items.find((item: any) => isSalesLineUsableItem(item) && String(item?.Name || "").trim().toLowerCase() === rentalName.toLowerCase());
  if (matched?.Id) {
    const fetched = (await fetchEntityById("item", String(matched.Id))) || matched;
    return {
      value: String(fetched.Id),
      name: String(fetched.Name || rentalName),
    };
  }

  // Last-resort fallback: use any active sales-usable item in the realm.
  const anyActiveUsable = items.find((item: any) => isSalesLineUsableItem(item) && item?.Active) || items.find((item: any) => isSalesLineUsableItem(item));
  if (anyActiveUsable?.Id) {
    const fetched = (await fetchEntityById("item", String(anyActiveUsable.Id))) || anyActiveUsable;
    return {
      value: String(fetched.Id),
      name: String(fetched.Name || QUICKBOOKS_DEFAULT_ITEM_NAME),
    };
  }

  throw new Error(
    `Failed to resolve/create QuickBooks item. Expected usable item named "${QUICKBOOKS_DEFAULT_ITEM_NAME}" (or fallback "${QUICKBOOKS_FALLBACK_ITEM_NAME}"). ${
      lastItemError ? `Last QuickBooks error: ${lastItemError}` : ""
    }`.trim()
  );
}

function buildRentalLineDescription(bookingCode: string, startDate: Date, endDate: Date) {
  return `Rental period: ${formatDateOnly(startDate)} to ${formatDateOnly(endDate)} | Booking: ${bookingCode}`;
}

function buildInvoiceMemo(input: Pick<QuickBooksInvoiceInput, "bookingCode" | "note">) {
  return String(input.note || `Booking ${input.bookingCode}`).trim();
}

function buildSalesReceiptMemo(input: Pick<QuickBooksSalesReceiptInput, "bookingCode" | "note">) {
  return String(input.note || `Sales receipt for booking ${input.bookingCode}`).trim();
}

function normalizeMemo(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

async function findInvoiceByMemo(memo: string) {
  const target = normalizeMemo(memo);
  const allInvoices = await qbQuerySafe<any>("select * from Invoice maxresults 1000");
  const invoices = allInvoices?.QueryResponse?.Invoice || [];
  return (
    invoices.find((invoice: any) => normalizeMemo(String(invoice?.PrivateNote || "")) === target) ||
    invoices.find((invoice: any) => normalizeMemo(String(invoice?.CustomerMemo?.value || "")) === target) ||
    null
  );
}

async function findSalesReceiptByMemo(memo: string) {
  const target = normalizeMemo(memo);
  const allSalesReceipts = await qbQuerySafe<any>("select * from SalesReceipt maxresults 1000");
  const salesReceipts = allSalesReceipts?.QueryResponse?.SalesReceipt || [];
  return (
    salesReceipts.find((salesReceipt: any) => normalizeMemo(String(salesReceipt?.PrivateNote || "")) === target) ||
    salesReceipts.find((salesReceipt: any) => normalizeMemo(String(salesReceipt?.CustomerMemo?.value || "")) === target) ||
    null
  );
}

async function fetchInvoiceById(id: string) {
  const cfg = await getQuickBooksConfig();
  const response = await qbRequest(`/v3/company/${encodeURIComponent(cfg.realmId)}/invoice/${encodeURIComponent(id)}`, "GET");
  return response?.Invoice || null;
}

async function ensureInvoice(input: QuickBooksInvoiceInput, customerRefId: string) {
  const memo = buildInvoiceMemo(input);
  const existing = await findInvoiceByMemo(memo);
  if (existing?.Id) return existing;

  const itemRef = await ensureItemRef();
  const totalAmount = amountToMajor(input.totalAmountCents);

  const payloadBase = {
    TxnDate: formatDateOnly(new Date()),
    DueDate: formatDateOnly(input.startDate),
    PrivateNote: memo,
    CustomerMemo: { value: memo },
    CustomerRef: { value: customerRefId },
    BillEmail: { Address: input.customerEmail.trim().toLowerCase() },
    Line: [
      {
        Amount: totalAmount,
        DetailType: "SalesItemLineDetail",
        Description: buildRentalLineDescription(input.bookingCode, input.startDate, input.endDate),
        SalesItemLineDetail: {
          ItemRef: itemRef,
          Qty: 1,
          UnitPrice: totalAmount,
        },
      },
    ],
  };

  const created = await qbCreateOrUpdate("invoice", payloadBase);
  return created?.Invoice;
}

async function ensureSalesReceipt(input: QuickBooksSalesReceiptInput, customerRefId: string) {
  const memo = buildSalesReceiptMemo(input);
  const existing = await findSalesReceiptByMemo(memo);
  if (existing?.Id) return existing;

  const itemRef = await ensureItemRef();
  const totalAmount = amountToMajor(input.totalAmountCents);

  const payloadBase = {
    TxnDate: formatDateOnly(new Date()),
    PrivateNote: memo,
    CustomerMemo: { value: memo },
    CustomerRef: { value: customerRefId },
    BillEmail: { Address: input.customerEmail.trim().toLowerCase() },
    Line: [
      {
        Amount: totalAmount,
        DetailType: "SalesItemLineDetail",
        Description: buildRentalLineDescription(input.bookingCode, input.startDate, input.endDate),
        SalesItemLineDetail: {
          ItemRef: itemRef,
          Qty: 1,
          UnitPrice: totalAmount,
        },
      },
    ],
  };

  const created = await qbCreateOrUpdate("salesreceipt", payloadBase);
  return created?.SalesReceipt;
}

async function upsertInvoicePayment(input: QuickBooksPaymentInput, customerRefId: string, invoiceId: string) {
  const paymentRefNum = buildBoundedReference("PAY-", input.bookingCode);
  const safeRef = escapeQueryValue(paymentRefNum);
  const existingQuery = await qbQuerySafe<any>(`select * from Payment where PaymentRefNum = '${safeRef}' maxresults 1`);
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
  if (!(await isQuickBooksEnabled())) return { success: true as const, skipped: true as const };
  if (!(await hasRequiredQuickBooksConfig())) {
    return { success: false as const, error: "QuickBooks is enabled but missing required env configuration" };
  }
  try {
    const existingInvoice = await findInvoiceByMemo(buildInvoiceMemo(input));
    if (existingInvoice?.Id) {
      return {
        success: true as const,
        skipped: false as const,
        customerId: String(existingInvoice?.CustomerRef?.value || ""),
        invoiceId: String(existingInvoice.Id),
      };
    }
    const customer = await ensureCustomer(input);
    if (!customer?.Id) throw new Error("QuickBooks customer ensure failed");
    const invoice = await ensureInvoice(input, customer.Id);
    if (!invoice?.Id) throw new Error("QuickBooks invoice ensure failed");
    return { success: true as const, skipped: false as const, customerId: customer.Id, invoiceId: invoice.Id };
  } catch (error: any) {
    return { success: false as const, error: normalizeQuickBooksError(error) || "QuickBooks invoice sync failed" };
  }
}

export async function syncQuickBooksSalesReceipt(
  input: QuickBooksSalesReceiptInput,
  context?: { customerId?: string }
) {
  if (!(await isQuickBooksEnabled())) return { success: true as const, skipped: true as const };
  if (!(await hasRequiredQuickBooksConfig())) {
    return { success: false as const, error: "QuickBooks is enabled but missing required env configuration" };
  }
  try {
    const existingSalesReceipt = await findSalesReceiptByMemo(buildSalesReceiptMemo(input));
    if (existingSalesReceipt?.Id) {
      return {
        success: true as const,
        skipped: false as const,
        customerId: String(existingSalesReceipt?.CustomerRef?.value || ""),
        salesReceiptId: String(existingSalesReceipt.Id),
      };
    }
    let customerId = String(context?.customerId || "").trim();
    if (!customerId) {
      const customer = await ensureCustomer(input);
      if (!customer?.Id) throw new Error("QuickBooks customer ensure failed");
      customerId = String(customer.Id);
    }
    const salesReceipt = await ensureSalesReceipt(input, customerId);
    if (!salesReceipt?.Id) throw new Error("QuickBooks sales receipt ensure failed");
    return {
      success: true as const,
      skipped: false as const,
      customerId,
      salesReceiptId: salesReceipt.Id,
    };
  } catch (error: any) {
    return { success: false as const, error: normalizeQuickBooksError(error) || "QuickBooks sales receipt sync failed" };
  }
}

export async function receiveQuickBooksInvoicePayment(
  input: QuickBooksPaymentInput,
  context?: { invoiceId?: string; customerId?: string }
) {
  if (!(await isQuickBooksEnabled())) return { success: true as const, skipped: true as const };
  if (!(await hasRequiredQuickBooksConfig())) {
    return { success: false as const, error: "QuickBooks is enabled but missing required env configuration" };
  }
  try {
    let customerId = String(context?.customerId || "");
    let invoice: any = null;

    const contextInvoiceId = String(context?.invoiceId || "").trim();
    if (contextInvoiceId) {
      try {
        const invoiceFromContext = await fetchInvoiceById(contextInvoiceId);
        if (invoiceFromContext?.Id) {
          invoice = invoiceFromContext;
          if (!customerId) customerId = String(invoiceFromContext?.CustomerRef?.value || "");
        }
      } catch {
        // Fall through to standard lookup.
      }
    }

    if (!invoice?.Id) {
      const existingInvoiceByMemo = await findInvoiceByMemo(buildInvoiceMemo(input));
      invoice = existingInvoiceByMemo || null;
      if (!customerId) customerId = String(invoice?.CustomerRef?.value || "");
    }

    if (!invoice?.Id) {
      const customer = await ensureCustomer(input);
      if (!customer?.Id) throw new Error("QuickBooks customer ensure failed");
      customerId = String(customer.Id);
      invoice = await ensureInvoice(input, customer.Id);
    }
    if (!invoice?.Id) throw new Error("QuickBooks invoice ensure failed before payment");
    const payment = await upsertInvoicePayment(input, customerId, invoice.Id);
    if (!payment?.Id) throw new Error("QuickBooks payment upsert failed");
    return {
      success: true as const,
      skipped: false as const,
      customerId,
      invoiceId: invoice.Id,
      paymentId: payment.Id,
    };
  } catch (error: any) {
    return { success: false as const, error: normalizeQuickBooksError(error) || "QuickBooks payment sync failed" };
  }
}

export async function getQuickBooksHealth() {
  if (!(await isQuickBooksEnabled())) {
    return { success: false as const, error: "QuickBooks is disabled" };
  }
  if (!(await hasRequiredQuickBooksConfig())) {
    return { success: false as const, error: "QuickBooks is enabled but missing required env configuration" };
  }

  try {
    const cfg = await getQuickBooksConfig();
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

export async function checkQuickBooksRefreshToken() {
  if (!(await isQuickBooksEnabled())) {
    return { success: false as const, error: "QuickBooks is disabled", tokenValid: false as const };
  }
  if (!(await hasRequiredQuickBooksConfig())) {
    return {
      success: false as const,
      error: "QuickBooks is enabled but missing required env configuration",
      tokenValid: false as const,
    };
  }

  try {
    const cfg = await getQuickBooksConfig();
    const persistedRefreshToken = await getQuickBooksRefreshToken();
    const refreshToken = persistedRefreshToken || cfg.refreshToken;
    const tokenSource = persistedRefreshToken ? ("db" as const) : ("env" as const);

    if (!refreshToken) {
      return {
        success: false as const,
        tokenValid: false as const,
        tokenSource,
        error: "Missing QuickBooks refresh token. Reconnect OAuth from /api/quickbooks/connect.",
      };
    }

    const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
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
      const error = normalizeQuickBooksError(
        new Error(json?.error_description || json?.error || text || `QuickBooks OAuth refresh failed (${response.status})`)
      );
      return {
        success: false as const,
        tokenValid: false as const,
        tokenSource,
        httpStatus: response.status,
        error,
      };
    }

    if (json?.refresh_token) {
      await setQuickBooksRefreshToken(String(json.refresh_token));
    }

    return {
      success: true as const,
      tokenValid: true as const,
      tokenSource,
      httpStatus: response.status,
      accessTokenExpiresIn: Number(json?.expires_in || 0) || null,
      refreshTokenExpiresIn: Number(json?.x_refresh_token_expires_in || 0) || null,
      scope: String(json?.scope || ""),
    };
  } catch (error: any) {
    return {
      success: false as const,
      tokenValid: false as const,
      error: normalizeQuickBooksError(error) || "QuickBooks token check failed",
    };
  }
}

export async function getQuickBooksRuntimePreview() {
  const cfg = await getQuickBooksConfig();
  const feature = await getQuickBooksFeatureSettings();
  return {
    enabled: cfg.enabled,
    visibleInAdmin: feature.visibleInAdmin,
    envEnabled: feature.envEnabled,
    envConfigured: feature.envConfigured,
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
  if (!(await isQuickBooksEnabled())) {
    return { success: false as const, error: "QuickBooks is disabled" };
  }
  if (!(await hasRequiredQuickBooksConfig())) {
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
