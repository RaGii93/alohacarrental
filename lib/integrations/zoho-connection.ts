import { randomUUID } from "crypto";
import { getBaseUrl } from "@/lib/seo";
import {
  getInvoiceProvider,
  getZohoSetupSettings,
  getZohoInvoiceFeatureSettings,
  getZohoInvoiceOrganizationId,
  getZohoInvoiceRefreshToken,
  setZohoSetupSettings,
  setZohoInvoiceOrganizationId,
  setZohoInvoiceRefreshToken,
} from "@/lib/settings";

type ZohoTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  api_domain?: string;
  error?: string;
  error_description?: string;
};

type ZohoOrganization = {
  organization_id?: string;
  name?: string;
  is_default_org?: boolean;
};

export class ZohoConnectionHelper {
  static stateCookieName = "zoho_oauth_state";

  static async getAccountsBaseUrl() {
    return (await getZohoSetupSettings()).accountsBaseUrl.replace(/\/$/, "");
  }

  static async getApiBaseUrl() {
    return (await getZohoSetupSettings()).apiBaseUrl.replace(/\/$/, "");
  }

  static async getRedirectUri() {
    const setup = await getZohoSetupSettings();
    return setup.redirectUri || `${getBaseUrl()}/api/integrations/zoho/callback`;
  }

  static async getClientId() {
    return (await getZohoSetupSettings()).clientId;
  }

  static async getClientSecret() {
    return (await getZohoSetupSettings()).clientSecret;
  }

  static createState(locale: string) {
    return JSON.stringify({
      nonce: randomUUID(),
      locale,
      provider: "zoho",
    });
  }

  static async buildAuthorizeUrl(state: string) {
    const params = new URLSearchParams({
      client_id: await this.getClientId(),
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      redirect_uri: await this.getRedirectUri(),
      scope: "ZohoInvoice.fullaccess.all",
      state,
    });
    return `${await this.getAccountsBaseUrl()}/oauth/v2/auth?${params.toString()}`;
  }

  static async exchangeCode(input: { code: string; accountsServer?: string }) {
    const accountsBaseUrl = String(input.accountsServer || (await this.getAccountsBaseUrl())).trim().replace(/\/$/, "");
    const response = await fetch(`${accountsBaseUrl}/oauth/v2/token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: input.code,
        client_id: await this.getClientId(),
        client_secret: await this.getClientSecret(),
        redirect_uri: await this.getRedirectUri(),
      }).toString(),
      cache: "no-store",
    });
    const text = await response.text();
    const json = text ? (JSON.parse(text) as ZohoTokenResponse) : null;
    if (!response.ok || !json?.refresh_token) {
      if (!response.ok || !json?.access_token) {
        throw new Error(String(json?.error_description || json?.error || text || "Zoho OAuth exchange failed"));
      }
    }
    return json;
  }

  static async refreshAccessToken(refreshToken: string) {
    const response = await fetch(`${await this.getAccountsBaseUrl()}/oauth/v2/token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: await this.getClientId(),
        client_secret: await this.getClientSecret(),
      }).toString(),
      cache: "no-store",
    });
    const text = await response.text();
    const json = text ? (JSON.parse(text) as ZohoTokenResponse) : null;
    if (!response.ok || !json?.access_token) {
      throw new Error(String(json?.error_description || json?.error || text || "Zoho OAuth refresh failed"));
    }
    if (json.refresh_token) {
      await setZohoInvoiceRefreshToken(String(json.refresh_token));
    }
    return json;
  }

  static async listOrganizations(accessToken: string) {
    const response = await fetch(`${await this.getApiBaseUrl()}/organizations`, {
      method: "GET",
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    const text = await response.text();
    const json = text ? JSON.parse(text) : null;
    if (!response.ok || (json && typeof json.code === "number" && json.code !== 0)) {
      throw new Error(String(json?.message || text || "Zoho organizations lookup failed"));
    }
    return Array.isArray(json?.organizations) ? (json.organizations as ZohoOrganization[]) : [];
  }

  static pickOrganization(organizations: ZohoOrganization[], currentOrganizationId?: string) {
    if (currentOrganizationId) {
      const existing = organizations.find((org) => String(org.organization_id || "") === currentOrganizationId);
      if (existing?.organization_id) return String(existing.organization_id);
    }
    const preferred = organizations.find((org) => org.is_default_org) || organizations[0];
    return String(preferred?.organization_id || "");
  }

  static async persistConnection(input: { refreshToken?: string; organizationId?: string; accountsBaseUrl?: string; apiDomain?: string }) {
    const currentSetup = await getZohoSetupSettings();
    if (input.refreshToken) {
      await setZohoInvoiceRefreshToken(input.refreshToken);
    }
    if (input.organizationId) {
      await setZohoInvoiceOrganizationId(input.organizationId);
    }
    if (input.accountsBaseUrl || input.apiDomain) {
      await setZohoSetupSettings({
        clientId: currentSetup.clientId,
        clientSecret: currentSetup.clientSecret,
        redirectUri: currentSetup.redirectUri,
        accountsBaseUrl: String(input.accountsBaseUrl || currentSetup.accountsBaseUrl).trim(),
        apiBaseUrl: String(input.apiDomain ? `${String(input.apiDomain).replace(/\/$/, "")}/invoice/v3` : currentSetup.apiBaseUrl).trim(),
        organizationId: input.organizationId || currentSetup.organizationId,
      });
    }
  }

  static async getHealth() {
    const [settings, provider, refreshToken, currentOrganizationId] = await Promise.all([
      getZohoInvoiceFeatureSettings(),
      getInvoiceProvider(),
      getZohoInvoiceRefreshToken(),
      getZohoInvoiceOrganizationId(),
    ]);

    if (!refreshToken) {
      return {
        provider: "ZOHO" as const,
        configured: settings.envConfigured,
        enabled: provider === "ZOHO",
        redirectUri: await this.getRedirectUri(),
        token: { success: false as const, tokenValid: false as const, error: "Missing Zoho refresh token" },
        organizations: [],
        organizationId: currentOrganizationId,
      };
    }

    try {
      const refreshed = await this.refreshAccessToken(refreshToken);
      const organizations = await this.listOrganizations(String(refreshed.access_token));
      return {
        provider: "ZOHO" as const,
        configured: settings.envConfigured,
        enabled: provider === "ZOHO",
        redirectUri: this.getRedirectUri(),
        token: { success: true as const, tokenValid: true as const },
        organizations: organizations.map((org) => ({
          id: String(org.organization_id || ""),
          name: String(org.name || ""),
          isDefault: Boolean(org.is_default_org),
        })),
        organizationId: currentOrganizationId || this.pickOrganization(organizations, currentOrganizationId),
      };
    } catch (error: any) {
      return {
        provider: "ZOHO" as const,
        configured: settings.envConfigured,
        enabled: provider === "ZOHO",
        redirectUri: this.getRedirectUri(),
        token: { success: false as const, tokenValid: false as const, error: String(error?.message || "Zoho health check failed") },
        organizations: [],
        organizationId: currentOrganizationId,
      };
    }
  }
}
