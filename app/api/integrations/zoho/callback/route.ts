import { NextRequest, NextResponse } from "next/server";
import { buildSettingsRedirect, consumeOAuthStateCookie, requireOwnerOrRootApi } from "@/app/api/integrations/_lib";
import { getZohoInvoiceOrganizationId } from "@/lib/settings";
import { ZohoConnectionHelper } from "@/lib/integrations/zoho-connection";

export async function GET(request: NextRequest) {
  const auth = await requireOwnerOrRootApi();
  if (!auth.ok) return auth.response;

  const storedState = await consumeOAuthStateCookie(ZohoConnectionHelper.stateCookieName);
  const incomingState = request.nextUrl.searchParams.get("state") || "";
  const locale = (() => {
    try {
      return JSON.parse(storedState || "{}")?.locale || "en";
    } catch {
      return "en";
    }
  })();

  if (!storedState || !incomingState || storedState !== incomingState) {
    return NextResponse.redirect(new URL(buildSettingsRedirect(locale, "zoho", "error", "Invalid Zoho OAuth state"), request.url));
  }

  const error = request.nextUrl.searchParams.get("error");
  if (error) {
    return NextResponse.redirect(
      new URL(buildSettingsRedirect(locale, "zoho", "error", request.nextUrl.searchParams.get("error_description") || error), request.url)
    );
  }

  const code = request.nextUrl.searchParams.get("code") || "";
  const accountsServer = request.nextUrl.searchParams.get("accounts-server") || "";
  if (!code) {
    return NextResponse.redirect(new URL(buildSettingsRedirect(locale, "zoho", "error", "Missing Zoho authorization code"), request.url));
  }

  try {
    const token = await ZohoConnectionHelper.exchangeCode({ code, accountsServer });
    const currentOrganizationId = await getZohoInvoiceOrganizationId();
    const organizations = await ZohoConnectionHelper.listOrganizations(String(token.access_token || ""));
    const organizationId = ZohoConnectionHelper.pickOrganization(organizations, currentOrganizationId);
    await ZohoConnectionHelper.persistConnection({
      refreshToken: token.refresh_token ? String(token.refresh_token) : undefined,
      organizationId,
      accountsBaseUrl: accountsServer || undefined,
      apiDomain: token.api_domain ? String(token.api_domain) : undefined,
    });
    return NextResponse.redirect(new URL(buildSettingsRedirect(locale, "zoho", "connected"), request.url));
  } catch (oauthError: any) {
    return NextResponse.redirect(
      new URL(buildSettingsRedirect(locale, "zoho", "error", String(oauthError?.message || "Zoho connection failed")), request.url)
    );
  }
}
