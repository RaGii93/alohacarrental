import { randomUUID } from "crypto";
import { getBaseUrl } from "@/lib/seo";
import {
  checkQuickBooksRefreshToken,
  getQuickBooksHealth,
  getQuickBooksRuntimePreview,
} from "@/lib/quickbooks";
import {
  getQuickBooksRealmId,
  getQuickBooksSetupSettings,
  setQuickBooksRealmId,
  setQuickBooksRefreshToken,
} from "@/lib/settings";

type QuickBooksTokenResponse = {
  refresh_token?: string;
  access_token?: string;
};

export class QuickBooksConnectionHelper {
  static stateCookieName = "qb_oauth_state";

  static async getRedirectUri() {
    const setup = await getQuickBooksSetupSettings();
    return setup.redirectUri || `${getBaseUrl()}/api/integrations/quickbooks/callback`;
  }

  static async getClientId() {
    return (await getQuickBooksSetupSettings()).clientId;
  }

  static async getClientSecret() {
    return (await getQuickBooksSetupSettings()).clientSecret;
  }

  static async getEnvironment() {
    return (await getQuickBooksSetupSettings()).environment;
  }

  static getAuthorizeBaseUrl() {
    return "https://appcenter.intuit.com/connect/oauth2";
  }

  static createState(locale: string) {
    return JSON.stringify({
      nonce: randomUUID(),
      locale,
      provider: "quickbooks",
    });
  }

  static async buildAuthorizeUrl(state: string) {
    const params = new URLSearchParams({
      client_id: await this.getClientId(),
      response_type: "code",
      scope: "com.intuit.quickbooks.accounting",
      redirect_uri: await this.getRedirectUri(),
      state,
    });
    return `${this.getAuthorizeBaseUrl()}?${params.toString()}`;
  }

  static async exchangeCode(input: { code: string }) {
    const response = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${await this.getClientId()}:${await this.getClientSecret()}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: input.code,
        redirect_uri: await this.getRedirectUri(),
      }).toString(),
      cache: "no-store",
    });
    const text = await response.text();
    const json = text ? (JSON.parse(text) as QuickBooksTokenResponse & { error_description?: string; error?: string }) : null;
    if (!response.ok || !json?.refresh_token) {
      throw new Error(String(json?.error_description || json?.error || text || "QuickBooks OAuth exchange failed"));
    }
    return json;
  }

  static async persistConnection(input: { refreshToken: string; realmId?: string }) {
    await setQuickBooksRefreshToken(input.refreshToken);
    if (input.realmId) {
      await setQuickBooksRealmId(input.realmId);
    }
  }

  static async getHealth() {
    const [runtime, token, health, persistedRealmId] = await Promise.all([
      getQuickBooksRuntimePreview(),
      checkQuickBooksRefreshToken(),
      getQuickBooksHealth(),
      getQuickBooksRealmId(),
    ]);

    return {
      provider: "QUICKBOOKS" as const,
      configured: runtime.envConfigured,
      redirectUri: await this.getRedirectUri(),
      realmId: persistedRealmId || runtime.realmId,
      token,
      health,
      runtime,
    };
  }
}
